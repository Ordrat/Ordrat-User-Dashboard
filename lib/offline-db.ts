/**
 * IndexedDB layer for the offline mutation queue.
 *
 * Database: ordrat-offline, version 1
 * Object store: mutations (keyPath: id)
 *   index by-status   → status field
 *   index by-entity   → [entityType, entityId] compound
 *
 * All writes broadcast via BroadcastChannel so other tabs update their counters.
 * Local (same-tab) listeners are notified via an in-memory set.
 */

import { openDB, type IDBPDatabase } from 'idb';
import type { DBSchema } from 'idb';

export interface QueuedRequest {
  /** UUID — unique per queued item */
  id: string;
  /** API path e.g. "/api/Shop/Update" — ordratFetch prepends the base URL */
  path: string;
  /** HTTP method: POST | PUT | PATCH | DELETE */
  method: string;
  /** JSON-stringified body or null for DELETE */
  body: string | null;
  /**
   * True when the original request used FormData (multipart/form-data).
   * The body stores only the text fields serialized as JSON.
   * File fields are dropped — they cannot be serialized for IndexedDB.
   * During sync, the body is reconstructed back into FormData before replay.
   */
  isFormData?: boolean;
  /** Unix timestamp (ms) when the request was queued */
  queuedAt: number;
  /** Sync attempt count — starts at 0 */
  retryCount: number;
  /** pending = waiting to sync, failed = last sync attempt failed */
  status: 'pending' | 'failed';
  /** Last error message from a failed sync attempt */
  errorMessage: string | null;
  /** Human-readable entity label for UI grouping (e.g. "Shop Profile") */
  entityType: string | null;
  /** Entity ID for last-write-wins deduplication */
  entityId: string | null;
}

interface OfflineDBSchema extends DBSchema {
  mutations: {
    key: string;
    value: QueuedRequest;
    indexes: {
      'by-status': string;
      'by-entity': [string, string];
    };
  };
}

const DB_NAME = 'ordrat-offline';
const DB_VERSION = 1;
const STORE = 'mutations' as const;

// Singleton promise — shared across all callers in the same tab
let _db: Promise<IDBPDatabase<OfflineDBSchema>> | null = null;

function getDB(): Promise<IDBPDatabase<OfflineDBSchema>> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available outside the browser'));
  }
  if (!_db) {
    _db = openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('by-status', 'status');
        store.createIndex('by-entity', ['entityType', 'entityId']);
      },
    });
  }
  return _db;
}

// ── Cross-tab notifications via BroadcastChannel ──────────────────────────

let _channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return null;
  if (!_channel) _channel = new BroadcastChannel('ordrat-offline-queue');
  return _channel;
}

// In-memory listeners for the current tab
const _localListeners = new Set<() => void>();

function notifyAll(): void {
  // Notify same-tab listeners directly
  _localListeners.forEach((fn) => fn());
  // Notify other tabs via BroadcastChannel
  getChannel()?.postMessage({ type: 'queue-changed' });
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Add a request to the queue.
 * If an existing pending item has the same entityType + entityId,
 * the older item is deleted first (last-write-wins deduplication).
 * Returns the new item's UUID.
 */
export async function addToQueue(
  req: Omit<QueuedRequest, 'id' | 'queuedAt' | 'retryCount' | 'status' | 'errorMessage'>,
): Promise<string> {
  const db = await getDB();

  // Deduplication: only when both entityType and entityId are provided
  if (req.entityType && req.entityId) {
    const existing = await db.getAllFromIndex(
      STORE,
      'by-entity',
      IDBKeyRange.only([req.entityType, req.entityId]),
    );
    for (const item of existing) {
      if (item.status === 'pending') {
        await db.delete(STORE, item.id);
      }
    }
  }

  const id = crypto.randomUUID();
  await db.put(STORE, {
    ...req,
    id,
    queuedAt: Date.now(),
    retryCount: 0,
    status: 'pending',
    errorMessage: null,
  });
  notifyAll();
  return id;
}

/** All pending items, ordered FIFO by queuedAt */
export async function getAllPending(): Promise<QueuedRequest[]> {
  const db = await getDB();
  const items = await db.getAllFromIndex(STORE, 'by-status', 'pending');
  return items.sort((a, b) => a.queuedAt - b.queuedAt);
}

/** All failed items */
export async function getAllFailed(): Promise<QueuedRequest[]> {
  const db = await getDB();
  return db.getAllFromIndex(STORE, 'by-status', 'failed');
}

/** Total count of all items (pending + failed) */
export async function getQueueCount(): Promise<number> {
  const db = await getDB();
  return db.count(STORE);
}

/** Mark an item as failed after a sync attempt */
export async function markFailed(id: string, errorMessage: string): Promise<void> {
  const db = await getDB();
  const item = await db.get(STORE, id);
  if (!item) return;
  await db.put(STORE, {
    ...item,
    status: 'failed',
    retryCount: item.retryCount + 1,
    errorMessage,
  });
  notifyAll();
}

/** Reset a failed item back to pending for retry */
export async function markPending(id: string): Promise<void> {
  const db = await getDB();
  const item = await db.get(STORE, id);
  if (!item) return;
  await db.put(STORE, { ...item, status: 'pending', errorMessage: null });
  notifyAll();
}

/** Remove a single item (after successful sync, or user discard) */
export async function removeFromQueue(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE, id);
  notifyAll();
}

/** Wipe the entire queue (called on sign-out) */
export async function clearQueue(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE);
  notifyAll();
}

/**
 * Subscribe to queue changes (add/remove/update).
 * Fires for changes in this tab AND in other tabs (via BroadcastChannel).
 * Returns an unsubscribe function.
 */
export function subscribe(callback: () => void): () => void {
  _localListeners.add(callback);

  const ch = getChannel();
  const handler = () => callback();
  if (ch) ch.addEventListener('message', handler);

  return () => {
    _localListeners.delete(callback);
    if (ch) ch.removeEventListener('message', handler);
  };
}
