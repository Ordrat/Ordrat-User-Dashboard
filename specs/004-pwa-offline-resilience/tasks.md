# Tasks: PWA Offline Resilience

**Branch**: `004-pwa-offline-resilience` | **Generated**: 2026-03-29
**Input**: `specs/004-pwa-offline-resilience/` — spec.md, plan.md, data-model.md, contracts/offline-queue-api.md, research.md, quickstart.md

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on in-progress tasks)
- **[US1–US4]**: Maps to User Story in spec.md
- File paths listed in every task description

---

## Phase 1: Setup

**Purpose**: Install new dependency and prepare environment.

- [x] T001 Install `idb` package for Promise-based IndexedDB access: `pnpm add idb` from project root

---

## Phase 2: Foundational (i18n — Shared by All Stories)

**Purpose**: All four user stories require new i18n keys for toast messages, counter labels, and progress UI. Add keys before story implementation to avoid blocking UI tasks.

⚠️ **CRITICAL**: Complete T002 before T003. T003 mirrors T002's keys into Arabic.

- [x] T002 Add all new i18n keys to `messages/en.json`: `pwa.queue.pending`, `pwa.queue.syncing`, `pwa.queue.synced`, `pwa.queue.syncingProgress`, `pwa.queue.failed`, `pwa.queue.failedCount`, `pwa.queue.retryAll`, `pwa.queue.discard`, `pwa.queue.retry`, `pwa.queue.queuedToast`, `pwa.queue.allSavedToast`, `pwa.queue.partialFailToast`, `pwa.queue.summary`, `pwa.cache.caching`, `pwa.cache.progress`, `pwa.cache.complete`, `pwa.cache.failed`
- [x] T003 Mirror all new keys from T002 into `messages/ar.json` with Arabic translations for the same 17 keys

**Checkpoint**: i18n keys committed — all UI tasks can reference translation strings

---

## Phase 3: User Story 1 — Uninterrupted Session (Priority: P1) 🎯 MVP

**Goal**: Eliminate all auth redirects while offline so shop operators can work 12+ hours without network.

**Independent Test**: Sign in → DevTools → Network → Offline → navigate between pages for 2+ minutes → zero redirects to `/signin`. Uncheck Offline → session silently re-validates without sign-in prompt. (Quickstart Test 1 + Test 6)

- [x] T004 [US1] Modify `proxy.ts` — wrap the `getToken()` call in try/catch; when it throws a network error (distinguish from a token-invalid error by checking `error.message` or catch type), pass the request through with response header `x-auth-softfail: true` instead of redirecting to `/signin`; genuine auth failures (invalid token, expired refresh confirmed with network available) must still redirect
- [x] T005 [P] [US1] Extend `lib/session-cache.ts` — change `ordrat:last_auth` localStorage value from a raw timestamp string to a JSON object `{ timestamp: number, shopId: string | null }`; update `setLastAuth(shopId)` and `hadRecentSession()` to read/write the new shape; preserve the 48-hour grace period
- [x] T006 [US1] Harden `app/[locale]/(dashboard)/layout.tsx` — ensure the offline session guard covers all code paths where `status === 'unauthenticated'`; replace any fixed-timeout hack (`setTimeout 4000`) with explicit `navigator.onLine === false` check; when offline and `hadRecentSession()` returns true, hold the session without redirecting regardless of token age
- [x] T007 [P] [US1] Modify `lib/api-client.ts` — in the 401 response handler, check `navigator.onLine` before calling `signOut()`; if `navigator.onLine === false`, do NOT call `signOut()` — preserve the session silently; only sign out on 401 when the network is confirmed available

**Checkpoint**: US1 independently testable — users offline for hours stay in the dashboard

---

## Phase 4: User Story 2 — Pre-Cache All Dashboard Pages (Priority: P2)

**Goal**: "Cache Offline" button in toolbar caches every dashboard page and its API data before the network drops.

**Independent Test**: Click "Cache Offline" → progress shows "X of Y pages" → go Offline → navigate to a page never previously visited → page loads with cached data. (Quickstart Test 2)

- [x] T008 [US2] Rewrite `hooks/use-page-precache.ts` — extract ALL navigable routes from `config/layout.config.tsx` (traverse nested children, not just top-level items); for each route: (1) fetch the page URL to trigger SW `cacheOnNavigation`, (2) fetch the page's primary GET API endpoint to cache data; track `PrecacheState` fields (`isCaching`, `totalPages`, `cachedCount`, `failedCount`, `progress 0–1`); stop gracefully if `QuotaExceededError` is thrown and report `failedCount` of remaining pages; prevent duplicate runs if button clicked multiple times (debounce / in-progress guard)
- [x] T009 [US2] Update `components/layout/wrapper.tsx` — connect "Cache Offline" button to the new `PrecacheState` from `usePagePrecache`; show progress text "Caching X of Y…" while `isCaching` is true; show "Cached" confirmation on completion; show "X cached, Y failed" if `failedCount > 0`; disable the button while caching is in progress

**Checkpoint**: US2 independently testable — all pages available offline after one button click

---

## Phase 5: User Story 3 — Offline Save Queue + Pending Counter (Priority: P3)

**Goal**: Mutations queue instantly when offline (no spinner), persistent queue survives restarts, header shows pending count badge.

**Independent Test**: Go Offline → make 3 edits → click Save on each → buttons respond in <500ms, toast "queued" per save, header shows "3 pending". Hover/tap counter → popover shows summary. Close and reopen browser → header still shows "3 pending". (Quickstart Test 3 + Test 5)

- [x] T010 [US3] Create `lib/offline-db.ts` — open/create IndexedDB database `ordrat-offline` using `idb`; define `mutations` object store with `keyPath: 'id'`, indexes `by-status` (on `status`) and `by-entity` (on `[entityType, entityId]` compound); implement all typed accessors per contracts/offline-queue-api.md: `openDB`, `addToQueue` (with last-write-wins deduplication on compound entity key), `getAllPending` (FIFO by `queuedAt`), `getAllFailed`, `getQueueCount`, `markFailed`, `markPending`, `removeFromQueue`, `clearQueue`, `subscribe` (BroadcastChannel for cross-tab sync, returns unsubscribe function); export `QueuedRequest` TypeScript interface with all fields from data-model.md
- [x] T011 [P] [US3] Rewrite `lib/offline-queue.ts` — replace all localStorage reads/writes with IndexedDB calls from `lib/offline-db.ts`; `enqueue()` calls `addToQueue()` which handles deduplication; `getQueue()` calls `getAllPending()`; `removeFromQueue()` delegates to offline-db; export `QueuedRequest` type re-export from offline-db
- [x] T012 [P] [US3] Modify `lib/api-client.ts` (builds on T007 changes) — add navigator.onLine check as the first step of every mutation (POST/PUT/PATCH/DELETE): if `navigator.onLine === false`, call `enqueue()` and immediately return `{ queued: true, queueId: string }` without calling fetch; reduce mutation fetch timeout from 8s to 3s; on network timeout when online, also enqueue and return `{ queued: true, queueId }`; preserve `_noQueue: true` option flag that skips enqueue during sync replay; update `ordratFetch()` return type with union discriminant `{ queued: true, queueId: string } | Response`
- [x] T013 [P] [US3] Rewrite `hooks/use-offline-queue.ts` — source queue state from IndexedDB via `lib/offline-db.ts`; expose `OfflineQueueState` interface from contracts/offline-queue-api.md (`pendingCount`, `failedCount`, `isFlushing`, `totalToSync`, `syncedCount`, `progress`, `failedItems`); subscribe to BroadcastChannel for cross-tab queue updates; expose `retryItem(id)` (`markPending` then trigger sync), `discardItem(id)` (`removeFromQueue`), `retryAllFailed()` (marks all failed items pending then triggers sync)
- [x] T014 [US3] Rewrite `components/pwa/offline-progress-bar.tsx` — consume `useOfflineQueue` hook; implement all 5 states from contracts/offline-queue-api.md state machine: **Hidden** (`pendingCount === 0 && !isFlushing` → return null), **Idle Pending** (`pendingCount > 0 && !isFlushing` → pulsing yellow badge "N pending"), **Syncing** (`isFlushing` → brand-color `#B91C1C` progress bar left→right, text "X of Y synced"), **Complete** (sync done, queue empty → brief green flash, hidden after 2s), **Partial Failure** (`failedCount > 0 && !isFlushing` → red badge "N failed"); add hover/tap `Popover` (use `components/ui/`) showing queue grouped by `entityType` with count, and for failed items: error message + Retry/Discard buttons wired to `retryItem`/`discardItem`; ensure component is hidden entirely (not "0") when queue is empty

**Checkpoint**: US3 independently testable — saves queue offline, counter accurate, queue survives restart

---

## Phase 6: User Story 4 — Automatic Sync on Reconnect (Priority: P4)

**Goal**: All queued operations auto-sync when connectivity returns; counter decrements to zero; SW hardens caching.

**Independent Test**: Queue 3 offline changes → re-enable network → within 5 seconds all 3 sync automatically, header counter reaches zero, final toast "All changes saved". (Quickstart Test 4)

- [x] T015 [US4] Add auto-sync trigger to `hooks/use-offline-queue.ts` (extends T013) — listen for `window` `online` event AND `useOnlineStatus` offline→online transition; when triggered: (1) snapshot current queue length as `totalToSync`, (2) set `isFlushing = true`, (3) iterate `getAllPending()` FIFO, call `ordratFetch()` with `_noQueue: true` for each, (4) on 2xx: `removeFromQueue(id)` + increment `syncedCount`, (5) on 4xx/5xx: `markFailed(id, errorMessage)` + increment `failedCount`, (6) after all: set `isFlushing = false`, show `toast.success` if `failedCount === 0`, `toast.error` with count if `failedCount > 0`; handle mid-sync network drop by catching errors and resetting `isFlushing`
- [x] T016 [P] [US4] Modify `app/sw.ts` — add `new CacheableResponsePlugin({ statuses: [0, 200] })` to the existing `api.ordrat.com` cache rule to prevent caching error responses; add `new BackgroundSyncPlugin('ordrat-mutations', { maxRetentionTime: 24 * 60 })` to POST/PUT/PATCH/DELETE routes for `api.ordrat.com` (Chromium enhancement for closed-tab scenario); add SW→client `BG_SYNC_COMPLETE` message broadcast with `{ synced: number, failed: number }` payload
- [x] T017 [P] [US4] Review `components/layout/header.tsx` — verify `OfflineProgressBar` component integration still works after the Phase 5 rewrite; update any changed prop names or add missing props; confirm the component renders in the correct header position

**Checkpoint**: US4 independently testable — full offline→reconnect→sync cycle works end-to-end

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Type safety verification, production build validation, full quickstart test suite.

- [x] T018 [P] Run TypeScript type check: `npx tsc --noEmit` from project root — resolve all type errors before final build
- [x] T019 [P] Run production build: `pnpm run build` — confirm zero TypeScript errors, valid `public/sw.js` generated, no import errors
- [ ] T020 Validate Quickstart Test 1 (no auth redirect while offline) — sign in, go offline, navigate for 2+ minutes, confirm no `/signin` redirect; go online, confirm silent session re-validation
- [ ] T021 [P] Validate Quickstart Test 2 (pre-cache all pages) — click Cache Offline, go offline, navigate to never-visited page, confirm page loads from cache
- [ ] T022 [P] Validate Quickstart Test 3 (offline save queue) — go offline, make 3 edits, each Save responds <500ms with queued toast; header shows "3 pending"; hover counter shows summary popover
- [ ] T023 Validate Quickstart Test 4 (auto-sync on reconnect) — 3 pending items, re-enable network, confirm sync progress bar, counter reaches zero, final "All changes saved" toast
- [ ] T024 [P] Validate Quickstart Test 5 (queue persistence across restart) — go offline, make 2 saves, close browser, reopen, confirm "2 pending" shown, go online, confirm auto-sync
- [ ] T025 [P] Validate Quickstart Test 6 (session expiry while offline) — go offline, navigate cached pages, confirm no sign-in redirect; go online, confirm silent refresh
- [ ] T026 Run Lighthouse PWA audit via Chrome DevTools → confirm score = 100 on production build

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T002 after T001)
- **US1 (Phase 3)**: Can start in parallel with Phase 2 after T001; does NOT need offline-db
- **US2 (Phase 4)**: Can start in parallel with Phase 2 and Phase 3 after T001; does NOT need offline-db
- **US3 (Phase 5)**: Needs T007 complete (same file: api-client.ts); T010 must complete before T011/T012/T013
- **US4 (Phase 6)**: T015 depends on T013; T016 and T017 can run in parallel with T015
- **Polish (Phase 7)**: Depends on all user story phases complete

### Within US3 (Phase 5)

```
T010 (offline-db.ts — new file, foundational)
  ├── T011 [P] (offline-queue.ts — depends on T010)
  ├── T012 [P] (api-client.ts   — depends on T010 + T007 from US1)
  └── T013 [P] (use-offline-queue.ts — depends on T010)
        └── T014 (offline-progress-bar.tsx — depends on T013)
```

### Cross-Phase File Conflicts

| File | Tasks | Order |
|------|-------|-------|
| `lib/api-client.ts` | T007 (US1), T012 (US3) | T007 → T012 (sequential, different functions) |
| `hooks/use-offline-queue.ts` | T013 (US3), T015 (US4) | T013 → T015 (sequential, extending the hook) |

---

## Parallel Example: User Story 3

```bash
# After T010 is complete, launch in parallel:
Task T011: "Rewrite lib/offline-queue.ts — localStorage → IndexedDB"
Task T012: "Modify lib/api-client.ts — navigator.onLine check + enqueue"
Task T013: "Rewrite hooks/use-offline-queue.ts — IndexedDB source + SyncState"

# Then sequentially:
Task T014: "Rewrite components/pwa/offline-progress-bar.tsx — 5-state machine"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational i18n (T002–T003)
3. Complete Phase 3: User Story 1 (T004–T007)
4. **STOP and VALIDATE**: Run Quickstart Test 1 and Test 6
5. P1 is the most critical fix — ship if needed

### Incremental Delivery

1. Setup + Foundational → Phase 3 US1 (P1 critical fix — no auth redirect)
2. Phase 4 US2 (P2 — pre-cache all pages before going offline)
3. Phase 5 US3 (P3 — offline save queue + pending counter)
4. Phase 6 US4 (P4 — auto-sync on reconnect)
5. Phase 7 Polish → deploy

---

## Notes

- **[P]** = different files, no hard dependencies on in-progress tasks in the same phase
- **[US1–US4]** = traceability label back to user stories in spec.md
- `pnpm run dev` disables the service worker — use `pnpm run build && pnpm run start` for all offline feature testing
- `idb` package must be installed (T001) before ANY IndexedDB-related implementation tasks
- Failed items stay in IndexedDB queue and must be retried manually or discarded — never silently dropped
- Counter must be hidden entirely (not "0") when `pendingCount === 0 && !isFlushing`
- All mutation timeouts reduce from 8s → 3s (T012) to fix the "loading forever" UX bug
