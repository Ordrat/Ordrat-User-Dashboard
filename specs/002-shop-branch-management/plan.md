# Implementation Plan: Shop & Branch Management

**Branch**: `002-shop-branch-management` | **Date**: 2026-03-25 | **Spec**: [spec.md](./spec.md)

## Summary

Implement a seller-facing Shop Profile, Shop Settings (with working hours), and Branch Management (CRUD) feature set. Adds sidebar navigation, route protection, i18n (AR/EN) with RTL support, and updates the header toolbar (language switcher, standalone theme toggle). All data flows through the .NET backend via `ordratFetch()` with TanStack Query for caching.

## Technical Context

**Language/Version**: TypeScript 5.x / Next.js 16.x (App Router)
**Primary Dependencies**: React 19, TanStack Query 5.x, React Hook Form 7.x, Zod 4.x, react-i18next, i18next, ReUI/Metronic 9 component system
**Storage**: N/A (frontend-only; all data via .NET API)
**Testing**: Manual browser testing + `npx tsc --noEmit` + `npm run build`
**Target Platform**: Web browser (desktop + mobile responsive)
**Project Type**: Web application (seller dashboard — frontend-only SPA)
**Performance Goals**: Standard web app expectations (< 3s page load, instant form validation)
**Constraints**: All API calls via `ordratFetch()` (Bearer token + 401 retry); no server-side business logic; components/ui/ first
**Scale/Scope**: Single seller per session, ~7 pages/forms, ~13 API endpoints

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Frontend-Only Architecture | ✅ PASS | All data from .NET API via `ordratFetch()`. No ORM/DB for business entities. |
| II. Component-Library-First | ✅ PASS | All UI uses `components/ui/` (Button, Input, Form, Table, Dialog, Card, Select, etc.) |
| III. Swagger-First API Contracts | ✅ PASS | Constitution v1.1.0 amended — Swagger at `api.ordrat.com` is the single source of truth for all API contracts. |
| IV. Server-Side Route Protection | ✅ PASS | New routes added to `ROUTE_ROLES` in `config/roles.ts`; `proxy.ts` enforces access. |
| V. Type Safety & Schema Validation | ✅ PASS | Zod schemas for all API responses; RHF + Zod for forms; `ordratFetch()` for all API calls; TanStack Query for caching. |

**Gate result: PASS** — All principles satisfied. Principle III amended by user directive (documented in spec Clarifications).

## Project Structure

### Documentation (this feature)

```text
specs/002-shop-branch-management/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (from /speckit.tasks)
```

### Source Code (repository root)

```text
lib/
├── i18n.ts                          # i18next config (already created)
├── api-client.ts                    # ordratFetch() (existing)
└── ordrat-api/
    ├── auth.ts                      # Existing auth functions
    ├── schemas.ts                   # Zod schemas (extend with Shop, Branch, Settings, WorkingHours)
    ├── shop.ts                      # NEW: Shop API functions
    ├── branch.ts                    # NEW: Branch API functions
    ├── settings.ts                  # NEW: Settings + WorkingHours API functions
    └── shop-category.ts             # NEW: ShopCategory API functions

app/(dashboard)/
├── layout.tsx                       # Existing dashboard layout
├── dashboard/page.tsx               # Existing dashboard page
├── shop/
│   ├── page.tsx                     # NEW: Shop profile page
│   └── settings/
│       └── page.tsx                 # NEW: Shop settings + working hours page
└── branches/
    └── page.tsx                     # NEW: Branch list + CRUD (dialog-based create/edit)

components/
├── layout/
│   ├── header-toolbar.tsx           # MODIFIED: language switcher + theme toggle (already done)
│   └── language-switcher.tsx        # NEW: AR/EN toggle (already created)
├── providers/
│   └── i18n-provider.tsx            # NEW: i18next provider (already created)
└── ui/                              # Existing — no changes needed

config/
├── layout.config.tsx             # MODIFY: Add My Shop + Branches sidebar items
└── roles.ts                         # MODIFY: Add /shop and /branches route roles
```

**Structure Decision**: Frontend-only Next.js App Router structure. New pages under `app/(dashboard)/`, API functions in `lib/ordrat-api/`, schemas in `schemas.ts`. All CRUD forms use RHF + Zod + Dialog pattern (create/edit in modals, list as table).

## Complexity Tracking

No constitution violations — no entries needed.
