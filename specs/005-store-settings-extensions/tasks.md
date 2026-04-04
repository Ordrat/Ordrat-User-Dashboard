# Tasks: Store Settings Extensions

**Input**: Design documents from `/specs/005-store-settings-extensions/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

**Organization**: Tasks grouped by user story — each story is independently implementable and testable.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: User story this task belongs to (US1–US5)

---

## Phase 1: Setup

**Purpose**: Install the one new dependency required for QR code generation.

- [ ] T001 Install `qr-code-styling` package via `pnpm add qr-code-styling` (required for QR Code page — dot shapes, colors, logo embed, PNG/SVG export)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core scaffolding that ALL user stories depend on — schemas, endpoints, sidebar navigation, and i18n keys. **No user story work can begin until this phase is complete.**

- [ ] T002 Add enums (`PaymentMethod` 0–9, `TableStatus` 0–2, `TableLocation` 0–2, `LogsActionType` 0–46) and Zod schemas (`PaymentGatewaySchema`, `TableSchema`, `ContactInfoSchema`, `LogEntrySchema` with `.passthrough()`) to `lib/ordrat-api/schemas.ts`
- [ ] T003 Add endpoint groups `ShopPaymentGateway` (GetByShopId, Create, Update), `Table` (GetAllByBranch, GetById, Create, Update, ChangeStatus), `ShopContactInfo` (GetByShopId, Create, Update, Delete), and `Logs` (GetLogsOverTime) to `lib/ordrat-api/endpoints.ts` following existing `Branch`/`Shop` pattern
- [ ] T004 Restructure sidebar in `config/layout.config.tsx`: rename `nav.store` group title to `nav.storeSettings`, rename `nav.myShop` entry to `nav.basicData` (path stays `/shop`), add five new entries with Lucide icons — Payment Gateways (`/payment-gateways`, `CreditCard`), Tables (`/tables`, `UtensilsCrossed`), Contact Info (`/contact-info`, `Phone`), Logs (`/logs`, `ClipboardList`), QR Code (`/qr-code`, `QrCode`)
- [ ] T005 [P] Add all new i18n keys to `messages/en.json`: `nav.storeSettings`, `nav.basicData`, `nav.paymentGateways`, `nav.tables`, `nav.contactInfo`, `nav.logs`, `nav.qrCode`; sections `paymentGateways.*` (title, add, edit, method labels 0–9, enabled, priority, name, description, createSuccess/Error, updateSuccess/Error, loadError, conflict, emptyState), `tables.*` (title, add, edit, branch, tableNumber, capacity, location labels 0–2, status labels 0–2, createSuccess/Error, updateSuccess/Error, changeStatusSuccess/Error, loadError, duplicate, emptyState, selectBranch), `contactInfo.*` (title, whatsApp, facebook, x, instagram, saveSuccess/Error, deleteSuccess/Error, deleteConfirm, loadError, emptyState), `logs.*` (title, startTime, endTime, action, entity, entityId, timestamp, emptyState, loadError, pageSize, actionLabels.0–46), `qrCode.*` (title, domain, noDomain, noDomainLink, styleA, styleB, styleC, fgColor, bgColor, downloadPng, downloadSvg, preview)
- [ ] T006 [P] Mirror all keys added in T005 to `messages/ar.json` with Arabic translations (same key structure, Arabic values)

**Checkpoint**: Sidebar shows "Store Settings" with 7 items. Schemas and endpoints compile. i18n keys exist in both languages.

---

## Phase 3: User Story 1 — Payment Gateways (Priority: P1) 🎯 MVP

**Goal**: Store owner can list, create, and update payment gateways for their shop including toggling enabled state and setting priority.

**Independent Test**: Navigate to `/payment-gateways` → see gateway list → toggle a gateway on/off → add a new gateway → edit its name → verify 409 conflict on duplicate method.

### Implementation

- [ ] T007 [US1] Create `lib/ordrat-api/payment-gateway.ts`: define `PaymentGatewayInput`, `UpdatePaymentGatewayInput` TypeScript interfaces; implement `getPaymentGatewaysByShopId(shopId)` (GET, parse `z.array(PaymentGatewaySchema)`), `createPaymentGateway(input)` (POST with `_entityType: 'ShopPaymentGateway'`), `updatePaymentGateway(id, input)` (PUT with `_entityType: 'ShopPaymentGateway'` + `_entityId`); implement TanStack Query hooks `usePaymentGateways()`, `useCreatePaymentGateway()`, `useUpdatePaymentGateway()` with query key `['payment-gateways', shopId]` and `staleTime: 60_000` / `gcTime: 86_400_000`
- [ ] T008 [US1] Create `app/[locale]/(dashboard)/payment-gateways/page.tsx`: page skeleton with `'use client'`, `usePageMeta(t('paymentGateways.title'))`, load gateways via `usePaymentGateways()`, render `<Card>` with `<Table>` showing columns: localized gateway name (nameEn/nameAr by locale), payment method label (from enum map), enabled `<Switch>` (triggers `useUpdatePaymentGateway` inline), priority `<Input type="number">`, edit action button; loading skeleton and empty state
- [ ] T009 [US1] Add "Add Payment Gateway" `<Dialog>` to `app/[locale]/(dashboard)/payment-gateways/page.tsx`: React Hook Form + Zod schema with fields: `paymentMethod` (`<Select>` with PaymentMethod labels), `gatewayNameEn`, `gatewayNameAr`, `gatewayDescriptionEn`, `gatewayDescriptionAr`, `priority`, `isEnabled` `<Switch>`; submit calls `useCreatePaymentGateway().mutateAsync`; on success: close dialog + `if (!isOffline) toast.success(...)`
- [ ] T010 [US1] Add "Edit Payment Gateway" `<Dialog>` to `app/[locale]/(dashboard)/payment-gateways/page.tsx`: same form as create pre-filled with selected gateway data; submit calls `useUpdatePaymentGateway().mutateAsync(id, values)`; on success: close dialog + `if (!isOffline) toast.success(...)`; import `useOnlineStatus` for all toast guards
- [ ] T011 [US1] Add error handling to `app/[locale]/(dashboard)/payment-gateways/page.tsx`: catch HTTP 409 on create and show `t('paymentGateways.conflict')` toast; catch 404 on update; show `toast.error` on load failure; handle empty gateway list with empty state illustration and prompt to add first gateway

**Checkpoint**: Payment Gateways page fully functional and independently testable.

---

## Phase 4: User Story 2 — Tables per Branch (Priority: P2)

**Goal**: Store owner can select a branch and manage its tables — create tables with capacity/location, update details, and change status (Available/Occupied/Reserved).

**Independent Test**: Navigate to `/tables` → select a branch from dropdown → see table list → add a table → change its status → edit capacity → verify duplicate number error.

### Implementation

- [ ] T012 [US2] Create `lib/ordrat-api/table.ts`: define `CreateTableInput`, `UpdateTableInput` interfaces; implement `getTablesByBranch(branchId)` (GET, parse `z.array(TableSchema)`), `createTable(branchId, input)` (POST with `_entityType: 'Table'`), `updateTable(id, input)` (PUT with `_entityType` + `_entityId`), `changeTableStatus(id, status)` (PUT to `ChangeTableStatus` endpoint with `_entityType` + `_entityId`); hooks `useTables(branchId)` with query key `['tables', branchId]`, `useCreateTable()`, `useUpdateTable()`, `useChangeTableStatus()` — all invalidate `['tables', branchId]`
- [ ] T013 [US2] Create `app/[locale]/(dashboard)/tables/page.tsx`: page skeleton with `usePageMeta(t('tables.title'))`; branch selector at top using `useBranches()` with `<Select>` — stores selected `branchId` in `useState`; when branch selected, show table list via `useTables(branchId)` in `<Table>` with columns: table number, capacity, location label, status `<Badge>` (color-coded by status), description; empty state when no branch selected and when branch has no tables; loading skeleton
- [ ] T014 [US2] Add "Add Table" `<Dialog>` to `app/[locale]/(dashboard)/tables/page.tsx`: React Hook Form + Zod with fields: `tableNumber` (`<Input type="number">`), `capacity` (`<Input type="number">`), `location` (`<Select>` with Indoor/Outdoor/Rooftop labels), `descriptionEn`, `descriptionAr`; submit calls `useCreateTable().mutateAsync({ branchId, ...values })`; on success: close + `if (!isOffline) toast.success(...)`
- [ ] T015 [US2] Add "Edit Table" `<Dialog>` and status change to `app/[locale]/(dashboard)/tables/page.tsx`: edit dialog pre-fills table data, submits via `useUpdateTable()`; add inline status selector per row (dropdown `<Select>` with Available/Occupied/Reserved) that calls `useChangeTableStatus().mutateAsync({ id, status })`; both include `if (!isOffline) toast.success(...)` guard
- [ ] T016 [US2] Add error handling to `app/[locale]/(dashboard)/tables/page.tsx`: show field-level error for duplicate table number; handle `useBranches()` loading/error states; handle empty branch list with prompt linking to Branches page

**Checkpoint**: Tables page fully functional with branch switching and all CRUD+status operations.

---

## Phase 5: User Story 5 — QR Code Generator (Priority: P2)

**Goal**: Store owner sees their shop domain, picks one of three QR style presets, customizes colors (Style B) or logo embed (Style C), and downloads the result as PNG or SVG.

**Independent Test**: Navigate to `/qr-code` → see domain URL displayed → switch between Style A/B/C → change foreground color on Style B → verify QR preview updates → click Download PNG → verify file downloads.

### Implementation

- [ ] T017 [P] [US5] Create `app/[locale]/(dashboard)/qr-code/page.tsx`: page skeleton with `usePageMeta(t('qrCode.title'))`; read `subdomainName` from `useShopProfile()` (existing hook); if no subdomain — show `<Alert>` with `t('qrCode.noDomain')` and a link to `/shop`; if subdomain exists — display full domain URL `https://<subdomain>.ordrat.com` in a `<Card>` with copy-to-clipboard; declare state: `selectedStyle: 'classic' | 'rounded' | 'logo'` defaulting to `'classic'`, `fgColor: '#000000'`, `bgColor: '#ffffff'`
- [ ] T018 [US5] Add QR style selector and live preview to `app/[locale]/(dashboard)/qr-code/page.tsx`: render three style cards (A: classic squares, B: rounded dots + brand color, C: classic + shop logo) as clickable radio group with visual previews; instantiate `QRCodeStyling` from `qr-code-styling` with options derived from `selectedStyle`, `fgColor`, `bgColor`, and shop logo URL (from shop profile) — update on every state change; mount the QR canvas into a `useRef` container; Style B shows `<input type="color">` pickers for foreground and background colors
- [ ] T019 [US5] Add download buttons to `app/[locale]/(dashboard)/qr-code/page.tsx`: "Download PNG" button calls `qrCode.download({ extension: 'png', name: 'shop-qr' })`; "Download SVG" button calls `qrCode.download({ extension: 'svg', name: 'shop-qr' })`; if logo unavailable for Style C, fall back to Style A options silently; wrap QR instantiation in `useEffect` to avoid SSR issues (`'use client'` already declared)

**Checkpoint**: QR Code page shows domain, all three styles render, colors update live, PNG and SVG download.

---

## Phase 6: User Story 3 — Contact Information (Priority: P3)

**Goal**: Store owner can create, update, or delete the shop's WhatsApp number and social media links in a single form.

**Independent Test**: Navigate to `/contact-info` → fill in WhatsApp + Instagram → save → verify record created → update Facebook → save → verify update → delete all → verify form resets.

### Implementation

- [ ] T020 [P] [US3] Create `lib/ordrat-api/contact-info.ts`: define `ContactInfoInput`, `UpdateContactInfoInput` interfaces; implement `getContactInfoByShopId(shopId)` (GET, parse `ContactInfoSchema`, return `null` on 404), `createContactInfo(input)` (POST with `_entityType: 'ShopContactInfo'`), `updateContactInfo(id, input)` (PUT with `_entityType` + `_entityId`), `deleteContactInfo(id)` (DELETE with `_entityType` + `_entityId`); hooks `useContactInfo()` with query key `['contact-info', shopId]`, `useCreateContactInfo()`, `useUpdateContactInfo()`, `useDeleteContactInfo()` — all invalidate `['contact-info', shopId]`
- [ ] T021 [US3] Create `app/[locale]/(dashboard)/contact-info/page.tsx`: page skeleton with `usePageMeta(t('contactInfo.title'))`; load via `useContactInfo()`; React Hook Form + Zod schema with fields `whatsAppNumber` (optional, regex phone validation), `facebookLink` (optional, URL validation), `xLink` (optional, URL validation), `instagramLink` (optional, URL validation); `useEffect` to populate form when data loads; smart submit: if `contactInfo` exists → `useUpdateContactInfo().mutateAsync(id, values)`, else → `useCreateContactInfo().mutateAsync({ ...values, shopId })`; `if (!isOffline) toast.success(...)` on success
- [ ] T022 [US3] Add delete functionality to `app/[locale]/(dashboard)/contact-info/page.tsx`: "Delete Contact Info" button opens `useUIStore` confirm dialog (already in root layout via `ConfirmDialog`); on confirm: calls `useDeleteContactInfo().mutateAsync(id)`; on success: reset form to empty + `if (!isOffline) toast.success(...)`; handle 404 on delete gracefully (already deleted — show info toast, refetch)

**Checkpoint**: Contact Info page handles create/update/delete in a single smart form.

---

## Phase 7: User Story 4 — Activity Logs (Priority: P3)

**Goal**: Store owner sees a reverse-chronological paginated list of shop activity with date range, action type, entity name, and entity ID filters.

**Independent Test**: Navigate to `/logs` → see latest log entries → filter by today's date range → filter by action type → navigate to page 2 → verify results update correctly.

### Implementation

- [ ] T023 [P] [US4] Create `lib/ordrat-api/logs.ts`: define `LogsParams` interface (`pageNumber?`, `pageSize?`, `startTime?`, `endTime?`, `action?`, `entity?`, `entityId?`); implement `getLogsOverTime(params)` (GET with URLSearchParams, parse `z.array(LogEntrySchema)`); hook `useLogs(params: LogsParams)` with query key `['logs', params]`, `enabled: true` always (logs are not entity-scoped on the frontend), `staleTime: 30_000` / `gcTime: 86_400_000`; no mutations — read-only domain
- [ ] T024 [US4] Create `app/[locale]/(dashboard)/logs/page.tsx`: page skeleton with `usePageMeta(t('logs.title'))`; filter bar in a `<Card>`: start date/time `<Input type="datetime-local">`, end date/time `<Input type="datetime-local">`, action type `<Select>` (all LogsActionType labels), entity name `<Input>`, entity ID `<Input>`; filter state in `useState`; load via `useLogs(filters)`; render `<Table>` with columns: timestamp (formatted `toLocaleString`), action label (from enum map), entity, entityId truncated with `<Tooltip>`, description; loading skeleton rows
- [ ] T025 [US4] Add pagination and empty state to `app/[locale]/(dashboard)/logs/page.tsx`: pagination state (`pageNumber`, `pageSize`) in `useState`; page size `<Select>` (10/25/50 options); previous/next buttons wired to `setPageNumber`; empty state when result array is empty; error state when `useLogs` returns an error; "Clear Filters" button resets all filter state

**Checkpoint**: Logs page shows filtered, paginated entries with all filter combinations working.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: PWA offline registration, final type safety, and build validation.

- [ ] T026 Register all five new routes in `hooks/use-page-precache.ts` `ROUTE_API_ENDPOINTS` map: `/payment-gateways` → `[ShopPaymentGateway.GetByShopId(shopId)]`, `/tables` → `[Branch.GetByShopId(shopId)]` (precache branches for dropdown), `/contact-info` → `[ShopContactInfo.GetByShopId(shopId)]`, `/logs` → `[]` (filter-driven, no static precache), `/qr-code` → `[Shop.GetById(shopId)]` (need subdomain)
- [ ] T027 [P] Run `npx tsc --noEmit` and fix all TypeScript type errors across new files — ensure all Zod inferred types, hook return types, and form value types are consistent
- [ ] T028 [P] Run `pnpm build` and fix any Next.js build errors (SSR safety for `qr-code-styling`, missing `'use client'` directives, import issues); verify zero errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundation)**: Depends on Phase 1 — **blocks all user stories**
- **Phase 3–7 (User Stories)**: All depend on Phase 2 completion
  - US1 (P3) and US5 (P5/Phase 5) can run in parallel (different files)
  - US2 (P4), US3 (P6), US4 (P7) are also independent of each other
- **Phase 8 (Polish)**: Depends on all desired user stories complete

### User Story Dependencies

- **US1 (P1 — Payment Gateways)**: No dependency on other stories — start first
- **US2 (P2 — Tables)**: No dependency on other stories — can parallel with US1
- **US5 (P2 — QR Code)**: Reads from existing `useShopProfile()` hook — no new domain deps
- **US3 (P3 — Contact Info)**: No dependency on other stories
- **US4 (P3 — Activity Logs)**: No dependency on other stories

### Within Each User Story

- API domain file (T007, T012, T020, T023) → page tasks (T008+)
- Page skeleton → create dialog → edit dialog → error handling

### Parallel Opportunities

- T005 (en.json) and T006 (ar.json) can run in parallel (different files)
- T007 (payment-gateway.ts), T012 (table.ts), T020 (contact-info.ts), T023 (logs.ts) can all be created in parallel after Phase 2
- T017 (QR skeleton) is marked [P] — can start alongside T012 (different file)
- T027 (tsc) and T028 (build) are sequential but fast

---

## Parallel Example: After Phase 2 (Foundation Ready)

```text
# These can all run simultaneously (different files, no cross-deps):
T007  Create lib/ordrat-api/payment-gateway.ts        [US1]
T012  Create lib/ordrat-api/table.ts                  [US2]
T017  Create QR Code page skeleton                    [US5]
T020  Create lib/ordrat-api/contact-info.ts           [US3]
T023  Create lib/ordrat-api/logs.ts                   [US4]
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundation (T002–T006) — **critical blocker**
3. Complete Phase 3: US1 Payment Gateways (T007–T011)
4. **STOP and VALIDATE**: Payment Gateways page works end-to-end
5. Continue with remaining stories in priority order

### Incremental Delivery

1. Setup + Foundation → sidebar restructured, schemas/endpoints ready
2. US1 Payment Gateways → validate independently
3. US2 Tables + US5 QR Code → validate both (same P2 priority, can parallel)
4. US3 Contact Info + US4 Logs → validate both (same P3 priority, can parallel)
5. Phase 8 Polish → type check + build pass

### Task Count Summary

| Phase | Story | Tasks | Description |
|-------|-------|-------|-------------|
| Phase 1 | Setup | 1 | Install qr-code-styling |
| Phase 2 | Foundation | 5 | Schemas, endpoints, sidebar, i18n (×2) |
| Phase 3 | US1 (P1) | 5 | Payment Gateways API + page |
| Phase 4 | US2 (P2) | 5 | Tables API + page |
| Phase 5 | US5 (P2) | 3 | QR Code page (client-side) |
| Phase 6 | US3 (P3) | 3 | Contact Info API + page |
| Phase 7 | US4 (P3) | 3 | Activity Logs API + page |
| Phase 8 | Polish | 3 | PWA precache + type check + build |
| **Total** | | **28** | |

---

## Notes

- `[P]` = different files, no shared dependencies — safe to execute in parallel
- `[US#]` = maps task to spec.md user story for traceability
- Every mutation must include `_entityType` (and `_entityId` on update/delete) per PWA checklist
- Every success toast must be guarded: `if (!isOffline) toast.success(...)`
- Every page must call `usePageMeta(t('key'))` — no hardcoded titles
- `qr-code-styling` must be wrapped in `useEffect` with `'use client'` — SSR unsafe
- `ConfirmDialog` for delete is already mounted in root layout — use `useUIStore` to trigger it
- Do NOT add `Toaster` again — already in root layout
