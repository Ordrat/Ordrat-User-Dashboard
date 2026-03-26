# Tasks: Shop & Branch Management

**Input**: Design documents from `/specs/002-shop-branch-management/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: TanStack Query provider, Zod schemas, API functions, sidebar & route config

- [x] T001 Create TanStack Query provider in `components/providers/query-provider.tsx` and wrap app in `app/layout.tsx`
- [x] T002 Add Zod schemas for Shop, ShopSettings, CityPrice, WorkingHours, Branch, ShopCategory, and all enums (ShopLanguage, ShopType, TransactionType, ShippingPricingMethod) in `lib/ordrat-api/schemas.ts`
- [x] T003 [P] Create Shop API functions (`getShopByUserId`, `updateShop`, `uploadLogo`, `uploadCover`) using `ordratFetch()` in `lib/ordrat-api/shop.ts`
- [x] T004 [P] Create Branch API functions (`getBranchesByShopId`, `getBranchById`, `createBranch`, `updateBranch`, `deleteBranch`, `searchBranches`) using `ordratFetch()` in `lib/ordrat-api/branch.ts`
- [x] T005 [P] Create Settings API functions (`getSettingsByShopId`, `updateSettings`) and WorkingHours API functions (`getWorkingHoursByShopId`, `createWorkingHours`, `updateWorkingHours`) using `ordratFetch()` in `lib/ordrat-api/settings.ts`
- [x] T006 [P] Create ShopCategory API function (`getAllShopCategories`) using `ordratFetch()` in `lib/ordrat-api/shop-category.ts`
- [x] T007 Add sidebar menu items ("My Shop" → `/shop`, "Branches" → `/branches`) to `MENU_SIDEBAR_WORKSPACES` in `config/layout.config.tsx`
- [x] T008 Add route role mappings (`/shop`, `/shop/settings`, `/branches`) to `ROUTE_ROLES` in `config/roles.ts`

**Checkpoint**: All API functions, schemas, sidebar navigation, and route protection are in place. Pages can now be built.

---

## Phase 2: User Story 1 — View & Edit Shop Profile (Priority: P1) 🎯 MVP

**Goal**: Seller can view and edit their shop profile (name, description, phone, email, address, delivery time, minimum order, shop type, shop language) and upload logo/cover images independently.

**Independent Test**: Navigate to `/dashboard/shop`, verify form is pre-filled, edit a field, save, confirm success toast. Upload logo/cover, confirm preview updates.

### Implementation for User Story 1

- [x] T009 [US1] Create TanStack Query hooks for shop data: `useShopProfile` (GET shop by user), `useUpdateShop` (PUT mutation), `useUploadLogo` (POST mutation), `useUploadCover` (POST mutation), `useShopCategories` (GET all categories) in `lib/ordrat-api/shop.ts`
- [x] T010 [US1] Create the Shop Profile page at `app/(dashboard)/shop/page.tsx` with: RHF form using Zod validation, pre-filled from `useShopProfile`, ShopLanguage select that conditionally shows/hides NameEn/NameAr/DescriptionEn/DescriptionAr inputs, ShopType select (Shop | SuperMarket), category dropdown from `useShopCategories`, all other profile fields (phone, email, address, lat/lng, delivery time, minimum order), Save button calling `useUpdateShop` with success/error toasts
- [x] T011 [US1] Add logo upload section to shop profile page: file input with image preview, calls `useUploadLogo` on file select, shows current logo from API, updates preview immediately after upload
- [x] T012 [US1] Add cover image upload section to shop profile page: file input with image preview, calls `useUploadCover` on file select, shows current cover from API, updates preview immediately after upload

**Checkpoint**: Shop Profile page is fully functional — seller can view, edit, save profile and upload images.

---

## Phase 3: User Story 2 — View & Edit Shop Settings (Priority: P2)

**Goal**: Seller can view and edit shop settings including TransactionType (Percentage/Flat) and ShippingPricingMethod (Fixed/PricePerCity with city-price table).

**Independent Test**: Navigate to `/dashboard/shop/settings`, verify settings pre-filled, toggle TransactionType, toggle ShippingPricingMethod to PricePerCity and add city rows, save.

### Implementation for User Story 2

- [x] T013 [US2] Create TanStack Query hooks for settings: `useShopSettings` (GET), `useUpdateSettings` (PUT mutation) in `lib/ordrat-api/settings.ts`
- [x] T014 [US2] Create the Shop Settings page at `app/(dashboard)/shop/settings/page.tsx` with: RHF form using Zod validation, pre-filled from `useShopSettings`, TransactionType select (Percentage | Flat) with dynamic label on the delivery fee input, ShippingPricingMethod select (Fixed | PricePerCity), conditional rendering: Fixed → single price input, PricePerCity → inline editable city-price table, Save button calling `useUpdateSettings` with success/error toasts
- [x] T015 [US2] Implement the PricePerCity sub-table component within the settings page: editable rows with city name (text) + price (number) + remove button, "Add City" button to append rows, validation requiring at least one row when PricePerCity is selected

**Checkpoint**: Shop Settings page is fully functional — seller can configure delivery fees and shipping pricing.

---

## Phase 4: User Story 3 — Manage Working Hours (Priority: P2)

**Goal**: Seller can configure weekly working schedule (7 days) with open/closed toggle and time pickers per day.

**Independent Test**: On `/dashboard/shop/settings`, find the working hours section, set a day's hours, save, reload and verify persistence.

### Implementation for User Story 3

- [x] T016 [US3] Create TanStack Query hooks for working hours: `useWorkingHours` (GET by shopId), `useCreateWorkingHours` (POST mutation), `useUpdateWorkingHours` (PUT mutation) in `lib/ordrat-api/settings.ts`
- [x] T017 [US3] Add WorkingHours section to `app/(dashboard)/shop/settings/page.tsx`: 7-row card layout (one per day of week), each row has day label + open/closed toggle + time pickers for open/close times, time inputs disabled/hidden when day is toggled closed, Save button that batch-submits all 7 days (creates new entries via POST or updates existing via PUT based on presence of `id`)

**Checkpoint**: Working Hours section is functional on the settings page — seller can set weekly schedule.

---

## Phase 5: User Story 4 — List & Search Branches (Priority: P3)

**Goal**: Seller sees all branches in a table with search functionality and an empty state for shops with no branches.

**Independent Test**: Navigate to `/dashboard/branches`, confirm branch list loads, use search to filter.

### Implementation for User Story 4

- [x] T018 [US4] Create TanStack Query hooks for branches: `useBranches` (GET by shopId), `useSearchBranches` (GET search) in `lib/ordrat-api/branch.ts`
- [x] T019 [US4] Create the Branches list page at `app/(dashboard)/branches/page.tsx` with: table (using TanStack Table or simple `components/ui/table.tsx`) showing columns: Name (AR/EN based on ShopLanguage), Phone, Address, Actions (Edit/Delete buttons), search input that filters via `useSearchBranches` or client-side filter, empty state with "Add Branch" CTA when no branches exist, "Add Branch" button in the page header

**Checkpoint**: Branch list page is functional — seller can view and search branches.

---

## Phase 6: User Story 5 — Create Branch (Priority: P3)

**Goal**: Seller can add a new branch via a dialog form.

**Independent Test**: Click "Add Branch", fill form, submit, verify new branch appears in list.

### Implementation for User Story 5

- [x] T020 [US5] Create `useCreateBranch` TanStack Query mutation hook in `lib/ordrat-api/branch.ts` with cache invalidation of `['branches', shopId]`
- [x] T021 [US5] Add Branch Create dialog to `app/(dashboard)/branches/page.tsx`: Dialog component with RHF form + Zod validation, fields: NameEn/NameAr (conditional on ShopLanguage), Phone (required), Email, Address, Latitude, Longitude, on submit calls `useCreateBranch`, closes dialog, shows success toast, branch list auto-refreshes via cache invalidation

**Checkpoint**: Seller can create new branches from the list page.

---

## Phase 7: User Story 6 — Edit & Delete Branch (Priority: P3)

**Goal**: Seller can edit a branch in a dialog and delete a branch with confirmation.

**Independent Test**: Click edit on a row → dialog pre-fills → change phone → save → verify update. Click delete → confirm → verify removed.

### Implementation for User Story 6

- [x] T022 [US6] Create `useUpdateBranch` and `useDeleteBranch` TanStack Query mutation hooks in `lib/ordrat-api/branch.ts` with cache invalidation
- [x] T023 [US6] Add Branch Edit dialog to `app/(dashboard)/branches/page.tsx`: reuses the same form as create but pre-filled with selected branch data, on submit calls `useUpdateBranch`, shows success toast, refreshes list
- [x] T024 [US6] Add Branch Delete confirmation to `app/(dashboard)/branches/page.tsx`: uses `Dialog` or `AlertDialog` from `components/ui/`, shows branch name in confirmation text, on confirm calls `useDeleteBranch`, shows success toast, refreshes list

**Checkpoint**: Full Branch CRUD is complete — list, search, create, edit, delete with confirmation.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: i18n coverage, build verification, final cleanup

- [x] T025 Add loading skeleton states to all three pages: use `Skeleton` from `components/ui/skeleton.tsx` while TanStack Query `isLoading` is true; add error fallback UI (error alert with retry) when `isError` is true — apply to `app/(dashboard)/shop/page.tsx`, `app/(dashboard)/shop/settings/page.tsx`, `app/(dashboard)/branches/page.tsx`
- [x] T026 Add translation keys for all Shop, Settings, Branch, and Working Hours page strings to `lib/i18n.ts` (both `en` and `ar` namespaces)
- [x] T027 Apply `useTranslation()` hook across all new pages (`shop/page.tsx`, `shop/settings/page.tsx`, `branches/page.tsx`) to use translation keys instead of hardcoded strings
- [x] T028 Run `npx tsc --noEmit` and fix any TypeScript errors
- [x] T029 Run `npm run build` and verify successful production build
- [x] T030 Run quickstart.md validation checklist (`specs/002-shop-branch-management/quickstart.md`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **US1 Shop Profile (Phase 2)**: Depends on Phase 1 (schemas + shop API)
- **US2 Shop Settings (Phase 3)**: Depends on Phase 1 (schemas + settings API). Independent of US1.
- **US3 Working Hours (Phase 4)**: Depends on Phase 1 (schemas + settings API). Shares page with US2 so build after US2.
- **US4 Branch List (Phase 5)**: Depends on Phase 1 (schemas + branch API). Independent of US1–US3.
- **US5 Branch Create (Phase 6)**: Depends on US4 (list page must exist).
- **US6 Branch Edit/Delete (Phase 7)**: Depends on US4 (list page must exist). Can parallel with US5.
- **Polish (Phase 8)**: Depends on all user stories being complete.

### User Story Dependencies

```
Phase 1 (Setup)
├── US1 Shop Profile (P1) — independent
├── US2 Shop Settings (P2) — independent
│   └── US3 Working Hours (P2) — same page as US2
└── US4 Branch List (P3) — independent
    ├── US5 Branch Create (P3)
    └── US6 Branch Edit/Delete (P3) — parallel with US5
```

### Parallel Opportunities

Within Phase 1:
- T003, T004, T005, T006 can all run in parallel (different files)

After Phase 1:
- US1 (shop profile) and US2 (shop settings) can run in parallel (different pages)
- US4 (branch list) can run in parallel with US1 and US2 (different page)

Within Branch phases:
- US5 (create) and US6 (edit/delete) can run in parallel once US4 is done

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all API function files together:
Task: "Create Shop API functions in lib/ordrat-api/shop.ts"
Task: "Create Branch API functions in lib/ordrat-api/branch.ts"
Task: "Create Settings API functions in lib/ordrat-api/settings.ts"
Task: "Create ShopCategory API function in lib/ordrat-api/shop-category.ts"
```

## Parallel Example: After Phase 1

```bash
# Launch independent user stories together:
Task: "US1 — Shop Profile page at app/(dashboard)/shop/page.tsx"
Task: "US2 — Shop Settings page at app/(dashboard)/shop/settings/page.tsx"
Task: "US4 — Branch list page at app/(dashboard)/branches/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T008)
2. Complete Phase 2: US1 Shop Profile (T009–T012)
3. **STOP and VALIDATE**: Seller can view/edit profile and upload images
4. Deploy/demo if ready

### Incremental Delivery

1. Setup → Foundation ready
2. Add US1 Shop Profile → Test → Deploy (MVP!)
3. Add US2 + US3 Shop Settings + Working Hours → Test → Deploy
4. Add US4 + US5 + US6 Branch CRUD → Test → Deploy
5. Polish (i18n, build verification)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- All API calls use `ordratFetch()` from `lib/api-client.ts`
- TanStack Query hooks (`useQuery`/`useMutation`) are co-located in the same `lib/ordrat-api/*.ts` file as the raw fetch functions. All pages using them are `'use client'` components, so server-component import conflicts do not apply.
- All forms use React Hook Form + Zod from `components/ui/form.tsx`
- All UI uses existing `components/ui/` components — no custom components from scratch
- `.NET enum values are integers` — Zod schemas use `z.number()` for enums
- `shopId` is accessed via `useSession().data.user.shopId`
- TanStack Query cache keys: `['shop', shopId]`, `['shop-settings', shopId]`, `['working-hours', shopId]`, `['branches', shopId]`, `['shop-categories']`
