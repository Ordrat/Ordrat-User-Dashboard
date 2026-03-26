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
  const [isOffline, setIsOffline] = useState(false);
  const [lastOnlineAt, setLastOnlineAt] = useState<number | null>(null);
  const isOfflineRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const update = async () => {
      const online = await checkConnectivity();
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
      update();
      startPolling();
    };

    const handleOffline = () => {
      isOfflineRef.current = true;
      setIsOffline(true);
      onlineManager.setOnline(false);
      // Stop polling while offline — no point hammering a dead network
      if (intervalRef.current) clearInterval(intervalRef.current);
    };

    // Initial check on mount
    update();
    startPolling();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOffline, lastOnlineAt };
}
