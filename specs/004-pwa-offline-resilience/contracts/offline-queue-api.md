# Contract: Offline Queue Internal API

**Feature**: 004-pwa-offline-resilience
**Date**: 2026-03-28

This contract defines the internal API surface for the offline queue system. These are not external APIs — they are module-level interfaces consumed within the app.

---

## 1. `lib/offline-db.ts` — IndexedDB Access Layer

### `openDB(): Promise<IDBPDatabase>`

Opens (or creates/upgrades) the `ordrat-offline` database. Auto-creates object stores on version upgrade.

### `addToQueue(request: QueuedRequest): Promise<void>`

Inserts a new queued request. If an existing pending entry has the same `entityType` + `entityId`, deletes the older one first (last-write-wins deduplication).

### `getAllPending(): Promise<QueuedRequest[]>`

Returns all items with `status === 'pending'`, ordered by `queuedAt` ascending (FIFO).

### `getAllFailed(): Promise<QueuedRequest[]>`

Returns all items with `status === 'failed'`.

### `getQueueCount(): Promise<number>`

Returns total count of all items (pending + failed).

### `markFailed(id: string, errorMessage: string): Promise<void>`

Sets `status = 'failed'`, increments `retryCount`, sets `errorMessage`.

### `markPending(id: string): Promise<void>`

Resets `status = 'pending'` (used for retry of failed items).

### `removeFromQueue(id: string): Promise<void>`

Deletes the item from the store.

### `clearQueue(): Promise<void>`

Deletes all items. Used on sign-out.

### `subscribe(callback: () => void): () => void`

Observer pattern. Calls `callback` whenever the queue changes (add, remove, update). Returns unsubscribe function. Uses `BroadcastChannel` for cross-tab sync.

---

## 2. `lib/api-client.ts` — `ordratFetch()` Changes

### Mutation Flow (POST/PUT/PATCH/DELETE)

```
ordratFetch(url, options) →
  1. Is mutation? (method !== 'GET')
  2. Is navigator.onLine === false?
     YES → enqueue to IndexedDB, return { queued: true }
     NO  → fetch(url, options) with 3s timeout
           → Success? return response
           → Network error? enqueue to IndexedDB, return { queued: true }
           → Server error (4xx/5xx)? throw error (NOT queued)
```

### New Return Shape for Queued Mutations

When a mutation is queued (either from offline detection or network timeout), `ordratFetch()` returns:

```typescript
{ queued: true, queueId: string }
```

The caller can use `queued: true` to show the "Queued for later" toast instead of a success/error response.

---

## 3. `hooks/use-offline-queue.ts` — React Hook

### `useOfflineQueue(): OfflineQueueState`

```typescript
interface OfflineQueueState {
  pendingCount: number;       // Items awaiting sync
  failedCount: number;        // Items that failed sync
  isFlushing: boolean;        // Sync in progress
  totalToSync: number;        // Snapshot when sync started
  syncedCount: number;        // Completed in current batch
  progress: number;           // 0–1 computed value
  failedItems: QueuedRequest[];  // For UI display
  retryItem: (id: string) => Promise<void>;
  discardItem: (id: string) => Promise<void>;
  retryAllFailed: () => Promise<void>;
}
```

### Auto-Sync Trigger

The hook listens for the `online` event and the `useOnlineStatus` hook's transition from offline→online. When triggered:

1. Snapshot queue size → `totalToSync`
2. Set `isFlushing = true`
3. Iterate pending items in FIFO order
4. For each: call `ordratFetch()` with `_noQueue: true` flag
5. On success: remove from queue, increment `syncedCount`
6. On failure: mark as failed, increment `failedCount`
7. After all: set `isFlushing = false`, show summary toast

---

## 4. `components/pwa/offline-progress-bar.tsx` — UI States

### State Machine

| State | Condition | Visual |
|-------|-----------|--------|
| Hidden | `pendingCount === 0 && !isFlushing` | Component returns `null` |
| Idle Pending | `pendingCount > 0 && !isFlushing && isOffline` | Yellow badge: "5 pending" with pulse animation |
| Idle Pending (Online) | `pendingCount > 0 && !isFlushing && isOnline` | Yellow badge: "5 pending" (no pulse — sync about to start) |
| Syncing | `isFlushing` | Brand-color progress bar filling left→right. Text: "3 of 5 synced" |
| Complete | Sync just finished, `pendingCount === 0` | Brief green flash, then hidden after 2s |
| Partial Failure | Sync finished, `failedCount > 0` | Red badge: "2 failed" with retry action |

### Hover/Tap Summary

When the user hovers or taps the pending counter, a popover shows:
- List of queued operations grouped by `entityType`
- Count per type (e.g., "Shop Profile: 1, Branches: 3")
- For failed items: error message and retry/discard buttons

---

## 5. Service Worker Messages

### Client → SW

| Message Type | Payload | Purpose |
|-------------|---------|---------|
| `CLEAR_API_CACHE` | (none) | Clear API + auth caches on sign-out (existing) |

### SW → Client

| Message Type | Payload | Purpose |
|-------------|---------|---------|
| `BG_SYNC_COMPLETE` | `{ synced: number, failed: number }` | BackgroundSync finished (Chromium only) — update UI counters |
