# Data Model: PWA Offline Resilience

**Feature**: 004-pwa-offline-resilience
**Date**: 2026-03-28

---

## Entities

### 1. QueuedRequest (IndexedDB)

Represents a single offline-queued mutation waiting to be synced.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | UUID (crypto.randomUUID()) — unique identifier |
| `url` | `string` | Full API URL (e.g., `https://api.ordrat.com/api/Shop/Update`) |
| `method` | `string` | HTTP method: `POST`, `PUT`, `PATCH`, `DELETE` |
| `headers` | `Record<string, string>` | Request headers (Authorization, Content-Type, etc.) |
| `body` | `string \| null` | JSON-stringified request body (null for DELETE) |
| `queuedAt` | `number` | Unix timestamp (ms) when the request was queued |
| `retryCount` | `number` | Number of times sync has been attempted. Starts at 0. |
| `status` | `'pending' \| 'failed'` | Current status. Starts as `pending`. Set to `failed` after sync error. |
| `errorMessage` | `string \| null` | Last error message from a failed sync attempt |
| `entityType` | `string \| null` | Human-readable label (e.g., "Shop Profile", "Branch") for UI display |
| `entityId` | `string \| null` | ID of the entity being mutated, for deduplication (last-write-wins) |

**Storage**: IndexedDB database `ordrat-offline`, object store `mutations`, keyPath `id`.

**Indexes**:
- `by-status`: on `status` — query pending vs. failed items
- `by-entity`: on `[entityType, entityId]` — deduplication: discard older edits to the same entity

**Lifecycle**:
1. Created by `ordratFetch()` when `navigator.onLine === false` and method is a mutation
2. Persists across page refreshes and browser restarts
3. Replayed in FIFO order when connectivity returns
4. Removed from store after successful server response
5. Set to `failed` with `errorMessage` if server rejects (4xx/5xx)
6. Failed items retained for manual retry by user

---

### 2. SyncState (React state — `useOfflineQueue` hook)

In-memory state tracking the current sync process. Not persisted — derived from the queue on mount.

| Field | Type | Description |
|-------|------|-------------|
| `pendingCount` | `number` | Total items in queue (pending + failed) |
| `isFlushing` | `boolean` | True while sync is in progress |
| `totalToSync` | `number` | Snapshot of queue size when sync started |
| `syncedCount` | `number` | Items successfully synced in current batch |
| `failedCount` | `number` | Items that failed in current batch |
| `progress` | `number` | Computed: `syncedCount / totalToSync` (0–1) |

---

### 3. SessionPresence (localStorage — existing, extended)

Lightweight heuristic indicating the user had a valid session recently. NOT a replacement for the actual JWT cookie.

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | `number` | Unix timestamp of last successful session fetch |
| `shopId` | `string \| null` | Shop ID from session — used for user-scoping API cache |

**Storage**: `localStorage` key `ordrat:last_auth` — JSON string `{ timestamp, shopId }`.

**Grace period**: 48 hours (matches SW auth cache TTL).

---

### 4. PrecacheState (React state — `usePagePrecache` hook)

Tracks the progress of the "Cache Offline" button operation.

| Field | Type | Description |
|-------|------|-------------|
| `isCaching` | `boolean` | True while pre-cache operation is running |
| `totalPages` | `number` | Total pages to cache (from sidebar menu config) |
| `cachedCount` | `number` | Pages successfully fetched and cached |
| `failedCount` | `number` | Pages that failed to cache (storage limit, etc.) |
| `progress` | `number` | Computed: `cachedCount / totalPages` (0–1) |

---

## State Transitions

### QueuedRequest Lifecycle

```
[User clicks Save while offline]
    → status: 'pending', retryCount: 0

[Network restored → auto-sync starts]
    → Replay request to server

[Server responds 2xx]
    → DELETE from IndexedDB

[Server responds 4xx/5xx]
    → status: 'failed', retryCount++, errorMessage set
    → Remains in queue for manual retry

[User clicks "Retry" on failed item]
    → status: 'pending', replay again

[User clicks "Discard" on failed item]
    → DELETE from IndexedDB
```

### Deduplication (Last-Write-Wins)

When a new `QueuedRequest` is enqueued with the same `entityType` + `entityId` as an existing pending item:
1. The older pending item is deleted from IndexedDB
2. The new item replaces it
3. `pendingCount` remains the same (net zero change)

This prevents sending stale intermediate edits to the server.

---

## File Change Map

### Modified Files

| File | Change | Impact |
|------|--------|--------|
| `lib/offline-queue.ts` | Rewrite: localStorage → IndexedDB via `idb`. Add `entityType`, `entityId`, `headers`, `errorMessage` fields. Add deduplication logic. | High |
| `lib/api-client.ts` | Add `navigator.onLine` check before mutations. Return synthetic success for offline queued requests. Reduce mutation timeout from 8s to 3s. Pass `entityType`/`entityId` to queue. | High |
| `lib/session-cache.ts` | Extend to store `shopId` alongside timestamp. Parse/serialize as JSON. | Low |
| `hooks/use-offline-queue.ts` | Rewrite to read from IndexedDB. Add sync progress tracking (`totalToSync`, `syncedCount`, `failedCount`). Add retry/discard actions for failed items. | High |
| `hooks/use-page-precache.ts` | Extend route list to include all navigable pages (not just top-level menu). Add API data pre-fetching per route. Report progress per page. | Medium |
| `components/pwa/offline-progress-bar.tsx` | Redesign: pending count at rest, animated progress bar during sync, hidden when empty. Add hover/tap summary popover. | High |
| `app/sw.ts` | Add `CacheableResponsePlugin` to API cache rule. Add `BackgroundSyncPlugin` for mutations (Chromium enhancement). | Medium |
| `app/[locale]/(dashboard)/layout.tsx` | Harden offline session guard. Ensure `hadRecentSession()` always prevents redirect when offline. | Medium |
| `proxy.ts` | Soften auth redirect: when token refresh fails with a network error, pass through instead of redirecting to `/signin`. | Medium |
| `components/layout/header.tsx` | Update `OfflineProgressBar` integration if component API changes. | Low |
| `components/layout/wrapper.tsx` | Update "Cache Offline" button to reflect new progress states from `usePagePrecache`. | Low |
| `messages/en.json` | Add i18n keys for: offline queue toast messages, sync progress, pending counter, failed item UI, pre-cache progress. | Low |
| `messages/ar.json` | Mirror all new keys from `en.json`. | Low |

### New Files

| File | Purpose |
|------|---------|
| `lib/offline-db.ts` | IndexedDB setup via `idb`: database schema, open/upgrade, typed accessors for `mutations` store. |

### New Dependencies

| Package | Purpose | Size |
|---------|---------|------|
| `idb` | Lightweight Promise wrapper for IndexedDB | ~1.2 KB gzipped |
