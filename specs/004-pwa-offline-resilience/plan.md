# Implementation Plan: PWA Offline Resilience

**Branch**: `004-pwa-offline-resilience` | **Date**: 2026-03-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-pwa-offline-resilience/spec.md`

## Summary

Transform the Ordrat seller dashboard into a true offline-first application where shop operators can work for 12+ hours without network, queue all save operations locally, and auto-sync everything when connectivity returns. The critical fix is eliminating auth redirects while offline — the current system redirects to sign-in when session validation fails due to network loss, destroying the entire work session. This plan also completes the "Cache Offline" button to pre-cache all pages, adds a header-level pending counter / sync progress bar, and ensures the offline queue persists across browser restarts via IndexedDB.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Next.js 16.x (App Router), React 19, Serwist + @serwist/next, TanStack Query 5.x, NextAuth v4, `idb` (new — IndexedDB wrapper)
**Storage**: IndexedDB (offline queue), Cache Storage (SW-managed page/API cache), localStorage (session presence heuristic)
**Testing**: Manual testing via DevTools offline mode + Lighthouse PWA audit
**Target Platform**: Modern browsers (Chrome, Edge, Safari, Firefox) — desktop and mobile
**Project Type**: Web application (frontend-only, .NET backend API)
**Performance Goals**: <500ms offline save acknowledgment, <5s sync start on reconnect, zero forced auth redirects
**Constraints**: Offline-capable for 12+ hours, queue survives browser restart, Lighthouse PWA score 100
**Scale/Scope**: ~5-10 dashboard pages, finite menu routes, queue depth of ~100 mutations/day typical

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Frontend-Only Architecture | PASS | All mutations go through `ordratFetch()` → .NET API. Offline queue stores requests for later replay — no local business logic. |
| II. Component-Library-First | PASS | Progress bar extends existing `OfflineProgressBar` component. Toast via existing `sonner`. No new UI primitives. |
| III. Swagger-First API Contracts | PASS | No new API endpoints. Queue replays existing mutation requests as-is. |
| IV. Server-Side Route Protection | PASS with justification | `proxy.ts` is softened for offline resilience: when token refresh fails due to network error, pass through instead of hard-redirect. Server-side protection remains intact for all online scenarios. See Complexity Tracking below. |
| V. Internationalisation (i18n) First | PASS | All new UI text (queue toasts, counter labels, sync progress) added to `messages/en.json` and `messages/ar.json`. |
| VI. Type Safety & Schema Validation | PASS | `QueuedRequest` interface is typed. IndexedDB schema is version-controlled. `ordratFetch()` return type extended with `{ queued: true }` discriminant. |

### Post-Design Re-Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Frontend-Only Architecture | PASS | IndexedDB stores serialized fetch requests — no business logic in queue. |
| II. Component-Library-First | PASS | Popover uses existing `components/ui/` popover. Badge/counter styled with Tailwind. |
| III. Swagger-First API Contracts | PASS | Queued requests replay verbatim — headers, body, URL all preserved from original call. |
| IV. Server-Side Route Protection | PASS with justification | Softened redirect applies ONLY when `getToken()` fails with a network error. Genuine auth failures (invalid token, expired refresh) still redirect. |
| V. Internationalisation (i18n) First | PASS | ~15 new i18n keys in both en/ar. |
| VI. Type Safety & Schema Validation | PASS | New `QueuedRequest` type exported. `idb` provides typed database access. |

## Project Structure

### Documentation (this feature)

```text
specs/004-pwa-offline-resilience/
├── plan.md              # This file
├── research.md          # Phase 0 — 9 research decisions
├── data-model.md        # Phase 1 — entities, state machines, file change map
├── quickstart.md        # Phase 1 — validation steps
├── contracts/
│   └── offline-queue-api.md  # Internal API contracts
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
lib/
├── offline-db.ts            # NEW — IndexedDB setup via `idb`, typed accessors
├── offline-queue.ts         # REWRITE — localStorage → IndexedDB, deduplication
├── api-client.ts            # MODIFY — offline check before mutations, synthetic response
├── session-cache.ts         # MODIFY — store shopId alongside timestamp

hooks/
├── use-offline-queue.ts     # REWRITE — IndexedDB source, sync progress, retry/discard
├── use-page-precache.ts     # MODIFY — extended route list, API data pre-fetch, progress

components/pwa/
├── offline-progress-bar.tsx # REWRITE — pending counter, sync progress bar, popover summary

app/
├── sw.ts                    # MODIFY — CacheableResponsePlugin, BackgroundSyncPlugin
├── [locale]/(dashboard)/
│   └── layout.tsx           # MODIFY — hardened offline session guard

config/
├── layout.config.tsx        # READ ONLY — source of menu routes for pre-cache

proxy.ts                     # MODIFY — soften redirect on network error

messages/
├── en.json                  # MODIFY — ~15 new i18n keys
├── ar.json                  # MODIFY — ~15 new i18n keys (Arabic translations)

components/layout/
├── header.tsx               # MINOR — update OfflineProgressBar integration if API changes
├── wrapper.tsx              # MINOR — update Cache Offline button for new progress states
```

**Structure Decision**: No new directories or structural changes. All modifications fit into the existing `lib/`, `hooks/`, `components/pwa/`, and `app/` structure established by spec 003.

## Complexity Tracking

> **Filled because Constitution Check Principle IV has a justified softening.**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| `proxy.ts` softened redirect on network error | Users offline for 12+ hours get hard-redirected to `/signin` before client-side grace period can activate. The redirect happens server-side, before React mounts. | 1. Client-only auth: Violates Constitution Principle IV entirely. 2. Extend JWT to 48h: Backend change not under frontend control. 3. Cookie-based offline flag: Unreliable — client must set cookie before network drops, race condition. The softer redirect only affects network-error cases; genuine auth failures still redirect. |

## Implementation Phases

### Phase 1: Session Resilience (P1 — No Auth Redirect)

**Goal**: Eliminate all auth redirects while offline.

**Files**: `proxy.ts`, `app/[locale]/(dashboard)/layout.tsx`, `lib/session-cache.ts`, `lib/api-client.ts`

**Changes**:
1. **`proxy.ts`**: Wrap `getToken()` in try/catch. When it throws a network error (not a token-invalid error), let the request through to the client. Add `x-auth-softfail: true` header so the layout knows this was a network failure, not a genuine auth check pass.
2. **`layout.tsx`**: Ensure `hadRecentSession()` check covers all paths where `status === 'unauthenticated'` AND `navigator.onLine === false`. Remove the 4-second arbitrary timeout — replace with explicit offline detection.
3. **`session-cache.ts`**: Extend to store `shopId` from session. Parse/serialize as JSON instead of raw timestamp.
4. **`api-client.ts`**: In the 401 handler, check `navigator.onLine` before calling `signOut()`. If offline, do NOT sign out — preserve the session for when connectivity returns.

**Validation**: Test 1 + Test 6 from quickstart.md.

---

### Phase 2: IndexedDB Offline Queue (P3 — Offline Save)

**Goal**: Mutations queue instantly when offline, no loading spinner.

**Files**: `lib/offline-db.ts` (new), `lib/offline-queue.ts` (rewrite), `lib/api-client.ts`, `hooks/use-offline-queue.ts` (rewrite)

**Changes**:
1. **`lib/offline-db.ts`** (new): Create IndexedDB database `ordrat-offline` with `mutations` object store. Version-controlled schema. Typed accessors (`addToQueue`, `getAllPending`, `removeFromQueue`, etc.). `BroadcastChannel` for cross-tab sync notifications.
2. **`lib/offline-queue.ts`** (rewrite): Replace localStorage reads/writes with IndexedDB calls from `offline-db.ts`. Add deduplication logic (same `entityType` + `entityId` → replace older entry). Add `entityType`/`entityId` fields.
3. **`lib/api-client.ts`**: Before every mutation, check `navigator.onLine`. If false, call `enqueue()` and return `{ queued: true, queueId }`. Reduce mutation timeout from 8s to 3s. On timeout, also enqueue. Return type updated with union discriminant.
4. **`hooks/use-offline-queue.ts`** (rewrite): Source from IndexedDB. Track `SyncState` fields. Expose `retryItem()`, `discardItem()`, `retryAllFailed()`. Auto-trigger sync on online transition.

**Validation**: Test 3 + Test 5 from quickstart.md.

---

### Phase 3: Header Counter + Sync Progress Bar (P3/P4 — UI)

**Goal**: Visible pending counter, animated sync progress, summary popover.

**Files**: `components/pwa/offline-progress-bar.tsx` (rewrite), `messages/en.json`, `messages/ar.json`

**Changes**:
1. **`offline-progress-bar.tsx`** (rewrite): Implement 5-state visual (hidden / idle pending / syncing / complete / partial failure). Pending count badge at rest. Progress bar during sync. Popover on hover/tap showing queue summary grouped by `entityType`. Failed items show error + retry/discard buttons.
2. **`messages/en.json`** + **`messages/ar.json`**: Add ~15 i18n keys: `pwa.queue.pending`, `pwa.queue.syncing`, `pwa.queue.synced`, `pwa.queue.failed`, `pwa.queue.retryAll`, `pwa.queue.discard`, `pwa.queue.queuedToast`, `pwa.queue.allSavedToast`, `pwa.queue.partialFailToast`, `pwa.cache.progress`, `pwa.cache.complete`, `pwa.cache.failed`, etc.

**Validation**: Test 3 (counter), Test 4 (sync progress) from quickstart.md.

---

### Phase 4: Pre-Cache All Pages (P2)

**Goal**: "Cache Offline" button caches every dashboard page and its API data.

**Files**: `hooks/use-page-precache.ts`, `components/layout/wrapper.tsx`

**Changes**:
1. **`hooks/use-page-precache.ts`**: Extend route extraction to include ALL navigable routes from sidebar config (not just top-level). For each route, fetch the page URL (triggers SW cacheOnNavigation) AND the page's primary API endpoint. Track progress per-page. Report partial success if storage runs out.
2. **`components/layout/wrapper.tsx`**: Update the "Cache Offline" button to show progress from the hook's new state (progress bar or "X of Y cached" text).

**Validation**: Test 2 from quickstart.md.

---

### Phase 5: Auto-Sync + Service Worker Hardening (P4)

**Goal**: Auto-sync on reconnect. SW enhancements for resilience.

**Files**: `app/sw.ts`, `hooks/use-offline-queue.ts`

**Changes**:
1. **`app/sw.ts`**: Add `CacheableResponsePlugin({ statuses: [0, 200] })` to the API cache rule — prevents caching error responses. Add `BackgroundSyncPlugin('ordrat-mutations', { maxRetentionTime: 24 * 60 })` for POST/PUT/PATCH/DELETE to `api.ordrat.com` — Chromium-only safety net for closed-tab scenario.
2. **`hooks/use-offline-queue.ts`**: The auto-sync logic is already in Phase 2. This phase validates end-to-end: queue → offline → reconnect → auto-flush → counters decrement → final toast.

**Validation**: Test 4 + Test 7 (Lighthouse) from quickstart.md.

---

### Phase 6: Integration Testing + i18n + Polish

**Goal**: End-to-end validation, all i18n complete, Lighthouse 100.

**Changes**:
1. Run all 7 quickstart validation tests
2. Verify Arabic translations render correctly (RTL layout, progress bar direction)
3. Lighthouse PWA audit = 100
4. `pnpm run build` — zero TypeScript errors
5. Test on mobile Chrome (Android) and Safari (iOS) for SW support
