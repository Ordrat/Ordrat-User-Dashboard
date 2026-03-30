import { getSession, signOut } from 'next-auth/react';
import { onlineManager } from '@tanstack/react-query';
import { enqueue } from './offline-queue';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? '';

// How long to wait for a mutation response before treating it as an offline
// drop and queueing it in IndexedDB. 3 s covers slow connections while keeping
// the UX snappy when the device is actually offline.
const MUTATION_TIMEOUT_MS = 3000;

interface OrdratFetchOptions extends RequestInit {
  _retry?: boolean;
  /** Skip offline queuing — set when replaying queued requests during sync. */
  _noQueue?: boolean;
  /** Human-readable entity label for deduplication (e.g. "Shop Profile"). */
  _entityType?: string;
  /** Entity ID for deduplication — same type+id replaces the older queued item. */
  _entityId?: string;
}

/**
 * Serialize FormData text fields to JSON for IndexedDB storage.
 * File (binary) entries are silently dropped — they cannot be serialized.
 */
function serializeFormDataText(fd: FormData): string {
  const obj: Record<string, string> = {};
  fd.forEach((value, key) => {
    if (typeof value === 'string') obj[key] = value;
  });
  return JSON.stringify(obj);
}

/**
 * Enqueue a mutation for later sync, handling both JSON and FormData bodies.
 */
async function enqueueRequest(
  path: string,
  method: string,
  isFormData: boolean,
  body: RequestInit['body'],
  entityType: string | null,
  entityId: string | null,
): Promise<void> {
  await enqueue({
    path,
    method,
    body: isFormData
      ? serializeFormDataText(body as FormData)
      : typeof body === 'string' ? body : null,
    isFormData,
    entityType,
    entityId,
  });
}

export async function ordratFetch<T = unknown>(
  path: string,
  options: OrdratFetchOptions = {},
): Promise<T> {
  const { _retry, _noQueue, _entityType, _entityId, ...fetchOptions } = options;

  const isFormData = fetchOptions.body instanceof FormData;
  const method = (fetchOptions.method ?? 'GET').toUpperCase();
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  // Queueable: all mutations except replays (_noQueue).
  // FormData is supported — text fields are serialized; file fields dropped.
  const canQueue = !_noQueue && isMutation;

  // ── Offline pre-check ─────────────────────────────────────────────────────
  // onlineManager.isOnline() is updated by useOnlineStatus (ping-based) and
  // by TanStack Query's own navigator.online listener. It covers both:
  //   • Real offline (airplane mode): false immediately via browser event.
  //   • DevTools "Offline": false after ~3 s ping timeout.
  // Checking here — before getSession() — avoids a wasted SW NetworkFirst
  // round-trip (which takes up to 3 s) when we already know we're offline.
  if (canQueue && !onlineManager.isOnline()) {
    await enqueueRequest(path, method, isFormData, fetchOptions.body, _entityType ?? null, _entityId ?? null);
    // Resolving with undefined lets useMutation settle as "success" —
    // no spinning button, no error state. useOfflineQueue shows the toast.
    return undefined as T;
  }

  // ── Session token ─────────────────────────────────────────────────────────
  // getSession() fetches /api/auth/session through the SW (NetworkFirst,
  // 3 s network timeout). Errors are caught so the rest of the function
  // still runs — the request is sent without auth and the API handles the 401.
  const session = await getSession().catch(() => null);
  const token = session?.accessToken;

  const headers: Record<string, string> = {
    // Don't set Content-Type for FormData — browser sets it with the boundary.
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(fetchOptions.headers as Record<string, string> | undefined),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // ── Mutation timeout ──────────────────────────────────────────────────────
  // Applies to ALL mutations so none hangs indefinitely when DevTools Offline
  // is toggled mid-request (navigator.onLine stays true but network is blocked).
  // After MUTATION_TIMEOUT_MS the signal fires, the catch block queues it.
  let abortController: AbortController | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  if (isMutation) {
    abortController = new AbortController();
    timeoutId = setTimeout(() => abortController!.abort(), MUTATION_TIMEOUT_MS);
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...fetchOptions,
      headers,
      signal: abortController?.signal,
    });
    if (timeoutId) clearTimeout(timeoutId);
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    // Network failure or abort timeout → queue the mutation.
    if (canQueue) {
      await enqueueRequest(path, method, isFormData, fetchOptions.body, _entityType ?? null, _entityId ?? null);
      return undefined as T;
    }
    throw err;
  }

  // ── 401 handling ─────────────────────────────────────────────────────────
  if (res.status === 401 && !_retry) {
    // Attempt a token refresh and retry once.
    const refreshed = await getSession().catch(() => null);
    if (refreshed?.accessToken && refreshed.accessToken !== token) {
      return ordratFetch<T>(path, {
        ...options,
        _retry: true,
        headers: {
          ...(options.headers as Record<string, string> | undefined),
          Authorization: `Bearer ${refreshed.accessToken}`,
        },
      });
    }

    // Still 401 after refresh — sign out only when network is available.
    // Offline 401s are likely stale cached responses; signing out would
    // destroy the session and block further offline work.
    if (onlineManager.isOnline()) {
      await signOut({ callbackUrl: '/signin' });
      throw new Error('Session expired');
    }
    // Offline: swallow silently and keep the session alive.
    return undefined as T;
  }

  if (!res.ok) {
    let errBody = '';
    try { errBody = await res.text(); } catch { /* ignore */ }
    throw new Error(`API error ${res.status}: ${path}${errBody ? ` — ${errBody}` : ''}`);
  }

  // 204 No Content and other non-JSON responses.
  const contentType = res.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
