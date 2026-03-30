# Research: PWA Offline Resilience

**Feature**: 004-pwa-offline-resilience
**Date**: 2026-03-28

---

## Decision 1: Offline Queue Storage — IndexedDB via `idb`

**Decision**: Migrate the offline queue from `localStorage` to IndexedDB using the `idb` library (~1.2 KB gzipped).

**Rationale**:
- `localStorage` has a hard 5 MB limit per origin. A single queued request with a large JSON body can exhaust this.
- `localStorage` is synchronous — blocks the main thread. With many queued items, this causes jank.
- `localStorage` cannot store binary data (`FormData`, `Blob`, `File`).
- IndexedDB supports structured data, has storage limits in the hundreds of MB, and is asynchronous.
- `idb` is the lightest option (~1.2 KB) with a clean Promise-based API. The queue is a simple ordered list — no need for Dexie's query engine (~16 KB).

**Alternatives considered**:
- `dexie` (~16 KB): Overkill for a simple queue. Full relational DB abstraction not needed.
- `idb-keyval` (~600 bytes): Too simple — no object stores, just key-value. We need ordered records.
- `localforage`: Wrapper that falls back to localStorage. Adds complexity without clear benefit.
- Keep `localStorage`: Rejected due to 5 MB limit and synchronous API.

---

## Decision 2: Online vs Offline Save Routing — Check `navigator.onLine` Before Fetch

**Decision**: Before every mutation, check `navigator.onLine`. If offline, skip the API call entirely and queue to IndexedDB. If online, fire the API call normally with a pessimistic spinner.

**Rationale**:
- The 003 implementation fires the fetch regardless and relies on timeout (8 seconds) to detect offline. This causes the "loading forever" bug.
- `navigator.onLine` is synchronous and available immediately. Combined with the existing `useOnlineStatus` hook (which polls `/api/ping` every 15 seconds), offline detection is fast.
- Online save failures (server 500, validation errors) show error toast immediately — not queued. Clean separation of concerns.

**Alternatives considered**:
- All saves through queue (even online): Adds unnecessary latency when online. Queue processing adds at least one event-loop cycle.
- Try fetch with 3-second timeout, then queue: Still causes 3 seconds of spinner for offline users. Rejected.
- Service worker BackgroundSync only: Not supported in Safari/Firefox (~40% of web users). Must have client-side fallback.

---

## Decision 3: Session Preservation While Offline — Dual-Layer Approach

**Decision**: Keep the existing dual-layer session strategy (SW cache + `hadRecentSession()` heuristic) but fix the critical timing issue where `proxy.ts` redirects before the client-side grace period activates.

**Rationale**:
- **Layer 1 — SW cache**: The service worker caches `/api/auth/session` responses with NetworkFirst + 48h TTL. When offline, `useSession()` gets the cached session. This works.
- **Layer 2 — `hadRecentSession()`**: The dashboard layout checks this before redirecting. The 4-second safety valve for stuck `loading` state is good.
- **The bug**: `proxy.ts` runs server-side on every navigation. When online with an expired token, it redirects to `/signin` before client code runs. Fix: in `proxy.ts`, when the refresh fails, let the request through to the client-side where `hadRecentSession()` can handle it gracefully, rather than hard-redirecting.

**Alternatives considered**:
- Store JWT in IndexedDB: Rejected — security risk. JWT belongs in HttpOnly cookie, inaccessible to JS.
- Remove `proxy.ts` auth checks entirely: Violates Constitution Principle IV (server-side route protection). Must keep server-side checks but soften the offline failure mode.
- Client-only auth: Violates Constitution. Not an option.

---

## Decision 4: Background Sync Strategy — Client-Side Primary, SW Enhancement

**Decision**: Use the client-side IndexedDB queue (replayed by `useOfflineQueue` hook on online transition) as the primary mechanism. Add `BackgroundSyncPlugin` in the SW as a Chromium-only enhancement.

**Rationale**:
- Background Sync API is only supported in Chromium (Chrome, Edge, Opera). Not in Safari/iOS or Firefox.
- The client-side queue works in all browsers. It replays on the `online` event + `useOnlineStatus` transition.
- The SW `BackgroundSyncPlugin` catches the edge case where a user closes the tab before the client queue replays — the SW fires the sync event when connectivity returns.
- Deduplication: include the queue item ID in a custom header so the SW can check if it already has that request queued.

**Alternatives considered**:
- SW-only BackgroundSync: Not supported in Safari/Firefox. Would leave ~40% of users without offline save capability.
- Client-only queue: Works everywhere but misses the "tab closed" scenario in Chromium. Acceptable trade-off, but the SW enhancement is cheap to add.

---

## Decision 5: Pre-Caching Strategy — Fetch All Menu Routes + API Data

**Decision**: Extend the existing `usePagePrecache` hook to fetch all menu routes (including nested/sub-routes) AND their associated API data. Use `postMessage` to the SW for direct cache population.

**Rationale**:
- Current implementation only pre-caches 3 routes (`/dashboard`, `/shop`, `/branches`). Missing nested routes.
- Fetching pages warms the SW's `cacheOnNavigation` handler, which caches both HTML and RSC payloads.
- API data for each page must also be pre-fetched. Without it, cached pages show empty shells offline.
- Progress is reported via the existing progress bar component — extended to show "X of Y pages cached."

**Alternatives considered**:
- `cache.addAll()` via SW postMessage: More efficient but doesn't trigger page-level data fetches. Only caches the HTML shell.
- Precache everything at build time: Not feasible for authenticated API data. Static shells are already precached by Serwist.

---

## Decision 6: Header Pending Counter / Sync Progress Bar Design

**Decision**: Show pending count at rest (e.g., "5 pending"), animated progress bar during active sync ("3 of 5 synced"), hidden when queue is empty.

**Rationale**:
- The existing `OfflineProgressBar` component already lives in the header. It shows offline status and queue depth.
- Extending it with sync progress is a natural evolution. Two visual states (rest/syncing) map cleanly to the queue's state machine.
- Running total of all requests ever made was rejected — grows uselessly large over 12 hours.

**Alternatives considered**:
- Always-visible progress bar: Wastes header space when nothing is pending. Rejected.
- Toast-only notifications: Insufficient for 12-hour sessions. The counter provides at-a-glance queue depth.
- Separate sync dialog: Over-engineered. A header indicator is sufficient.

---

## Decision 7: `ordratFetch()` Mutation Handling — Fast Offline Detection

**Decision**: Modify `ordratFetch()` to check `navigator.onLine` before attempting any mutation. If offline, enqueue to IndexedDB and return a synthetic success response immediately.

**Rationale**:
- The current 8-second timeout in `ordratFetch()` is the root cause of the "loading forever" UX bug. Mutations hang for 8 seconds before timing out and queueing.
- `navigator.onLine` is synchronous and returns `false` when the device has no network adapter connected or airplane mode is active.
- For edge cases where `navigator.onLine` is `true` but network is actually down (captive portal, firewall), the existing timeout acts as a fallback — but reduced to 3 seconds for mutations.
- The `_noQueue: true` flag (used during sync replay) is preserved to prevent re-queueing during flush.

**Alternatives considered**:
- Remove timeout entirely, rely only on `navigator.onLine`: `navigator.onLine` can return `true` when behind a captive portal. Need the timeout as fallback.
- Increase timeout: Makes the UX worse. Rejected.
- Pre-flight ping before every mutation: Adds latency when online. Rejected.

---

## Decision 8: Auth Redirect Prevention — Soften `proxy.ts` for Offline Resilience

**Decision**: Modify `proxy.ts` to not hard-redirect when the token refresh fails. Instead, let the request through to the client-side dashboard layout, which has the `hadRecentSession()` grace period.

**Rationale**:
- `proxy.ts` runs server-side. It calls `getToken()` which reads the JWT from the cookie. If the token is expired and refresh fails, it redirects to `/signin`.
- This redirect happens before client code runs, so `hadRecentSession()` never gets a chance to prevent it.
- The fix: when `proxy.ts` detects an expired token but refresh fails (network error), pass through instead of redirecting. The dashboard layout will handle the offline case.
- When the user is truly online and the token is expired (legitimate auth failure), the dashboard layout will redirect to sign-in since `navigator.onLine` will be `true`.

**Alternatives considered**:
- Disable proxy for dashboard routes: Violates Constitution Principle IV. Rejected.
- Cookie-based offline flag: Client sets `X-Offline: true` cookie before going offline. Proxy checks it. Complex and unreliable.
- Extend JWT lifetime to 48 hours: Backend change not under our control. And doesn't fix the core timing issue.

---

## Decision 9: `CacheableResponsePlugin` for API Cache

**Decision**: Add `CacheableResponsePlugin` to the API cache rule to only cache successful responses (status 200, 0).

**Rationale**:
- Currently, a 500 error response from the API could be cached by the SW and served offline as if it were valid data.
- `CacheableResponsePlugin({ statuses: [0, 200] })` ensures only successful responses enter the cache.
- Status 0 is included for opaque cross-origin responses.

**Alternatives considered**:
- Manual response validation in SW: More code, same result. Plugin is cleaner.
- Don't cache cross-origin at all: Would break the API caching strategy entirely.
