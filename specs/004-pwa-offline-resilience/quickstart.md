# Quickstart: PWA Offline Resilience

**Feature**: 004-pwa-offline-resilience
**Date**: 2026-03-28

---

## Prerequisites

- Node.js 20+, pnpm installed
- Project cloned and on branch `004-pwa-offline-resilience`
- `pnpm install` completed (including new `idb` dependency)

---

## Build & Run

```bash
# Install dependencies (adds `idb`)
pnpm install

# Production build (compiles SW, type checks)
pnpm run build

# Start production server (SW enabled)
pnpm run start
```

> **Note**: `pnpm run dev` disables the service worker. You MUST use `pnpm run build && pnpm run start` to test offline features.

---

## Validation Steps

### Test 1: No Auth Redirect While Offline (P1 — Critical)

1. Open `http://localhost:3000` in Chrome
2. Sign in with valid credentials
3. Navigate to `/dashboard`, then `/shop`, then `/branches`
4. Open DevTools → Network → check "Offline"
5. Navigate between pages for 2+ minutes
6. **Expected**: All cached pages load. No redirect to `/signin`. No error blocking navigation.
7. Uncheck "Offline"
8. **Expected**: Session refreshes silently. No sign-in prompt.

### Test 2: Pre-Cache All Pages (P2)

1. Sign in and go to `/dashboard`
2. Click the "Cache Offline" button in the toolbar
3. **Expected**: Progress indicator shows "Caching X of Y pages" and advances
4. Wait for completion
5. Open DevTools → Network → check "Offline"
6. Navigate to a page you NEVER visited (e.g., `/branches` if you only visited `/dashboard`)
7. **Expected**: Page loads with cached data

### Test 3: Offline Save Queue (P3)

1. Sign in, navigate to `/shop`
2. Open DevTools → Network → check "Offline"
3. Edit the shop name, click Save
4. **Expected**:
   - Save button does NOT spin forever
   - Toast: "Change queued — will sync when online"
   - Header shows "1 pending"
5. Make 2 more edits and save each
6. **Expected**: Header shows "3 pending"
7. Hover/tap the counter
8. **Expected**: Popover shows summary of queued operations

### Test 4: Auto-Sync on Reconnect (P4)

1. Continue from Test 3 (3 pending items)
2. Uncheck "Offline" in DevTools
3. **Expected**:
   - Header transitions to progress bar: "1 of 3 synced" → "2 of 3" → "3 of 3"
   - Toast: "All changes saved"
   - Counter disappears
4. Verify changes persisted: reload page, check data matches edits

### Test 5: Queue Persistence Across Restart

1. Sign in, go offline, make 2 edits and save
2. Close the browser entirely
3. Reopen the browser, navigate to the dashboard
4. **Expected**: Header shows "2 pending" (queue survived restart)
5. Go online
6. **Expected**: Auto-sync fires and completes

### Test 6: Session Expiry While Offline

1. Sign in, note the session expiry time
2. Go offline
3. Wait until the session token would normally expire (or manually advance the clock)
4. Navigate between cached pages
5. **Expected**: No redirect to sign-in. Pages still load.
6. Go online
7. **Expected**: Silent token refresh. If refresh token expired too, redirect to sign-in (acceptable since network is available).

### Test 7: Lighthouse PWA Audit

1. Build and start production server
2. Open Chrome DevTools → Lighthouse
3. Run PWA audit
4. **Expected**: Score = 100 (all PWA checks pass)

---

## Troubleshooting

| Issue | Check |
|-------|-------|
| SW not registering | Must use `pnpm run build && pnpm run start`, not `pnpm run dev` |
| Pages not caching | Check DevTools → Application → Cache Storage for `serwist-precache` entries |
| Queue not persisting | Check DevTools → Application → IndexedDB → `ordrat-offline` → `mutations` |
| Auth redirect while offline | Check `proxy.ts` — the softer redirect logic should pass through on network error |
| Progress bar not showing | Check `pendingCount > 0` in React DevTools for the `OfflineProgressBar` component |
| Sync not starting | Check `navigator.onLine` is `true` and `useOnlineStatus` shows online |
