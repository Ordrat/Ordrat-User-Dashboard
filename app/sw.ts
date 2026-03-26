/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { defaultCache } from '@serwist/next/worker';
import { ExpirationPlugin, StaleWhileRevalidate } from 'serwist';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Clear API cache on sign-out message
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'CLEAR_API_CACHE') {
    event.waitUntil(
      caches.delete('ordrat-api-cache').then((deleted) => {
        if (event.ports[0]) {
          event.ports[0].postMessage({ cleared: deleted });
        }
      }),
    );
  }
});

const apiCacheRule = {
  matcher: ({ url, request }: { url: URL; request: Request }) =>
    url.hostname === 'api.ordrat.com' && request.method === 'GET',
  handler: new StaleWhileRevalidate({
    cacheName: 'ordrat-api-cache',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 86400, // 24 hours
        maxEntries: 200,
      }),
    ],
  }),
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [apiCacheRule, ...defaultCache],
  fallbacks: {
    entries: [
      {
        url: '/en/~offline',
        matcher({ request }: { request: Request }) {
          return request.destination === 'document';
        },
      },
      {
        url: '/ar/~offline',
        matcher({ request, url }: { request: Request; url: URL }) {
          return request.destination === 'document' && url.pathname.startsWith('/ar/');
        },
      },
    ],
  },
});

serwist.addEventListeners();
