'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 24 * 60 * 60 * 1000, // 24 h — aligns with SW API cache TTL
            retry: 1,
            refetchOnReconnect: true,
            networkMode: 'offlineFirst', // serve SW-cached responses even while offline
          },
          mutations: {
            // Never pause mutations waiting for network — ordratFetch handles offline
            // detection and queuing. Without this, TQ pauses the mutation after
            // useOnlineStatus marks the app offline, causing infinite spinners.
            networkMode: 'always',
            retry: 0, // ordratFetch handles retries; no double-retry here
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
