# Tasks: PWA & Offline Caching

**Input**: Design documents from `/specs/003-pwa-offline-caching/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | quickstart.md ✅

**Tests**: No test tasks — no automated tests requested in spec.
**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Exact file paths are included in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install PWA dependencies, update gitignore, and seed translation keys. No user story work requires these to be done yet — but nothing can proceed without them.

- [x] T001 Install `serwist` and `@serwist/next` packages by adding them to `package.json` dependencies and running `npm install`
- [x] T002 Add `public/sw.js` and `public/sw.js.map` entries to `.gitignore` (generated build artifacts)
- [x] T003 Add `pwa` namespace translation keys to `messages/en.json`: `offline_banner`, `offline_fallback_title`, `offline_fallback_description`, `offline_fallback_retry`, `session_expired_warning`, `update_available`, `update_reload`, `write_offline_error` — use English strings from `data-model.md`
- [x] T004 [P] Add `pwa` namespace translation keys to `messages/ar.json` using the Arabic strings from `data-model.md` (parallel with T003 — different file)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core PWA infrastructure that ALL user stories depend on. Must complete before any user story phase can begin.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T005 Wrap `next.config.mjs` with `withSerwistInit()` from `@serwist/next` — set `swSrc: "app/sw.ts"`, `swDest: "public/sw.js"`, `cacheOnNavigation: true`, `disable: process.env.NODE_ENV === "development"`, and `additionalPrecacheEntries` for `/en/~offline` and `/ar/~offline` with a git-based revision hash
- [x] T006 Create `app/sw.ts` — Serwist service worker source using `@serwist/next/worker` `defaultCache`, `self.__SW_MANIFEST` precache entries, `skipWaiting: false` (browser default lifecycle), `clientsClaim: true`, `navigationPreload: true`, and `fallbacks.entries` pointing to `/en/~offline` and `/ar/~offline` for document requests
- [x] T007 Create `hooks/use-online-status.ts` — custom React hook that subscribes to `window` `online`/`offline` events, returns `{ isOffline: boolean, lastOnlineAt: number | null }`, and exports the current network state for all PWA components
- [x] T008 Update `components/providers/query-provider.tsx` — add `refetchOnReconnect: true`, `networkMode: 'offlineFirst'`, and `gcTime: 24 * 60 * 60 * 1000` (24 h) to default query options so TanStack Query serves cached data offline and immediately refetches all active queries on reconnection

**Checkpoint**: Foundation ready — `npm run build` should now produce `public/sw.js`. All user story phases may begin.

---

## Phase 3: User Story 1 — Install Dashboard as Native App (Priority: P1) 🎯 MVP

**Goal**: The app is installable on Chrome/Edge/Safari via a browser-native prompt and opens as a standalone application with no browser chrome.

**Independent Test**: Run `npm run build && npm run start`, open in Chrome, check DevTools → Application → Manifest for correct fields, confirm install prompt appears and app launches standalone.

- [x] T009 [US1] Create `app/manifest.ts` — export a `MetadataRoute.Manifest` function returning `name: "Ordrat Dashboard"`, `short_name: "Ordrat"`, `description`, `start_url: "/"`, `display: "standalone"`, `background_color: "#ffffff"`, `theme_color: "#4f46e5"`, and two icons: `{ src: "/media/app/android-chrome-192x192.png", sizes: "192x192", type: "image/png" }` and `{ src: "/media/app/android-chrome-512x512.png", sizes: "512x512", type: "image/png" }`
- [x] T010 [US1] Delete `public/media/app/site.webmanifest` — it is replaced by `app/manifest.ts` and has empty `name`/`short_name` fields with incorrect icon paths
- [x] T011 [US1] Add iOS PWA meta tags to the `<head>` in `app/layout.tsx`: `<link rel="apple-touch-icon" href="/media/app/apple-touch-icon.png" />`, `<meta name="apple-mobile-web-app-capable" content="yes" />`, `<meta name="apple-mobile-web-app-status-bar-style" content="default" />`, `<meta name="theme-color" content="#4f46e5" />`

**Checkpoint**: User Story 1 complete — Lighthouse installability checks pass, manifest is valid, iOS/Android install works.

---

## Phase 4: User Story 2 — Offline Access to Previously Visited Pages (Priority: P1)

**Goal**: A seller who has visited the dashboard while online can reload and navigate cached pages when offline, with a visible bilingual offline indicator.

**Independent Test**: Load dashboard pages while online, switch DevTools to Offline, reload — cached pages display with an offline banner; unvisited pages show the fallback screen.

- [x] T012 [US2] Create `app/[locale]/~offline/page.tsx` — a Next.js page component that uses `useTranslation('common')` and renders the Ordrat logo (`public/media/app/logo.svg` / `logo-dark.png`), the `pwa.offline_fallback_title` heading, `pwa.offline_fallback_description` text, and a `<Button>` that calls `window.location.reload()` with label `pwa.offline_fallback_retry`; use existing `components/ui/button.tsx`
- [x] T013 [US2] Create `components/pwa/offline-indicator.tsx` — a `'use client'` component that calls `useOnlineStatus()` from `hooks/use-online-status.ts` and, when `isOffline` is `true`, renders a full-width top banner using the existing `Alert` component from `components/ui/alert.tsx` with `pwa.offline_banner` text from `useTranslation('common')`
- [x] T014 [US2] Import and render `<OfflineIndicator />` in `app/layout.tsx` inside the `<body>` tag, directly before `{children}`, so it appears on every page across all routes

**Checkpoint**: User Story 2 complete — offline navigation works, banner appears/disappears correctly in both locales.

---

## Phase 5: User Story 3 — Automatic Data Refresh on Reconnection (Priority: P2)

**Goal**: When the seller's device reconnects after being offline, all stale TanStack Query data automatically refetches within 30 seconds — no manual page reload required.

**Independent Test**: Go offline (DevTools), wait 60+ seconds, reconnect, observe Network tab — all cached queries should fire new requests and update the UI automatically.

- [x] T015 [US3] Verify and confirm that `hooks/use-online-status.ts` (from T007) fires state changes that TanStack Query's internal `onlineManager` picks up — if not already wired, add an explicit `onlineManager.setOnline(!isOffline)` call from `@tanstack/react-query` inside the hook's `useEffect` to ensure TanStack Query immediately refetches all active queries on reconnection
- [x] T016 [US3] Add a `window.addEventListener('online', ...)` handler in `hooks/use-online-status.ts` that updates `lastOnlineAt` timestamp and sets `isOffline: false` — confirm `refetchOnReconnect: true` (set in T008) triggers all active queries after this event fires

**Checkpoint**: User Story 3 complete — all active TanStack Query data refetches automatically within seconds of reconnection.

---

## Phase 6: User Story 4 — Instant App Shell Load (Priority: P2)

**Goal**: The app shell (sidebar, header, nav) loads instantly from the service worker precache on every visit. When a new version is deployed, sellers see a "New version available" toast with a one-click reload.

**Independent Test**: Throttle to Slow 3G in DevTools, reload — sidebar and header appear in < 1 second. Deploy a new build → toast appears; click Reload → new version active.

- [x] T017 [US4] Create `hooks/use-sw-lifecycle.ts` — a `'use client'` hook that calls `navigator.serviceWorker.register('/sw.js')`, listens for the `controllerchange` event and the `waiting` state on the registration, and exposes `{ hasUpdate: boolean, applyUpdate: () => void }` where `applyUpdate` posts `{ type: 'SKIP_WAITING' }` to the waiting SW and then calls `window.location.reload()`
- [x] T018 [US4] Create `components/pwa/sw-update-prompt.tsx` — a `'use client'` component that calls `useSwLifecycle()` and, when `hasUpdate` is `true`, fires a `toast()` from `sonner` (already mounted in root layout) with message `pwa.update_available` and an action button labelled `pwa.update_reload` that calls `applyUpdate()`; text from `useTranslation('common')`
- [x] T019 [US4] Import and render `<SWUpdatePrompt />` in `app/layout.tsx` inside the `<body>` tag alongside the other PWA components

**Checkpoint**: User Story 4 complete — shell loads instantly from cache, update toast appears and correctly activates the new service worker.

---

## Phase 7: User Story 5 — API Data Caching for Offline Content (Priority: P2)

**Goal**: All GET API responses from `api.ordrat.com` are cached with stale-while-revalidate (24-hour TTL). Write operations fail gracefully offline. If the session expires while offline, a warning badge appears without forcing logout.

**Independent Test**: Load shop profile and branch list online → go offline → verify data displays from cache in `ordrat-api-cache` (DevTools → Application → Cache Storage). Attempt a form submit while offline → verify error message appears.

- [x] T020 [US5] Update `app/sw.ts` to add a custom `runtimeCaching` entry: `StaleWhileRevalidate` strategy for all GET requests matching `({ url }) => url.hostname === 'api.ordrat.com'`, with `ExpirationPlugin({ maxAgeSeconds: 86400, maxEntries: 200 })` and `cacheName: 'ordrat-api-cache'` — add this before `defaultCache` in the runtimeCaching array so it takes precedence
- [x] T021 [US5] Add a `message` event listener in `app/sw.ts` that handles `{ type: 'CLEAR_API_CACHE' }` by calling `caches.delete('ordrat-api-cache')` — this clears the API cache on user sign-out
- [x] T022 [US5] Create `components/pwa/session-warning.tsx` — a `'use client'` component that uses `useSession()` from `next-auth/react` and `useOnlineStatus()`, checks if `session?.expires` is in the past AND `isOffline` is `true`, and if so renders a persistent sticky warning badge with `pwa.session_expired_warning` text; uses `useEffect` to listen for the `online` event and call `getSession()` to attempt silent token refresh and hide the badge on success
- [x] T023 [US5] Import and render `<SessionWarning />` in `app/layout.tsx` inside the `<body>` tag alongside the other PWA components
- [x] T024 [US5] Create `hooks/use-sw-cache-clear.ts` — a hook that on mount sends `{ type: 'CLEAR_API_CACHE' }` to the active service worker via `navigator.serviceWorker.controller?.postMessage()`; call this hook from a `useEffect` triggered by NextAuth's `signOut` event (or attach to the sign-out button click handler in the auth flow) to prevent stale data from being served to the next user

**Checkpoint**: User Story 5 complete — API data is visible offline, write operations show bilingual error messages, session expiry warning appears and auto-clears on reconnection, cache is wiped on sign-out.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, build validation, and Lighthouse audit.

- [x] T025 Update `next.config.mjs` `additionalPrecacheEntries` to use a dynamic `revision` string derived from `git rev-parse HEAD` (using Node.js `spawnSync`) so the offline fallback pages get a new cache key on every deployment
- [x] T026 Run `npm run build` and verify `public/sw.js` is present in the output; inspect it to confirm `self.__SW_MANIFEST` has been replaced with the actual precache manifest entries
- [ ] T027 [P] Run Lighthouse PWA audit (DevTools → Lighthouse, check PWA category) against the production build and verify score = 100 with all PWA audits passing
- [ ] T028 [P] Execute all 10 steps in `specs/003-pwa-offline-caching/quickstart.md` to validate each user story acceptance scenario end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; T003 and T004 can run in parallel
- **Foundational (Phase 2)**: Requires Phase 1 complete — T005, T006, T007, T008 can run in parallel with each other (all different files)
- **User Stories (Phases 3–7)**: All require Phase 2 complete
  - US1 (Phase 3) and US2 (Phase 4) are both P1 — implement in parallel or sequentially
  - US3/US4/US5 (Phases 5–7) can begin after Foundational; US5 SW changes extend T006
- **Polish (Phase 8)**: Requires all desired user stories complete

### User Story Dependencies

- **US1 (P1)**: Independent after Foundational — no dependencies on other user stories
- **US2 (P1)**: Independent after Foundational — T012 offline page is referenced in T006 SW config; ensure T006 is done first
- **US3 (P2)**: Largely fulfilled by T008 (Foundational) + T020 (US5 SW caching); phases can overlap
- **US4 (P2)**: Independent after Foundational — T017/T018/T019 touch only new files
- **US5 (P2)**: T020 modifies `app/sw.ts` (same as T006) — complete T006 before T020

### Within Each User Story

- Models/hooks before components
- Components before layout integration
- Layout integration (app/layout.tsx) tasks are sequential — one change at a time

### Parallel Opportunities

- T003 ↔ T004 (different JSON files — parallel)
- T005 ↔ T006 ↔ T007 ↔ T008 (all different files — parallel within Phase 2)
- T009 ↔ T010 ↔ T011 (all different files — parallel within Phase 3)
- T012 ↔ T013 (different files — parallel; T014 follows both)
- T017 ↔ T018 (different files — parallel; T019 follows)
- T020 ↔ T021 (same file — sequential; T022 ↔ T023 ↔ T024 are separate files — parallel)
- T027 ↔ T028 (both validation tasks — parallel)

---

## Parallel Example: Phase 2 (Foundational)

```bash
# All foundational tasks can start simultaneously (different files):
Task: "T005 — Wrap next.config.mjs with withSerwistInit()"
Task: "T006 — Create app/sw.ts service worker source"
Task: "T007 — Create hooks/use-online-status.ts"
Task: "T008 — Update components/providers/query-provider.tsx"
```

## Parallel Example: US5 (API Caching)

```bash
# After T020 and T021 complete on app/sw.ts:
Task: "T022 — Create components/pwa/session-warning.tsx"
Task: "T024 — Create hooks/use-sw-cache-clear.ts"
# T023 follows T022, T025 follows T024
```

---

## Implementation Strategy

### MVP First (P1 stories only)

1. Complete Phase 1: Setup (T001–T004)
2. Complete Phase 2: Foundational (T005–T008) — CRITICAL BLOCKER
3. Complete Phase 3: US1 — Installability (T009–T011)
4. Complete Phase 4: US2 — Offline Access (T012–T014)
5. **STOP and VALIDATE**: Lighthouse PWA score, offline navigation, install prompt
6. Ship MVP — sellers can install the app and browse offline

### Incremental Delivery

1. Setup + Foundational → PWA infrastructure in place
2. US1 + US2 (P1) → Installable + offline → **MVP**
3. US3 (P2) → Auto-refresh on reconnection
4. US4 (P2) → Instant shell + update notification
5. US5 (P2) → Full API caching + session warning + cache hygiene
6. Polish → Lighthouse 100, quickstart validation

### Parallel Team Strategy

With multiple developers after Phase 2 is complete:
- **Developer A**: US1 (T009–T011) — manifest and iOS tags
- **Developer B**: US2 (T012–T014) — offline page and indicator
- **Developer C**: US4 (T017–T019) — SW lifecycle and update prompt

---

## Notes

- All tasks modify different files unless noted — check dependency notes before parallelizing
- `app/sw.ts` is modified in T006 (initial) and T020/T021 (runtime caching) — do T006 first
- `app/layout.tsx` receives multiple imports (T014, T019, T023) — commit each change separately to avoid conflicts
- Service worker changes require a production build (`npm run build`) to test — SW is disabled in development
- Verify `public/sw.js` exists after each build that touches `app/sw.ts` or `next.config.mjs`
- All user-visible strings MUST be in both `messages/en.json` AND `messages/ar.json` — T003 and T004 cover this
