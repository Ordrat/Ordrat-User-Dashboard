'use client';

import { useEffect, useState } from 'react';

interface SwLifecycle {
  hasUpdate: boolean;
  applyUpdate: () => void;
}

export function useSwLifecycle(): SwLifecycle {
  const [waitingSW, setWaitingSW] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;

    const checkWaiting = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting) {
        setWaitingSW(reg.waiting);
      }
    };

    const handleUpdateFound = () => {
      if (!registration) return;
      const installing = registration.installing;
      if (!installing) return;

      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
          // A new SW installed while an old one is active — there's an update waiting
          setWaitingSW(registration?.waiting ?? null);
        }
      });
    };

    navigator.serviceWorker
      .getRegistration()
      .then((reg) => {
        if (!reg) return;
        registration = reg;
        checkWaiting(reg);
        reg.addEventListener('updatefound', handleUpdateFound);

        // Periodically check for updates
        const interval = setInterval(() => reg.update(), 60 * 60 * 1000); // every 1 hour
        return () => clearInterval(interval);
      })
      .catch(() => {
        // SW not registered yet — ignore
      });

    // Also listen for the controller change (new SW has taken control)
    const handleControllerChange = () => {
      // The new SW has already taken over — no need to show prompt, just reload
    };
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      if (registration) {
        registration.removeEventListener('updatefound', handleUpdateFound);
      }
    };
  }, []);

  const applyUpdate = () => {
    if (!waitingSW) return;
    waitingSW.postMessage({ type: 'SKIP_WAITING' });
    setWaitingSW(null);
    window.location.reload();
  };

  return {
    hasUpdate: waitingSW !== null,
    applyUpdate,
  };
}
