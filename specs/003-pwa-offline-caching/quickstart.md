# Quickstart: PWA & Offline Caching Validation

**Feature**: 003-pwa-offline-caching
**Date**: 2026-03-26

---

## Prerequisites

- `npm run build` completes without errors
- App served over HTTPS (or `localhost` for dev)
- Chrome/Edge for testing (best DevTools PWA support)

---

## Validation Steps

### 1. Manifest & Installability

1. Run `npm run build && npm run start`
2. Open `http://localhost:3000` in Chrome
3. Open DevTools → **Application** → **Manifest**
4. Verify:
   - `name`: "Ordrat Dashboard"
   - `short_name`: "Ordrat"
   - `display`: "standalone"
   - Icons: 192×192 and 512×512 PNG shown
   - No manifest warnings/errors
5. Look for the "Install" icon in the Chrome address bar (or the browser prompt)
6. Click install → verify standalone window opens without browser chrome

### 2. Service Worker Registration

1. DevTools → **Application** → **Service Workers**
2. Verify:
   - Status: "activated and is running"
   - Source: `sw.js`
   - No errors in console
3. Click "Update on reload" checkbox OFF (to test normal lifecycle)

### 3. Offline Fallback — Cached Pages

1. Navigate to: Dashboard, Shop Profile, Branches (load each page)
2. DevTools → **Network** → check "Offline"
3. Reload the current page → should load from cache with offline banner visible
4. Navigate to each previously visited page → all should render with cached data
5. Navigate to a page you did NOT visit → should show offline fallback page
6. Verify offline fallback page shows bilingual text (switch between /en and /ar)

### 4. Offline Indicator

1. While online, verify NO offline banner is shown
2. Check "Offline" in Network tab → banner should appear within 1 second
3. Uncheck "Offline" → banner should disappear
4. Verify banner text is in the correct language (English or Arabic based on locale)

### 5. API Data Caching

1. While online, open Shop Profile page (triggers API call)
2. DevTools → **Application** → **Cache Storage** → find `ordrat-api-cache`
3. Verify the GET API response is cached
4. Go offline → reload shop profile → data should display from cache
5. Come back online → verify data refreshes (check Network tab for new request)

### 6. Write Operations Offline

1. Go offline
2. Try to submit a form (e.g., edit shop name, create branch)
3. Verify an error toast/message appears: "This action requires an internet connection"
4. Verify NO silent data loss — the form remains filled with user's input

### 7. Session Expiry Warning

1. Sign in normally
2. In DevTools → Application → Storage → find the NextAuth session cookie
3. Go offline
4. Wait for the JWT to expire (or manually set a past expiry in dev tools)
5. Verify a warning badge appears: "Session may be expired — reconnect to continue editing"
6. Come back online → verify the badge disappears (session refreshes automatically)

### 8. SW Update Notification

1. Deploy a new build (or manually update `sw.js` content)
2. Reload the app → after a few seconds, a toast should appear: "A new version is available"
3. Click "Reload" → page refreshes with new version
4. If you ignore the toast and close all tabs, then reopen → new version should be active

### 9. Lighthouse PWA Audit

1. Run `npm run build && npm run start`
2. Open Chrome → navigate to `http://localhost:3000`
3. DevTools → **Lighthouse** → check "Progressive Web App" category
4. Run audit → **target: score 100** (all PWA checks pass)

### 10. Non-SW Browser Graceful Degradation

1. Open the app in a browser with Service Worker support disabled (e.g., Firefox with `dom.serviceWorkers.enabled = false`)
2. Verify:
   - No JavaScript errors in console
   - All online features work normally
   - No broken UI from missing SW
