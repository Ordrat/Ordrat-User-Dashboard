# Data Model: PWA & Offline Caching

**Feature**: 003-pwa-offline-caching
**Date**: 2026-03-26

---

## Overview

This feature introduces no new database entities or API contracts. All state is client-side (browser caches, service worker, and in-memory React state). This document describes the client-side data structures and cache topology.

---

## Cache Topology

### Precache Store (Serwist-managed)

```
Cache Name: serwist-precache-v2-{hash}
Contents:   Next.js build output — JS chunks, CSS, HTML shells, fonts
Strategy:   Precache (install-time population, revision-based updates)
Lifecycle:  Replaced atomically on SW update
```

### API Response Cache

```
Cache Name: ordrat-api-cache
Contents:   GET responses from api.ordrat.com/*
Strategy:   StaleWhileRevalidate
Max Age:    24 hours (86400 seconds)
Max Items:  200 entries
Cleanup:    ExpirationPlugin auto-evicts oldest; full clear on sign-out
```

### Static Asset Cache

```
Cache Name: ordrat-static-assets
Contents:   Images, fonts, icons from public/
Strategy:   CacheFirst
Max Age:    30 days
Max Items:  64 entries
Cleanup:    ExpirationPlugin auto-evicts oldest
```

---

## TypeScript Interfaces

### Service Worker Message Protocol

```typescript
// Messages from app → SW
type AppToSWMessage =
  | { type: 'SKIP_WAITING' }
  | { type: 'CLEAR_API_CACHE' }
  | { type: 'GET_CACHE_STATS' };

// Messages from SW → app
type SWToAppMessage =
  | { type: 'SW_UPDATED'; version: string }
  | { type: 'CACHE_STATS'; data: { apiEntries: number; staticEntries: number } };
```

### Offline Indicator State

```typescript
interface OfflineState {
  isOffline: boolean;           // navigator.onLine inverse
  isSessionExpired: boolean;    // JWT expired while offline
  lastOnlineAt: number | null;  // timestamp of last online state
}
```

### Web App Manifest (app/manifest.ts return type)

```typescript
// Uses Next.js built-in MetadataRoute.Manifest type
import type { MetadataRoute } from 'next';

interface OrdratManifest extends MetadataRoute.Manifest {
  name: 'Ordrat Dashboard';
  short_name: 'Ordrat';
  description: string;
  start_url: string;             // '/' or basePath + '/'
  display: 'standalone';
  background_color: '#ffffff';
  theme_color: '#4f46e5';        // Ordrat brand color
  icons: Array<{
    src: string;
    sizes: string;
    type: 'image/png';
  }>;
}
```

---

## File Change Map

### New Files

| File | Purpose |
|------|---------|
| `app/manifest.ts` | Web App Manifest (Next.js convention) |
| `app/sw.ts` | Service worker source (compiled to `public/sw.js` by Serwist) |
| `app/[locale]/~offline/page.tsx` | Offline fallback page |
| `components/pwa/offline-indicator.tsx` | Offline status banner component |
| `components/pwa/session-warning.tsx` | JWT expiry warning badge (offline) |
| `components/pwa/sw-update-prompt.tsx` | SW version update notification (via sonner toast) |
| `hooks/use-online-status.ts` | Hook wrapping `navigator.onLine` + event listeners |
| `hooks/use-sw-lifecycle.ts` | Hook for SW registration, update detection, messaging |

### Modified Files

| File | Changes |
|------|---------|
| `next.config.mjs` | Wrap with `withSerwistInit()` from `@serwist/next` |
| `app/layout.tsx` | Add `<OfflineIndicator />`, `<SessionWarning />`, `<SWUpdatePrompt />` components |
| `components/providers/query-provider.tsx` | Add `refetchOnReconnect: true` to defaultOptions |
| `messages/en.json` | Add `pwa.*` translation keys |
| `messages/ar.json` | Add `pwa.*` translation keys (Arabic) |
| `package.json` | Add `serwist`, `@serwist/next` dependencies |
| `.gitignore` | Add `public/sw.js`, `public/sw.js.map` |

### Deleted Files

| File | Reason |
|------|--------|
| `public/media/app/site.webmanifest` | Replaced by `app/manifest.ts` |

---

## Translation Keys

```json
// messages/en.json additions under "pwa" namespace
{
  "pwa": {
    "offline_banner": "You're currently offline. Showing cached data.",
    "offline_fallback_title": "You're offline",
    "offline_fallback_description": "This page hasn't been cached yet. Please reconnect to the internet to view it.",
    "offline_fallback_retry": "Try again",
    "session_expired_warning": "Session may be expired — reconnect to continue editing",
    "update_available": "A new version is available",
    "update_reload": "Reload",
    "write_offline_error": "This action requires an internet connection. Please try again when you're back online."
  }
}
```

```json
// messages/ar.json additions under "pwa" namespace
{
  "pwa": {
    "offline_banner": "أنت غير متصل بالإنترنت حالياً. يتم عرض البيانات المخزنة مؤقتاً.",
    "offline_fallback_title": "أنت غير متصل",
    "offline_fallback_description": "لم يتم تخزين هذه الصفحة بعد. يرجى الاتصال بالإنترنت لعرضها.",
    "offline_fallback_retry": "حاول مرة أخرى",
    "session_expired_warning": "قد تكون الجلسة منتهية — أعد الاتصال لمتابعة التعديل",
    "update_available": "يتوفر إصدار جديد",
    "update_reload": "إعادة تحميل",
    "write_offline_error": "يتطلب هذا الإجراء اتصالاً بالإنترنت. يرجى المحاولة مرة أخرى عند الاتصال."
  }
}
```
