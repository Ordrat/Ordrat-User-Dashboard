/**
 * Lightweight client-side session presence cache.
 *
 * When the user is authenticated we persist { timestamp, shopId } in localStorage.
 * If they go offline and NextAuth's /api/auth/session becomes unreachable,
 * the dashboard layout uses hadRecentSession() to distinguish a genuine
 * sign-out from a false-positive "unauthenticated" caused by network loss.
 *
 * The key is cleared by the explicit sign-out flow so a real sign-out
 * still redirects to /signin as expected.
 */

export const LAST_AUTH_KEY = 'ordrat:last_auth';
export const GRACE_MS = 48 * 60 * 60 * 1000; // 48 h

interface SessionPresence {
  timestamp: number;
  shopId: string | null;
}

function read(): SessionPresence | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LAST_AUTH_KEY);
    if (!raw) return null;
    // Support legacy format (raw timestamp string from before this refactor)
    if (!raw.startsWith('{')) {
      return { timestamp: parseInt(raw, 10), shopId: null };
    }
    return JSON.parse(raw) as SessionPresence;
  } catch {
    return null;
  }
}

export function hadRecentSession(): boolean {
  const presence = read();
  return !!presence && Date.now() - presence.timestamp < GRACE_MS;
}

export function getSessionShopId(): string | null {
  return read()?.shopId ?? null;
}

export function markAuthenticated(shopId?: string | null): void {
  if (typeof window === 'undefined') return;
  const presence: SessionPresence = {
    timestamp: Date.now(),
    shopId: shopId ?? null,
  };
  localStorage.setItem(LAST_AUTH_KEY, JSON.stringify(presence));
}

export function clearSessionCache(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LAST_AUTH_KEY);
}
