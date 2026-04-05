'use client';

import { onlineManager } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

interface OnlineStatus {
  isOffline: boolean;
  lastOnlineAt: number | null;
}

async function checkConnectivity(): Promise<boolean> {
  try {
    await fetch('/api/ping', {
      method: 'HEAD',
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    return true;
  } catch {
    return false;
  }
}

export function useOnlineStatus(): OnlineStatus {
  // Initialise from navigator.onLine so DevTools "Offline" is reflected instantly
  // without waiting for the first /api/ping round-trip.
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  );
  const [lastOnlineAt, setLastOnlineAt] = useState<number | null>(null);
  const isOfflineRef = useRef(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Debounce timer for the 'offline' event — navigation blips fire offline→online
  // within milliseconds; we wait 2 s before actually declaring offline.
  const offlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const update = async () => {
      // navigator.onLine is authoritative for hard offline (DevTools, airplane mode).
      // We still ping /api/ping to catch captive portals where onLine stays true
      // but the network is actually blocked.
      const navOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      const pingOnline = navOnline ? await checkConnectivity() : false;
      const online = navOnline && pingOnline;
      isOfflineRef.current = !online;
      setIsOffline(!online);
      onlineManager.setOnline(online);
      if (online) setLastOnlineAt(Date.now());
    };

    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Poll every 15s while online to stay in sync.
      // Stops polling when offline — window.online event restarts it.
      intervalRef.current = setInterval(() => {
        if (!isOfflineRef.current) update();
      }, 15_000);
    };

    const handleOnline = () => {
      // Cancel any pending offline transition (navigation blip)
      if (offlineTimerRef.current) {
        clearTimeout(offlineTimerRef.current);
        offlineTimerRef.current = null;
      }
      update();
      startPolling();
    };

    const handleOffline = () => {
      // Debounce: wait 2 s before declaring offline so transient navigation
      // blips (browser fires offline → online within ~50 ms) don't show the banner.
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
      offlineTimerRef.current = setTimeout(() => {
        offlineTimerRef.current = null;
        if (typeof navigator !== 'undefined' && navigator.onLine) return; // already back
        isOfflineRef.current = true;
        setIsOffline(true);
        onlineManager.setOnline(false);
        // Stop polling while offline — no point hammering a dead network
        if (intervalRef.current) clearInterval(intervalRef.current);
      }, 2_000);
    };

    // Initial check on mount
    update();
    startPolling();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOffline, lastOnlineAt };
}
