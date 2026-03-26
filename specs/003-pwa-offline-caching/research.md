# Research: PWA & Offline Caching

**Feature**: 003-pwa-offline-caching
**Date**: 2026-03-26

---

## R-001: Serwist as the Service Worker Framework

**Decision**: Use `@serwist/next` + `serwist` for service worker management.

**Rationale**: Serwist is the official Next.js documentation recommendation for PWA with the App Router. It is a maintained fork of Google's Workbox, purpose-built for Next.js. It provides:
- `withSerwistInit()` — wraps `next.config.mjs` to inject SW build pipeline
- `defaultCache` — pre-configured runtime caching strategies for Next.js assets
- Built-in precaching with injection point (`self.__SW_MANIFEST`)
- Offline fallback via the `fallbacks` option
- `cacheOnNavigation: true` for caching link-navigated routes
- `reloadOnOnline: true` for automatic reload after reconnection

**Alternatives considered**:
- `next-pwa` (deprecated, no App Router support)
- Manual Workbox integration (too much boilerplate, no Next.js build integration)
- `@ducanh2912/next-pwa` (fork, less actively maintained than Serwist)

---

## R-002: Service Worker Source and Build Flow

**Decision**: Create service worker source at `app/sw.ts`, which compiles to `public/sw.js` during build.

**Rationale**: Serwist's `withSerwistInit` expects `swSrc` pointing to a TypeScript source file within the app directory. During `next build`, it:
1. Compiles `app/sw.ts` → `public/sw.js`
2. Replaces `self.__SW_MANIFEST` with the actual precache manifest (hashed asset URLs)
3. Registers the SW automatically in the client bundle (unless `register: false`)

The `public/sw.js` file is gitignored (generated artifact). The source of truth is `app/sw.ts`.

---

## R-003: Caching Strategies

**Decision**: Three-tier caching strategy:

| Tier | Target | Strategy | TTL | Plugin |
|------|--------|----------|-----|--------|
| 1 — Precache | Next.js build output (JS, CSS, HTML shells) | Precache (built-in) | Indefinite (hash-versioned) | — |
| 2 — Static Assets | Fonts, images in `public/` | CacheFirst | 30 days | ExpirationPlugin(maxEntries: 64) |
| 3 — API Data | GET `api.ordrat.com/*` | StaleWhileRevalidate | 24 hours | ExpirationPlugin(maxAgeSeconds: 86400) |

**Rationale**:
- **Precache** is automatic via Serwist's `__SW_MANIFEST` — all build-output chunks get versioned entries.
- **CacheFirst** for static assets avoids re-downloading unchanged images/fonts.
- **StaleWhileRevalidate** for API data is the ideal tradeoff: users see cached data instantly, and a background request updates the cache. This directly satisfies US-2 (offline access) and US-3 (auto-refresh on reconnection).
- POST/PUT/PATCH/DELETE requests are excluded via the matcher (only `request.method === 'GET'`).

**Alternatives considered**:
- NetworkFirst for API data — rejected because it blocks rendering until the network responds (or times out), defeating the "instant load" goal.
- CacheFirst for API data — rejected because it could serve very stale data without ever refreshing.

---

## R-004: Web App Manifest Approach

**Decision**: Use Next.js built-in `app/manifest.ts` (dynamic manifest function) rather than a static JSON file.

**Rationale**: Next.js App Router natively supports `app/manifest.ts` which exports a function returning `MetadataRoute.Manifest`. This approach:
- Gets proper TypeScript types
- Can reference `process.env` for dynamic `start_url` (respecting `basePath`)
- Is automatically served at `/manifest.webmanifest` by Next.js
- Replaces the existing `public/media/app/site.webmanifest` (which has empty `name`/`short_name`)

The existing `site.webmanifest` has empty `name` and `short_name` fields and references icon paths at root (`/android-chrome-192x192.png`). The actual icon files exist at `public/media/app/android-chrome-192x192.png` and `public/media/app/android-chrome-512x512.png` — so the paths in the manifest are wrong. The new `app/manifest.ts` will fix this.

---

## R-005: Offline Fallback Page

**Decision**: Create `app/[locale]/~offline/page.tsx` as the offline fallback route, pre-cached by Serwist.

**Rationale**: Serwist's `fallbacks.entries` option intercepts navigation requests that fail (offline + not cached) and serves a pre-cached fallback URL. The convention is `/~offline`. Since the app uses locale prefixing (`/en/...`, `/ar/...`), the fallback must be locale-aware. The SW config will precache both `/en/~offline` and `/ar/~offline`.

The fallback page will:
- Use the existing i18next system for bilingual text
- Display the Ordrat logo
- Show "You're offline — this page hasn't been cached yet"
- Include a "Try again" button that calls `window.location.reload()`

---

## R-006: Offline Indicator Component

**Decision**: Create a `components/pwa/offline-indicator.tsx` client component that uses `navigator.onLine` + `online`/`offline` events.

**Rationale**: The component renders a dismissible banner at the top of the page when the device is offline. It uses the existing `Alert` component from `components/ui/alert.tsx` for consistent styling and i18next for bilingual text.

TanStack Query's `onlineManager` is also considered — it already tracks online status and pauses queries when offline. The offline indicator should integrate with this: when `onlineManager.isOnline()` is `false`, show the banner.

---

## R-007: Session Expiry Warning Badge

**Decision**: Create a `components/pwa/session-warning.tsx` client component that checks JWT expiry while offline.

**Rationale**: Per clarification, when offline and JWT is expired, the app must show a warning badge ("Session may be expired") but NOT force logout. The component will:
1. Read the session's `expires` timestamp from NextAuth's `useSession()`
2. Compare against `Date.now()`
3. If expired AND `!navigator.onLine` → show warning badge
4. On reconnection (`online` event) → silently trigger `getSession()` to attempt token refresh
5. If refresh succeeds → remove badge; if fails → redirect to signin

---

## R-008: SW Version Update Notification

**Decision**: Use the `sonner` toast (already mounted in layout) to notify the seller of a new SW version, with a "Reload" action button.

**Rationale**: The app already has `<Toaster />` from sonner in `app/layout.tsx`. Using `toast()` with `action` button is the simplest path — no new component needed. The toast fires when the SW `controllerchange` event is detected. Since the decision is browser-default lifecycle (no forced takeover), `skipWaiting` is set to `true` in the SW but the app only reloads when the user clicks "Reload" in the toast (or naturally closes all tabs).

Wait — `skipWaiting: true` means the new SW activates immediately and `clientsClaim: true` means it takes over existing clients. This contradicts the user's decision of "browser default lifecycle."

**Correction**: Set `skipWaiting: false` in the SW to respect browser default lifecycle. The new SW will wait in the `waiting` state. The app detects the `waiting` SW via `registration.waiting`, shows the toast, and if the user clicks "Reload," it sends `postMessage({ type: 'SKIP_WAITING' })` to the waiting SW, which then calls `self.skipWaiting()`.

---

## R-009: SSG Applicability in This Dashboard

**Decision**: SSG is limited to the offline fallback page (`/~offline`) only. Dashboard pages remain dynamic (client-side rendered with TanStack Query).

**Rationale**: The spec mentions SSG for "non-user-specific layout/shell" pages. However, in this codebase:
- The root layout (`app/layout.tsx`) is already a server component (implicitly SSG-friendly)
- All dashboard routes (`/[locale]/dashboard/*`) require authentication and display user-specific data — they cannot be statically generated
- The app shell (sidebar, header, nav) is already rendered as part of the layout, which is cached by the service worker's precache manifest
- The offline fallback page is the only truly static, non-user-specific page

Forcing SSG on authenticated pages would require `export const dynamic = 'force-static'` which would break the data-fetching flow (TanStack Query expects client-side fetch). The service worker's precache of build-output HTML already achieves the "instant shell" goal without explicit SSG.

**Alternatives considered**:
- SSG for the dashboard shell with client-side data hydration — rejected because the layout is already a server component and the build output HTML is precached by Serwist automatically.

---

## R-010: `next.config.mjs` Integration

**Decision**: Wrap the existing config with `withSerwistInit()`, preserving `basePath` and `assetPrefix`.

**Rationale**: The current `next.config.mjs` is minimal (only `basePath` and `assetPrefix`). Wrapping it:

```ts
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [
    { url: "/en/~offline", revision: "..." },
    { url: "/ar/~offline", revision: "..." },
  ],
  cacheOnNavigation: true,
  reloadOnOnline: false,  // We handle this ourselves via TanStack Query + online events
  disable: process.env.NODE_ENV === "development",  // Disable SW in dev to avoid caching issues
});

export default withSerwist({
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
});
```

`disable: true` in development prevents the SW from caching dev assets and causing stale-code issues during development.

---

## R-011: TanStack Query Alignment with SW Cache

**Decision**: Keep `staleTime: 60_000` (1 minute) in QueryClient; add `refetchOnReconnect: true` as a default.

**Rationale**:
- The existing `staleTime: 60_000` is fine — TanStack Query treats data as "fresh" for 1 minute and refetches on window focus or component mount after that.
- The SW's StaleWhileRevalidate cache has a 24-hour TTL — this means even if TanStack Query decides to refetch, the SW may serve a cached response while updating in the background. The two layers complement each other:
  1. TanStack Query cache (in-memory, 1 min stale) → instant for same-session navigation
  2. SW cache (disk, 24h TTL) → fallback for offline or new sessions
- Adding `refetchOnReconnect: true` ensures that when the device comes back online, all active queries automatically refetch — satisfying US-3 (auto-refresh on reconnection) without custom code.

---

## R-012: Proxy/Middleware SW Interaction

**Decision**: Add `sw.js` and `manifest.webmanifest` to the proxy matcher exclusion list.

**Rationale**: The current `proxy.ts` matcher already excludes `*.js` and common static extensions. However, `sw.js` must be served without any redirect (locale prefix would break SW registration). The existing matcher pattern `.*\\.(?:...js...)$` already excludes `.js` files, so `public/sw.js` is served directly. The `manifest.webmanifest` generated by Next.js is served from `/_next/` or root — need to verify it's not intercepted by the proxy.

No changes needed to `proxy.ts` — the existing matcher exclusions already handle static assets including `sw.js`.

---

## R-013: User-Scoped API Cache Keys

**Decision**: Include the user's `shopId` (from NextAuth session) in the SW cache key for API responses.

**Rationale**: FR-010 requires that cached API responses for authenticated routes are not served to a different user. The simplest approach is to use a `CacheKeyWillBeUsed` plugin that appends the shopId to the cache key URL. However, the SW doesn't have direct access to the NextAuth session.

**Alternative approach**: Use separate cache names per user. When a user logs in, the app sends a `postMessage` to the SW with the current `shopId`. The SW uses this to namespace the API cache (e.g., `api-cache-${shopId}`). On logout, the app sends a message to clear the cache.

**Simpler approach chosen**: Since this is a single-seller dashboard (each seller manages their own shop), and the API already scopes responses by the Bearer token, the risk of cross-user cache leakage is low in practice. The primary scenario is the same device being used by different sellers. To handle this:
1. On NextAuth `signOut`, clear all SW API caches via `caches.delete('api-cache')`
2. The API cache name is fixed (`ordrat-api-cache`) and gets cleared on sign-out
3. This is sufficient because a different user signing in starts with a clean API cache

---

## R-014: Existing `site.webmanifest` Cleanup

**Decision**: Remove `public/media/app/site.webmanifest` after creating `app/manifest.ts`.

**Rationale**: The existing `site.webmanifest` has empty `name`/`short_name` fields and incorrect icon paths (pointing to root `/` instead of `/media/app/`). The new `app/manifest.ts` will be the single source of truth for the manifest. Keeping both would cause conflicts. The icon files (`android-chrome-192x192.png`, `android-chrome-512x512.png`) in `public/media/app/` will be referenced from the new manifest.
