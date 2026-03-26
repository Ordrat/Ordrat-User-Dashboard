# Research: Shop & Branch Management

**Feature**: `002-shop-branch-management` | **Date**: 2026-03-25

## Decision 1: API Call Pattern (Client-Side vs. Server-Side)

**Decision**: Use `ordratFetch()` from `lib/api-client.ts` for all client-side data fetching, wrapped in TanStack Query hooks for caching and mutation.

**Rationale**: `ordratFetch()` already handles Bearer token injection, 401 retry with session refresh, and automatic sign-out. TanStack Query provides cache invalidation, optimistic updates, and loading/error states out of the box.

**Alternatives considered**:
- Server Actions: Rejected — constitution mandates frontend-only architecture; Server Actions would blur the boundary.
- Raw `fetch` in components: Rejected — loses token management and retry logic.

## Decision 2: Form Pattern (RHF + Zod + Dialog)

**Decision**: All forms use React Hook Form + Zod schemas. Branch create/edit forms open in `Dialog` modals. Shop profile and settings are full-page forms.

**Rationale**: Constitution Principle V mandates RHF + Zod. Dialog-based CRUD is the standard pattern for list-detail pages in dashboard UIs — keeps the user on the list page.

**Alternatives considered**:
- Separate pages for branch create/edit: Rejected — too much navigation for simple forms.
- Sheet/drawer: Could work but Dialog is more standard for forms and already available in `components/ui/dialog.tsx`.

## Decision 3: TanStack Query Keys & Cache Invalidation

**Decision**: Use structured query keys per domain:
- `['shop', shopId]` — shop profile
- `['shop-settings', shopId]` — settings
- `['working-hours', shopId]` — working hours
- `['branches', shopId]` — branch list
- `['branch', branchId]` — single branch
- `['shop-categories']` — category dropdown

**Rationale**: Structured keys enable precise invalidation after mutations (e.g., after updating shop profile, invalidate `['shop', shopId]`).

## Decision 4: i18n Setup

**Decision**: Use `i18next` + `react-i18next` with bundled inline resources (no separate JSON files). Language persisted in localStorage. RTL switching via `document.documentElement.dir`.

**Rationale**: Already implemented. Only 2 locales (AR/EN) — inline resources are simpler than file-based loading. `react-i18next` is already in `package.json`.

**Alternatives considered**:
- `next-intl`: Rejected — adds routing complexity (locale prefix in URL) not needed for a dashboard.
- Separate JSON locale files: Overkill for 2 languages in a dashboard. Can migrate later if needed.

## Decision 5: Working Hours UX

**Decision**: Working hours rendered as a 7-row card/table (one row per day) within the settings page. Each row has: day label, open/closed toggle, time pickers for open/close. Submit all 7 days as a batch.

**Rationale**: Working hours are always 7 entries (fixed). A single batch save is simpler than individual per-day saves. The API supports both create (POST) and update (PUT) — logic will check if entries exist to determine which to call.

## Decision 6: PricePerCity Sub-Table

**Decision**: When `ShippingPricingMethod = PricePerCity`, render an inline editable table below the selector. Each row has: city name (text input), delivery price (number input), and a remove button. An "Add City" button appends a new row.

**Rationale**: Simple inline editing avoids the overhead of a separate dialog for each city. The data is a flat array of `{ city, price }` pairs — no complex relationships.

## Decision 7: ShopLanguage Conditional Rendering

**Decision**: Store `ShopLanguage` in form state. Use a `watch('shopLanguage')` from RHF to conditionally render name/description inputs. Same rule propagated to branch forms.

**Rationale**: RHF's `watch` provides reactive rendering without extra state management. The language value is part of the form data, so it's naturally available.

## Decision 8: Image Upload Pattern

**Decision**: Logo and cover uploads use separate API calls (`POST /api/Shop/UploadLogo/{shopId}` and `POST /api/Shop/UploadCover/{shopId}`). Each uses `FormData` with `ordratFetch()`. Uploads are independent of the profile form save.

**Rationale**: The API exposes separate endpoints for logo/cover — aligning with them avoids bundling images into the main update call. Immediate upload + preview is better UX than upload-on-save.

## Decision 9: Sidebar Structure

**Decision**: Add items to `MENU_SIDEBAR_WORKSPACES` in `config/layout.config.tsx`:
- "My Shop" → `/shop` (icon: Store)
- "Branches" → `/branches` (icon: GitBranch)

**Rationale**: The existing sidebar already has a "Store" section (`MENU_SIDEBAR_WORKSPACES`). Shop and Branch management logically belong there.

## Decision 10: Route Roles

**Decision**: Add to `ROUTE_ROLES`:
- `'/shop': ['sellerDashboard-store']`
- `'/shop/settings': ['sellerDashboard-store']`
- `'/branches': ['sellerDashboard-branches', 'CreateBranch']`

**Rationale**: Matches existing role names in `KNOWN_ROLES` (`sellerDashboard-store`, `sellerDashboard-branches`, `CreateBranch`).
