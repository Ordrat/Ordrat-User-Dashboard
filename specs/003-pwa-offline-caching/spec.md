# Feature Specification: PWA & Offline Caching

**Feature Branch**: `003-pwa-offline-caching`
**Created**: 2026-03-26
**Status**: Draft
**Input**: User description: "i want to maintain perfect pwa and caching so if the user is lost his network connection i still maintaing pwa so use context 7 mcp and i think ssg will be helping alot in that case but see the docs of nextjs to maintain everything all over the app pwa and also make sure everything is pwa and if there's anything will be effected in that case tell me and also make sure all the apis endpoints app anything pwa and save that in your memeory so anything we do is pwa and update claude md"

---

## Overview

Transform the Ordrat seller dashboard into a full Progressive Web App (PWA) with robust offline-first capabilities. Sellers should be able to continue viewing their dashboard data, manage products, and browse branches even when their internet connection drops — with the app automatically refreshing when connectivity resumes.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Install Dashboard as Native App (Priority: P1)

A seller visits the dashboard on a mobile or desktop browser and is prompted to install it to their home screen / desktop. Once installed, the app launches in standalone mode (no browser chrome) and feels like a native application.

**Why this priority**: Installability is the foundation of PWA. Without a valid manifest and service worker, no other PWA feature works. This story is independently deliverable.

**Independent Test**: Visit the dashboard URL in Chrome/Edge, verify an "Install" prompt appears, install it, and confirm it opens as a standalone app with no address bar.

**Acceptance Scenarios**:

1. **Given** a seller visits the dashboard in a supported browser, **When** they see the browser install prompt, **Then** clicking it adds the app to their home screen or desktop and it opens in standalone mode.
2. **Given** the app is installed, **When** the seller opens it, **Then** no browser navigation bar is visible.
3. **Given** the app is running in a browser, **When** DevTools inspects the manifest, **Then** a valid manifest is found with name, short_name, description, start_url, `display: standalone`, theme color, and icons (192×192 and 512×512 PNG).

---

### User Story 2 — Offline Access to Previously Visited Pages (Priority: P1)

A seller who has already used their dashboard loses internet access. They can still open the app and view their dashboard, shop profile, branch list, and product catalog using cached data. The app clearly communicates that it is in offline mode.

**Why this priority**: The core value proposition of this feature. Without this, the entire PWA effort has no meaningful benefit.

**Independent Test**: Load the dashboard with network access, simulate offline in DevTools, navigate between pages, and verify content is visible with an offline banner.

**Acceptance Scenarios**:

1. **Given** a seller has visited the dashboard while online, **When** network is lost and they reload the app, **Then** the app loads from cache and displays the last-known data.
2. **Given** the app is in offline mode, **When** the seller navigates between previously visited pages, **Then** all pages render without errors.
3. **Given** the app is offline, **When** a page is displayed, **Then** a visible offline indicator (banner or badge) informs the seller they are viewing cached data.
4. **Given** a seller navigates to a page they have never visited while offline, **Then** a clear "You're offline — this page hasn't been cached yet" fallback screen is shown.

---

### User Story 3 — Automatic Data Refresh on Reconnection (Priority: P2)

After losing and then regaining network connectivity, the app automatically refreshes stale cached data in the background without requiring a full page reload.

**Why this priority**: Ensures sellers always see accurate data when back online, without disrupting their workflow.

**Independent Test**: Go offline, wait 2 minutes, reconnect, and verify the app fetches fresh data within 30 seconds and the UI reflects the latest state.

**Acceptance Scenarios**:

1. **Given** the app was offline and the seller reconnects, **When** connectivity is restored, **Then** stale cached API data is refreshed in the background within 30 seconds.
2. **Given** fresh data has loaded after reconnection, **When** the update is ready, **Then** the seller sees fresh data without needing to manually reload.
3. **Given** the app is online, **When** the seller loads any page, **Then** API responses are cached for future offline use.

---

### User Story 4 — Instant App Shell Load (Priority: P2)

The app shell (layout, sidebar, navigation, fonts, icons) loads instantly from cache on every visit, regardless of network state.

**Why this priority**: Perceived performance is critical for adoption. The shell should never wait on the network.

**Independent Test**: Throttle network to Slow 3G, reload the app, and verify the sidebar and header appear within 1 second.

**Acceptance Scenarios**:

1. **Given** any network condition, **When** the seller opens the app, **Then** the app shell (sidebar, header, navigation) renders in under 1 second from cache.
2. **Given** a slow or no network connection, **When** the page loads, **Then** the layout appears immediately and content fills in as it arrives.
3. **Given** new app assets are deployed, **When** the seller next visits the app online, **Then** the service worker updates in the background and shows a "New version available — click to refresh" prompt.

---

### User Story 5 — API Data Caching for Offline Content (Priority: P2)

All key API endpoints (shop profile, branch list, product catalog) have a defined caching strategy so data is available offline and stale data is minimized online.

**Why this priority**: Without caching API responses, offline mode serves empty shells — not useful.

**Independent Test**: Make API calls while online, go offline, navigate to data-heavy pages, and verify data is shown from cache with correct values.

**Acceptance Scenarios**:

1. **Given** the seller has loaded their shop profile while online, **When** they view it offline, **Then** the cached profile data is displayed.
2. **Given** the seller has loaded their branch list while online, **When** they go offline and view branches, **Then** branch cards render from cache.
3. **Given** the seller attempts a write operation (form submit, update) while offline, **Then** an error message explains the action requires a network connection.
4. **Given** cached API data is older than 24 hours and the seller is online, **Then** the cache is refreshed automatically.

---

### Edge Cases

- What happens when the service worker fails to install (unsupported browser or HTTPS not available)?
- How does the app behave when browser storage quota is exceeded and new assets cannot be cached?
- What happens to auth session tokens when cached pages load offline — **Resolved**: cached data is still shown with a "Session may be expired" warning badge; no forced logout while offline; token refresh is attempted silently on reconnection.
- How does the app handle partial network failure (connected but API server unreachable)?
- What happens to write operations (form submits) attempted while offline — are they silently lost?
- How does the "new version available" prompt behave if the seller ignores it for multiple sessions? **Resolved**: browser default lifecycle applies — new SW waits until all app tabs are closed before activating. No auto-force.

---

## Clarifications

### Session 2026-03-26

- Q: Should the offline indicator, offline fallback page, and "new version available" notification be translated into Arabic and English? → A: Yes — use the existing i18next system (`messages/en.json` / `messages/ar.json`) for all new PWA UI text.
- Q: When a seller is offline and their JWT expires, what should happen? → A: Show cached data with a warning badge ("Session may be expired — reconnect to continue editing"); do not block access or force logout while offline.
- Q: When should the new service worker activate if the seller ignores the "new version available" prompt? → A: Browser default lifecycle — activate only when the seller closes all app tabs. No forced takeover.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST include a valid Web App Manifest (`app/manifest.ts`) with: `name`, `short_name`, `description`, `start_url: "/"`, `display: "standalone"`, `theme_color`, `background_color`, and icons at 192×192 and 512×512 PNG.
- **FR-002**: The app MUST register a service worker at startup that caches all static assets (JS, CSS, fonts, images in `public/`) using a cache-first strategy.
- **FR-003**: The service worker MUST apply a stale-while-revalidate caching strategy to all GET requests targeting `api.ordrat.com` routes.
- **FR-004**: The app MUST display a visible offline indicator component whenever the device loses network connectivity. All text in this component MUST use the existing i18next translation system and be available in both English and Arabic.
- **FR-005**: The service worker MUST serve cached content when network requests fail, including a generic offline fallback page for uncached routes. The fallback page MUST display its message in both English and Arabic using the i18next translation system.
- **FR-006**: Static dashboard pages (non-user-specific layout/shell) MUST use Next.js Static Site Generation (SSG) to produce pre-rendered, cache-friendly HTML.
- **FR-007**: The app MUST show a "new version available" notification when the service worker detects updated assets, with a one-click refresh action. The notification text MUST be translated into both English and Arabic via i18next. If the seller ignores the prompt, the new service worker MUST follow the browser default lifecycle — activating only when all app tabs are closed. No forced takeover.
- **FR-008**: The app MUST be installable on: Chrome/Edge (desktop and Android) and Safari (iOS) without any browser extensions.
- **FR-009**: POST, PATCH, PUT, and DELETE requests MUST NOT be cached. When these fail offline, the user MUST see a clear, user-friendly error message.
- **FR-010**: Cached API responses for authenticated routes MUST not be served to a different authenticated user (cache keys must be user-scoped).
- **FR-013**: When the app detects the device is offline AND the seller's JWT token has expired, the app MUST continue displaying cached data and show a persistent warning badge: "Session may be expired — reconnect to continue editing." The app MUST NOT force logout or redirect to sign-in while offline. Upon reconnection, the app MUST silently attempt token refresh (via the existing NextAuth refresh flow) and remove the warning badge if successful.
- **FR-011**: The service worker implementation MUST use the Serwist library (Next.js official recommendation for App Router PWA) for lifecycle management, precaching, and runtime caching.
- **FR-012**: Existing auth pages (`/signin`, `/forgot-password`, `/verify-otp`, `/change-password`) MUST be excluded from service worker offline caching — these flows always require network access.

### Key Entities

- **Service Worker**: Background script responsible for cache lifecycle, offline fallback routing, and version management.
- **App Manifest**: JSON metadata file (`/manifest.json`) that enables installability and controls standalone app appearance.
- **Static Cache**: Cache bucket for immutable app shell assets (JS chunks, CSS, fonts, icons) — cache-first, long TTL.
- **API Response Cache**: Cache bucket for GET responses from `api.ordrat.com` — stale-while-revalidate, 24-hour max TTL.
- **Offline Indicator**: Client-side UI component that monitors `navigator.onLine` and renders a status banner.
- **Offline Fallback Page**: A pre-cached HTML page served by the service worker when a requested URL has no cache entry and the network is unavailable.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The app achieves a Lighthouse PWA score of 100 (all PWA audits pass) when tested in production/staging.
- **SC-002**: The app shell (sidebar, header, navigation) renders from cache in under 1 second on repeat visits regardless of network quality.
- **SC-003**: 100% of previously visited pages remain accessible and display their last-known data when the device is fully offline.
- **SC-004**: The app is successfully installable on Chrome (desktop), Chrome (Android), Edge (desktop), and Safari (iOS) without browser extensions.
- **SC-005**: After reconnecting from an offline state, cached data is refreshed within 30 seconds without requiring a manual page reload.
- **SC-006**: Sellers who attempt write operations while offline always see a clear error message — zero cases of silent data loss.
- **SC-007**: The app functions correctly (online features only) in browsers that do not support service workers — no JavaScript errors thrown.
- **SC-008**: Time-to-interactive on repeat visits improves by at least 40% compared to pre-PWA baseline due to service worker caching.

---

## Assumptions

- The app currently has no service worker, manifest, or any PWA configuration — this is a net-new implementation.
- The Ordrat API (`api.ordrat.com`) serves HTTPS responses and does not set `Cache-Control: no-store` headers that would prevent service worker caching. If it does, backend coordination will be required.
- PWA icons (192×192 and 512×512 PNG) will be derived from existing logo assets in `public/media/app/` — a conversion/export step may be required.
- Offline write queuing (background sync for pending mutations) is out of scope for this initial implementation — writes fail with a visible error message.
- SSG applies to the page shell and layout; dynamic API data is handled via TanStack Query with service-worker-cached responses as the offline fallback.
- The `next.config.js` (or `next.config.ts`) file exists and can accept Serwist webpack plugin configuration.
- The dashboard is served over HTTPS in all environments — service workers require a secure context.

---

## Impact Analysis — What Will Be Affected

The following existing parts of the codebase will require changes or review:

| Area | Impact | Notes |
|------|--------|-------|
| `app/layout.tsx` | **High** | Add service worker registration script and offline indicator component |
| `app/manifest.ts` | **New file** | Web app manifest using Next.js built-in convention |
| `public/sw.js` | **New file** | Generated by Serwist build plugin |
| `next.config.js` | **High** | Add Serwist webpack plugin; may affect build pipeline |
| `lib/api-client.ts` (`ordratFetch`) | **Medium** | Ensure GET requests are cacheable; verify no headers block SW caching |
| Auth pages (`/signin`, `/forgot-password`, `/verify-otp`, `/change-password`) | **Low** | Must be explicitly excluded from SW offline routes |
| TanStack Query config | **Medium** | `staleTime` and `gcTime` should align with service worker cache TTL |
| `proxy.ts` | **Low** | Offline users hitting protected routes must see offline page, not auth redirect loop |
| All static assets in `public/` | **Medium** | Must be included in SW precache manifest |
| Dashboard page (`/dashboard`) | **High** | Primary candidate for SSG shell + runtime API caching |
| `components/layout/` | **Medium** | App shell components must be SSG-friendly (avoid client-only state in initial render) |
| CI/CD build pipeline | **Low** | Serwist generates SW during build — verify build output includes `sw.js` |
