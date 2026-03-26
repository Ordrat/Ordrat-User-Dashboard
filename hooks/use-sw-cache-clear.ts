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
