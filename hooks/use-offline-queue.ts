'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAllPending,
  getAllFailed,
  getQueueCount,
  removeFromQueue,
  markFailed,
  markPending,
  clearQueue as clearQueueDB,
  subscribe,
} from '@/lib/offline-db';
import type { QueuedRequest } from '@/lib/offline-db';
import { ordratFetch } from '@/lib/api-client';
import { useOnlineStatus } from './use-online-status';
import { useTranslation } from 'react-i18next';

export type { QueuedRequest };

export interface OfflineQueueState {
  /** Items in queue (pending + failed) */
  pendingCount: number;
  /** Items that failed their last sync attempt */
  failedCount: number;
  /** Sync is in progress */
  isFlushing: boolean;
  /** Snapshot of queue size when sync started */
  totalToSync: number;
  /** Items successfully synced in current batch */
  syncedCount: number;
  /** 0–1 progress value for the current sync batch */
  progress: number;
  /** Failed items, for the summary popover */
  failedItems: QueuedRequest[];
  retryItem: (id: string) => Promise<void>;
  discardItem: (id: string) => Promise<void>;
  retryAllFailed: () => Promise<void>;
}

async function loadCounts() {
  const [total, failed, failedItems] = await Promise.all([
    getQueueCount(),
    getAllFailed().then((items) => items.length),
    getAllFailed(),
  ]);
  return { total, failed, failedItems };
}

export function useOfflineQueue(): OfflineQueueState {
  const { isOffline } = useOnlineStatus();
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [failedItems, setFailedItems] = useState<QueuedRequest[]>([]);
  const [isFlushing, setIsFlushing] = useState(false);
  const [totalToSync, setTotalToSync] = useState(0);
  const [syncedCount, setSyncedCount] = useState(0);

  const prevIsOffline = useRef(isOffline);
  const isMounted = useRef(true);
  const isSyncing = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Refresh counts from IndexedDB whenever the queue changes
  const refreshCounts = useCallback(async () => {
    if (!isMounted.current) return;
    const { total, failed, failedItems: fi } = await loadCounts();
    if (!isMounted.current) return;
    setPendingCount(total);
    setFailedCount(failed);
    setFailedItems(fi);
  }, []);

  // Initial load
  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  // Subscribe to queue changes (same tab + other tabs via BroadcastChannel)
  useEffect(() => {
    return subscribe(refreshCounts);
  }, [refreshCounts]);

  // Show a toast whenever a new item is added to the queue
  const prevPendingRef = useRef(0);
  useEffect(() => {
    if (pendingCount > prevPendingRef.current) {
      toast.info(t('pwa.queue_saved'), {
        id: 'offline-queue-saved',
        duration: 4000,
      });
    }
    prevPendingRef.current = pendingCount;
  }, [pendingCount, t]);

  // ── Auto-sync: flush the queue when coming back online ────────────────────
  const flushQueue = useCallback(async () => {
    if (isSyncing.current || !isMounted.current) return;

    const pending = await getAllPending();
    if (pending.length === 0) return;

    isSyncing.current = true;
    const total = pending.length;

    if (!isMounted.current) { isSyncing.current = false; return; }
    setIsFlushing(true);
    setTotalToSync(total);
    setSyncedCount(0);

    const toastId = 'offline-queue-flush';
    toast.loading(t('pwa.queue_syncing', { count: total }), { id: toastId });

    let synced = 0;
    let failed = 0;

    for (const req of pending) {
      // Stop mid-sync if we go offline again
      if (typeof navigator !== 'undefined' && !navigator.onLine) break;

      // Reconstruct FormData for requests that were originally multipart.
      // Text fields were serialized to JSON at queue time; files were dropped.
      let replayBody: string | FormData | undefined;
      if (req.isFormData && req.body) {
        const fields = JSON.parse(req.body) as Record<string, string>;
        const fd = new FormData();
        for (const [key, value] of Object.entries(fields)) {
          fd.append(key, value);
        }
        replayBody = fd;
      } else {
        replayBody = req.body ?? undefined;
      }

      try {
        await ordratFetch(req.path, {
          method: req.method,
          body: replayBody,
          _noQueue: true,
        });
        await removeFromQueue(req.id);
        synced++;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        await markFailed(req.id, message);
        failed++;
      }

      if (isMounted.current) setSyncedCount(synced);
    }

    if (!isMounted.current) { isSyncing.current = false; return; }
    setIsFlushing(false);
    setSyncedCount(0);
    setTotalToSync(0);
    isSyncing.current = false;

    if (failed === 0) {
      toast.success(t('pwa.queue_synced'), { id: toastId });
    } else {
      toast.warning(
        t('pwa.queue_sync_partial', { synced, failed }),
        { id: toastId },
      );
    }

    // Refetch all active queries so pages reflect the synced data without a manual refresh.
    if (synced > 0) {
      queryClient.invalidateQueries();
    }
  }, [t, queryClient]);

  // On mount: flush any items left from a previous session when the device is
  // already online. The offline→online transition effect below won't fire in
  // this case because isOffline starts as false and never changes.
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      flushQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — run once on mount only

  // Trigger sync on offline→online transition
  useEffect(() => {
    const wasOffline = prevIsOffline.current;
    prevIsOffline.current = isOffline;

    if (wasOffline && !isOffline) {
      flushQueue();
    }
  }, [isOffline, flushQueue]);

  // ── Retry / discard actions ───────────────────────────────────────────────
  const retryItem = useCallback(async (id: string) => {
    await markPending(id);
    // Trigger a single-item flush if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      flushQueue();
    }
  }, [flushQueue]);

  const discardItem = useCallback(async (id: string) => {
    await removeFromQueue(id);
  }, []);

  const retryAllFailed = useCallback(async () => {
    const items = await getAllFailed();
    await Promise.all(items.map((item) => markPending(item.id)));
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      flushQueue();
    }
  }, [flushQueue]);

  const progress = totalToSync > 0 ? syncedCount / totalToSync : 0;

  return {
    pendingCount,
    failedCount,
    isFlushing,
    totalToSync,
    syncedCount,
    progress,
    failedItems,
    retryItem,
    discardItem,
    retryAllFailed,
  };
}

/** Wipe the entire queue — call on sign-out */
export { clearQueueDB as clearOfflineQueue };
