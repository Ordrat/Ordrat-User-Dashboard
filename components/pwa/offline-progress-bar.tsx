'use client';

import { useEffect, useRef, useState } from 'react';
import { useOfflineQueue } from '@/hooks/use-offline-queue';
import type { QueuedRequest } from '@/hooks/use-offline-queue';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { WifiOff, RefreshCw, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type BarState = 'hidden' | 'idle-pending' | 'syncing' | 'complete' | 'partial-failure';

function groupByEntityType(items: QueuedRequest[]): Record<string, QueuedRequest[]> {
  return items.reduce<Record<string, QueuedRequest[]>>((acc, item) => {
    const key = item.entityType ?? 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

/**
 * A thin bar fixed to the bottom of the <header> element.
 *
 * States:
 *  • hidden          — queue empty, not syncing → null (not rendered)
 *  • idle-pending    — items in queue, not syncing → pulsing yellow badge
 *  • syncing         — sync in progress → brand-red animated progress bar
 *  • complete        — sync just finished, all ok → brief green flash, then hidden
 *  • partial-failure — sync finished but some failed → red badge with retry
 */
export function OfflineProgressBar() {
  const {
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
  } = useOfflineQueue();
  const { isOffline } = useOnlineStatus();
  const { t } = useTranslation('common');

  // Track "just completed" state for the brief green flash
  const [justCompleted, setJustCompleted] = useState(false);
  const prevFlushingRef = useRef(isFlushing);

  useEffect(() => {
    const wasFlusing = prevFlushingRef.current;
    prevFlushingRef.current = isFlushing;

    if (wasFlusing && !isFlushing && pendingCount === 0 && failedCount === 0) {
      setJustCompleted(true);
      const timer = setTimeout(() => setJustCompleted(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isFlushing, pendingCount, failedCount]);

  // Determine which visual state we're in
  let barState: BarState = 'hidden';
  if (isFlushing) {
    barState = 'syncing';
  } else if (justCompleted) {
    barState = 'complete';
  } else if (failedCount > 0) {
    barState = 'partial-failure';
  } else if (pendingCount > 0) {
    barState = 'idle-pending';
  } else if (isOffline) {
    barState = 'idle-pending'; // Offline with nothing queued — show the offline indicator
  }

  if (barState === 'hidden') return null;

  // Progress bar value (0–100)
  let progressValue: number;
  if (barState === 'syncing') {
    progressValue = Math.round(progress * 100);
  } else if (barState === 'complete') {
    progressValue = 100;
  } else if (pendingCount > 0) {
    progressValue = Math.min(pendingCount * 20, 85);
  } else {
    progressValue = 100; // Offline, nothing queued
  }

  const isSyncingState = barState === 'syncing';
  const isCompleteState = barState === 'complete';
  const isFailureState = barState === 'partial-failure';

  const groupedFailed = groupByEntityType(failedItems);

  return (
    <div className="absolute bottom-0 inset-x-0 flex flex-col items-center">
      {/* Status badge — visible except when syncing */}
      {!isSyncingState && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-1.5 rounded-t-md border border-b-0 border-foreground/10 bg-foreground px-2 py-0.5 text-[10px] font-medium text-background transition-colors',
                isCompleteState && 'cursor-default',
                isFailureState && 'cursor-pointer hover:bg-foreground/90',
                !isCompleteState && !isFailureState && 'cursor-pointer hover:bg-foreground/90',
              )}
              disabled={pendingCount === 0 && failedCount === 0}
            >
              {isOffline && !isFailureState && (
                <WifiOff className="size-3" />
              )}
              {isCompleteState ? (
                <span>{t('pwa.queue_synced')}</span>
              ) : isFailureState ? (
                <span>{t('pwa.queue_failed_badge', { count: failedCount })}</span>
              ) : pendingCount > 0 ? (
                <span>{t('pwa.queue_pending_badge', { count: pendingCount })}</span>
              ) : (
                <span>{t('pwa.offline_banner', 'Offline')}</span>
              )}
            </button>
          </PopoverTrigger>

          {(pendingCount > 0 || failedCount > 0) && (
            <PopoverContent align="center" side="bottom" className="w-96 max-h-[70vh] overflow-y-auto p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{t('pwa.queue_summary_title')}</p>
                {failedCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs gap-1"
                    onClick={retryAllFailed}
                  >
                    <RefreshCw className="size-3" />
                    {t('pwa.queue_retry_all')}
                  </Button>
                )}
              </div>

              {/* Pending items summary (non-failed) */}
              {pendingCount > failedCount && (
                <p className="text-xs text-muted-foreground">
                  {t('pwa.queue_pending', { count: pendingCount - failedCount })}
                </p>
              )}

              {/* Failed items with retry/discard */}
              {failedItems.length > 0 && (
                <div className="space-y-2">
                  {failedItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded border border-destructive/20 bg-destructive/5 p-2 text-xs space-y-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-destructive">
                          {item.entityType ?? item.method} {item.entityId ? `#${item.entityId}` : ''}
                        </span>
                        <div className="flex gap-1 shrink-0">
                          <button
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => retryItem(item.id)}
                            title={t('pwa.queue_retry')}
                          >
                            <RefreshCw className="size-3" />
                          </button>
                          <button
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => discardItem(item.id)}
                            title={t('pwa.queue_discard')}
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </div>
                      {item.errorMessage && (
                        <p className="text-destructive/80 text-[10px] break-all whitespace-pre-wrap">
                          {item.errorMessage}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </PopoverContent>
          )}
        </Popover>
      )}

      {/* Syncing label */}
      {isSyncingState && (
        <div className="pb-0.5">
          <span className="rounded-t-md border border-b-0 border-foreground/10 bg-foreground px-2 py-0.5 text-[10px] font-medium text-background">
            {t('pwa.queue_syncing_progress', { synced: syncedCount, total: totalToSync })}
          </span>
        </div>
      )}

      {/* Progress bar */}
      <Progress
        value={progressValue}
        className="h-1 w-full rounded-none bg-transparent"
        indicatorClassName={cn(
          'transition-all duration-500',
          isSyncingState && 'bg-[#B91C1C]',
          isCompleteState && 'bg-green-500',
          isFailureState && 'bg-red-500',
          !isSyncingState && !isCompleteState && !isFailureState && 'bg-yellow-500 animate-pulse',
        )}
      />
    </div>
  );
}
