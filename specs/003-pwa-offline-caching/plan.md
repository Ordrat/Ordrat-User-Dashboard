# Implementation Plan: PWA & Offline Caching

**Branch**: `003-pwa-offline-caching` | **Date**: 2026-03-26 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-pwa-offline-caching/spec.md`

## Summary

Transform the Ordrat seller dashboard into a Progressive Web App with offline-first capabilities. Uses Serwist (`@serwist/next`) to add a service worker with precaching for the app shell, stale-while-revalidate caching for API GET responses, and an offline fallback page. Includes a web app manifest for installability, offline indicator banner, session expiry warning, and SW update notification — all with Arabic/English i18n support.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Next.js 16.x, React 19, `serwist` + `@serwist/next` (new), TanStack Query 5.x, react-i18next, sonner
**Storage**: Browser Cache Storage (managed by Serwist service worker)
**Testing**: Manual validation via Lighthouse PWA audit + DevTools offline simulation
**Target Platform**: Chrome/Edge (desktop + Android), Safari (iOS), progressive enhancement for others
**Project Type**: Web application (frontend-only dashboard)
**Performance Goals**: App shell renders < 1s from cache; API data served from cache instantly when offline; 40% TTI improvement on repeat visits
**Constraints**: HTTPS required (SW prerequisite); offline writes fail gracefully (no background sync queue); no SSG for authenticated pages
**Scale/Scope**: Single-seller dashboard; ~10-15 pages; ~20 API endpoints cached

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Frontend-Only Architecture | **PASS** | PWA is purely client-side — no server-side business logic added |
| II. Component-Library-First | **PASS** | Offline indicator uses existing `Alert` from `components/ui/alert.tsx`; SW update toast uses existing `sonner` |
| III. Swagger-First API Contracts | **N/A** | No new API endpoints; caching existing GET responses only |
| IV. Server-Side Route Protection | **PASS** | `proxy.ts` matcher already excludes `*.js` and static files; `sw.js` and manifest not intercepted |
| V. Internationalisation First | **PASS** | All new user-facing text uses i18next with `pwa.*` keys in `messages/en.json` and `messages/ar.json` |
| VI. Type Safety & Schema Validation | **PASS** | SW source is TypeScript (`app/sw.ts`); message protocol has typed interfaces |

**Post-Phase 1 Re-check**: All gates still pass. No constitution violations.

## Project Structure

### Documentation (this feature)

```text
specs/003-pwa-offline-caching/
├── plan.md              # This file
├── research.md          # Serwist integration decisions, caching strategies
├── data-model.md        # Cache topology, TypeScript interfaces, file change map
├── quickstart.md        # 10-step validation guide
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
app/
├── manifest.ts                          # NEW — Web App Manifest
├── sw.ts                                # NEW — Service worker source (Serwist)
├── layout.tsx                           # MODIFIED — Add PWA components
└── [locale]/
    └── ~offline/
        └── page.tsx                     # NEW — Offline fallback page

components/
└── pwa/
    ├── offline-indicator.tsx            # NEW — Offline status banner
    ├── session-warning.tsx              # NEW — JWT expiry warning (offline)
    └── sw-update-prompt.tsx             # NEW — SW update toast notification

hooks/
├── use-online-status.ts                # NEW — navigator.onLine hook
└── use-sw-lifecycle.ts                 # NEW — SW registration + update detection

next.config.mjs                          # MODIFIED — Wrap with withSerwistInit()
components/providers/query-provider.tsx   # MODIFIED — Add refetchOnReconnect
messages/en.json                         # MODIFIED — Add pwa.* keys
messages/ar.json                         # MODIFIED — Add pwa.* keys (Arabic)
package.json                             # MODIFIED — Add serwist dependencies
.gitignore                               # MODIFIED — Add public/sw.js*

public/media/app/site.webmanifest        # DELETED — Replaced by app/manifest.ts
```

**Structure Decision**: All new PWA components live in `components/pwa/` (new subdirectory) to keep them organized separately from layout and UI components. Hooks follow existing convention in `hooks/`. The SW source file is at `app/sw.ts` per Serwist convention.

## Complexity Tracking

No constitution violations — this table is empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *(none)* | — | — |
