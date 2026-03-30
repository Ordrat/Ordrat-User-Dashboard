/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { defaultCache } from '@serwist/next/worker';
import {
  BackgroundSyncPlugin,
  CacheableResponsePlugin,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  StaleWhileRevalidate,
} from 'serwist';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// ── Messages ─────────────────────────────────────────────────────────────────
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'CLEAR_API_CACHE') {
    // Sign-out: clear only user-data caches (API responses + session)
    event.waitUntil(
      Promise.all([
        caches.delete('ordrat-api-cache'),
        caches.delete('auth-session-cache'),
      ]).then((results) => {
        if (event.ports[0]) {
          event.ports[0].postMessage({ cleared: results.some(Boolean) });
        }
      }),
    );
  }

  if (event.data?.type === 'CLEAR_ALL_CACHES') {
    // Dev/testing: wipe every cache including the precache
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(keys.map((k) => caches.delete(k))),
      ).then(() => {
        if (event.ports[0]) {
          event.ports[0].postMessage({ cleared: true });
        }
      }),
    );
  }
});

// ── Runtime caching rules ─────────────────────────────────────────────────────

// NextAuth session endpoint — NetworkFirst so the user gets a fresh session
// when online, but falls back to the cached response when offline. This prevents
// the dashboard from falsely reporting "unauthenticated" and redirecting to /signin.
const sessionCacheRule = {
  matcher: ({ url }: { url: URL }) =>
    url.pathname.startsWith('/api/auth/'),
  handler: new NetworkFirst({
    cacheName: 'auth-session-cache',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 48 * 60 * 60, // 48 h — matches GRACE_MS in dashboard layout
        maxEntries: 5,
      }),
    ],
    networkTimeoutSeconds: 3, // Fall back to cache after 3 s of no response
  }),
};

// Ordrat backend GET requests — stale-while-revalidate, 24 h TTL
// CacheableResponsePlugin ensures only successful responses (200, opaque) are cached.
// ignoreVary: true prevents cache misses when the Authorization header changes between
// requests (e.g. token refresh) — the URL is sufficient as the cache key for API responses.
const apiCacheRule = {
  matcher: ({ url, request }: { url: URL; request: Request }) =>
    url.hostname === 'api.ordrat.com' && request.method === 'GET',
  handler: new StaleWhileRevalidate({
    cacheName: 'ordrat-api-cache',
    matchOptions: {
      ignoreVary: true,
    },
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxAgeSeconds: 86400, // 24 hours
        maxEntries: 500,
      }),
    ],
  }),
};

// Ordrat backend mutation requests (POST/PUT/PATCH/DELETE) — NetworkOnly with
// BackgroundSyncPlugin as a Chromium-only safety net for the closed-tab scenario.
// The primary offline queue is client-side (IndexedDB in use-offline-queue.ts).
const mutationSyncPlugin = new BackgroundSyncPlugin('ordrat-mutations', {
  maxRetentionTime: 24 * 60, // 24 hours in minutes
});

const mutationCacheRule = {
  matcher: ({ url, request }: { url: URL; request: Request }) =>
    url.hostname === 'api.ordrat.com' &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method),
  handler: new NetworkOnly({
    plugins: [mutationSyncPlugin],
  }),
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    // Clean up precache entries from old builds automatically.
    // Prevents stale-build 404s from blocking SW installation.
    cleanupOutdatedCaches: true,
  },
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [sessionCacheRule, apiCacheRule, mutationCacheRule, ...defaultCache],
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
