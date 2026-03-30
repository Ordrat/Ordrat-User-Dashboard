'use client';

/**
 * Sends a CLEAR_API_CACHE message to the active service worker.
 * Call this when the user signs out to prevent stale data from
 * being served to the next authenticated user on the same device.
 */
export function clearSwApiCache(): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  const controller = navigator.serviceWorker.controller;
  if (controller) {
    controller.postMessage({ type: 'CLEAR_API_CACHE' });
  }
}

/**
 * Clears ALL caches (API + session + precache) and the IndexedDB offline queue.
 * Use this for a full dev reset before testing. Returns a promise that resolves
 * once the SW confirms the wipe.
 */
export async function clearAllCachesAsync(): Promise<void> {
  // Clear Cache Storage via SW
  const swClear = new Promise<void>((resolve) => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      resolve();
      return;
    }
    const controller = navigator.serviceWorker.controller;
    if (!controller) { resolve(); return; }

    const channel = new MessageChannel();
    channel.port1.onmessage = () => resolve();
    controller.postMessage({ type: 'CLEAR_ALL_CACHES' }, [channel.port2]);
    // Fallback: resolve after 2s if SW doesn't respond
    setTimeout(resolve, 2000);
  });

  // Clear IndexedDB offline queue
  const { clearQueue } = await import('@/lib/offline-db');
  await Promise.all([swClear, clearQueue()]);
}
