import { getSession, signOut } from 'next-auth/react';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? '';

interface OrdratFetchOptions extends RequestInit {
  _retry?: boolean;
}

export async function ordratFetch<T = unknown>(
  path: string,
  options: OrdratFetchOptions = {},
): Promise<T> {
  const session = await getSession();
  const token = session?.accessToken;

  const { _retry, ...fetchOptions } = options;

  // Don't set Content-Type for FormData — the browser sets it with the multipart boundary
  const isFormData = fetchOptions.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(fetchOptions.headers as Record<string, string> | undefined),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...fetchOptions, headers });

  if (res.status === 401 && !_retry) {
    // Force session refresh then retry once
    const refreshed = await getSession();
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

    // Still 401 after refresh — sign out
    await signOut({ callbackUrl: '/signin' });
    throw new Error('Session expired');
  }

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${path}`);
  }

  // Handle empty responses (204 No Content)
  const contentType = res.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
