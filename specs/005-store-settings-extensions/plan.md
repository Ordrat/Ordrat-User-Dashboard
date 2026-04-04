# Implementation Plan: Store Settings Extensions

**Branch**: `005-store-settings-extensions` | **Date**: 2026-03-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-store-settings-extensions/spec.md`

## Summary

Extend the Store Settings section of the seller dashboard with five new sub-pages: Payment Gateways (CRUD), Tables per branch (CRUD + status), Contact Information (CRUD), Activity Logs (paginated read with filters), and a QR Code generator with three style presets (classic/rounded/logo), color customization, and PNG/SVG download. All pages follow the existing frontend-only architecture — API layer via `ordratFetch()`, TanStack Query for caching, React Hook Form + Zod for forms, and full i18n and PWA offline compliance.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Next.js 16.x (App Router), React 19, TanStack Query 5.x, React Hook Form + Zod, `qr-code-styling` (new)
**Storage**: N/A — frontend-only, all data via .NET API at `api.ordrat.com`
**Testing**: `npx tsc --noEmit` + `pnpm build` (Vercel CI)
**Target Platform**: Web (PWA-capable, offline-first)
**Project Type**: Web application (frontend dashboard)
**Performance Goals**: Pages load < 2s, filter interactions < 1s (SC-004)
**Constraints**: Offline-capable mutations, bilingual AR/EN, `ordratFetch()` only, no raw fetch
**Scale/Scope**: 5 new pages, 4 new API domain files, ~10 new endpoints, ~50 new i18n keys per language

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Frontend-Only Architecture | PASS | All data via .NET API, no server-side business logic |
| II. Component-Library-First | PASS | Using existing `components/ui/` (Table, Card, Form, Select, Switch, Dialog, Input, Badge) |
| III. Swagger-First API Contracts | PASS | All endpoints sourced from swagger.json; contracts documented in `contracts/api-contracts.md` |
| IV. Server-Side Route Protection | PASS | New routes will be added to `proxy.ts` auth guards; no client-side auth redirects |
| V. Internationalisation First | PASS | All text via `useTranslation('common')`, both en.json and ar.json updated simultaneously |
| VI. Type Safety & Schema Validation | PASS | Zod schemas for all API responses, React Hook Form + Zod for forms, `ordratFetch()` for all calls |

**Post-Phase 1 Re-check**: All PASS — no violations.

## Project Structure

### Documentation (this feature)

```text
specs/005-store-settings-extensions/
├── spec.md
├── plan.md                    # This file
├── research.md                # Phase 0 output
├── data-model.md              # Phase 1 output
├── quickstart.md              # Phase 1 output
├── contracts/
│   └── api-contracts.md       # Phase 1 output
├── checklists/
│   └── requirements.md
└── tasks.md                   # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
lib/ordrat-api/
├── endpoints.ts               # MODIFY — add ShopPaymentGateway, Table, ShopContactInfo, Logs
├── schemas.ts                 # MODIFY — add Zod schemas + enums
├── payment-gateway.ts         # NEW — API functions + TanStack hooks
├── table.ts                   # NEW — API functions + TanStack hooks
├── contact-info.ts            # NEW — API functions + TanStack hooks
└── logs.ts                    # NEW — API function + TanStack hook

app/[locale]/(dashboard)/
├── payment-gateways/
│   └── page.tsx               # NEW — Payment Gateways management
├── tables/
│   └── page.tsx               # NEW — Tables per branch (branch dropdown)
├── contact-info/
│   └── page.tsx               # NEW — Contact Info form
├── logs/
│   └── page.tsx               # NEW — Activity Logs viewer
└── qr-code/
    └── page.tsx               # NEW — QR Code generator + customizer

config/
└── layout.config.tsx          # MODIFY — restructure sidebar to "Store Settings"

hooks/
└── use-page-precache.ts       # MODIFY — register 5 new routes

messages/
├── en.json                    # MODIFY — add ~50 new keys
└── ar.json                    # MODIFY — add ~50 new keys (Arabic)
```

**Structure Decision**: Frontend-only, follows existing App Router `app/[locale]/(dashboard)/<route>/page.tsx` pattern. API layer in `lib/ordrat-api/<domain>.ts`. No new directories beyond the page routes.

## Implementation Phases

### Phase 1 — Foundation (Schemas, Endpoints, Sidebar, i18n)

**Goal**: Wire up all backend contracts and navigation before building pages.

1. **Add enums and Zod schemas** to `lib/ordrat-api/schemas.ts`:
   - `PaymentMethod` enum (0–9), `TableStatus` (0–2), `TableLocation` (0–2), `LogsActionType` (0–46)
   - `PaymentGatewaySchema`, `TableSchema`, `ContactInfoSchema`, `LogEntrySchema` with `.passthrough()`

2. **Add endpoint definitions** to `lib/ordrat-api/endpoints.ts`:
   - `ShopPaymentGateway.GetByShopId`, `.Create`, `.Update`
   - `Table.GetAllByBranch`, `.GetById`, `.Create`, `.Update`, `.ChangeStatus`
   - `ShopContactInfo.GetByShopId`, `.Create`, `.Update`, `.Delete`
   - `Logs.GetLogsOverTime`

3. **Restructure sidebar** in `config/layout.config.tsx`:
   - Rename `nav.store` title to `nav.storeSettings`
   - Rename `nav.myShop` to `nav.basicData` (path stays `/shop`)
   - Add entries: Payment Gateways (`/payment-gateways`), Tables (`/tables`), Contact Info (`/contact-info`), Logs (`/logs`), QR Code (`/qr-code`)
   - Import new Lucide icons: `CreditCard`, `QrCode`, `Phone`, `ClipboardList`, `UtensilsCrossed`

4. **Add i18n keys** to both `messages/en.json` and `messages/ar.json`:
   - `nav.storeSettings`, `nav.basicData`, `nav.paymentGateways`, `nav.tables`, `nav.contactInfo`, `nav.logs`, `nav.qrCode`
   - Section keys: `paymentGateways.*`, `tables.*`, `contactInfo.*`, `logs.*`, `qrCode.*`
   - Include CRUD labels, enum labels, validation messages, empty states, success/error toasts

### Phase 2 — API Domain Files

**Goal**: Create the TanStack Query data layer for all four API domains.

5. **`lib/ordrat-api/payment-gateway.ts`**:
   - `getPaymentGatewaysByShopId(shopId)` → GET, parse with `z.array(PaymentGatewaySchema)`
   - `createPaymentGateway(input)` → POST with `_entityType: 'ShopPaymentGateway'`
   - `updatePaymentGateway(id, input)` → PUT with `_entityType` + `_entityId`
   - Hooks: `usePaymentGateways()`, `useCreatePaymentGateway()`, `useUpdatePaymentGateway()`
   - Query key: `['payment-gateways', shopId]`

6. **`lib/ordrat-api/table.ts`**:
   - `getTablesByBranch(branchId)` → GET, parse with `z.array(TableSchema)`
   - `createTable(branchId, input)` → POST with `_entityType: 'Table'`
   - `updateTable(id, input)` → PUT with `_entityType` + `_entityId`
   - `changeTableStatus(id, status)` → PUT with `_entityType` + `_entityId`
   - Hooks: `useTables(branchId)`, `useCreateTable()`, `useUpdateTable()`, `useChangeTableStatus()`
   - Query key: `['tables', branchId]`

7. **`lib/ordrat-api/contact-info.ts`**:
   - `getContactInfoByShopId(shopId)` → GET, parse with `ContactInfoSchema`
   - `createContactInfo(input)` → POST with `_entityType: 'ShopContactInfo'`
   - `updateContactInfo(id, input)` → PUT with `_entityType` + `_entityId`
   - `deleteContactInfo(id)` → DELETE with `_entityType` + `_entityId`
   - Hooks: `useContactInfo()`, `useCreateContactInfo()`, `useUpdateContactInfo()`, `useDeleteContactInfo()`
   - Query key: `['contact-info', shopId]`

8. **`lib/ordrat-api/logs.ts`**:
   - `getLogsOverTime(params)` → GET with query params, parse with `z.array(LogEntrySchema)`
   - Hook: `useLogs(params)` — `params` includes page, pageSize, startTime, endTime, action, entity, entityId
   - Query key: `['logs', params]`

### Phase 3 — Page Implementations

**Goal**: Build all five new pages using the API layer and existing UI components.

9. **Payment Gateways page** (`app/[locale]/(dashboard)/payment-gateways/page.tsx`):
   - `usePageMeta(t('paymentGateways.title'))`
   - List view with `<Table>` showing: name (localized), method label, enabled `<Switch>`, priority `<Input type="number">`
   - Add dialog with form: payment method `<Select>`, names AR/EN, descriptions AR/EN, priority, enabled toggle
   - Edit dialog reuses same form, pre-filled
   - Toggle enabled inline via `useUpdatePaymentGateway`
   - Handle 409 conflict on create
   - PWA: `_entityType: 'ShopPaymentGateway'`, offline toast suppression

10. **Tables page** (`app/[locale]/(dashboard)/tables/page.tsx`):
    - `usePageMeta(t('tables.title'))`
    - Branch dropdown at top using `useBranches()` + `<Select>`
    - Table list with `<Table>` showing: number, capacity, location label, status `<Badge>`, description
    - Add dialog: table number, capacity, location `<Select>`, descriptions AR/EN
    - Edit dialog: same fields minus branchId
    - Status change inline via `useChangeTableStatus` with `<Select>` or status buttons
    - PWA: `_entityType: 'Table'`, offline toast suppression

11. **Contact Info page** (`app/[locale]/(dashboard)/contact-info/page.tsx`):
    - `usePageMeta(t('contactInfo.title'))`
    - Single form with fields: WhatsApp `<Input>`, Facebook `<Input>`, X `<Input>`, Instagram `<Input>`
    - Zod validation: phone pattern for WhatsApp, URL pattern for social links
    - Smart create/update: if `useContactInfo()` returns data → update mode, else → create mode
    - Delete button with `ConfirmDialog` (already in root layout)
    - PWA: `_entityType: 'ShopContactInfo'`, offline toast suppression

12. **Activity Logs page** (`app/[locale]/(dashboard)/logs/page.tsx`):
    - `usePageMeta(t('logs.title'))`
    - Filter bar: date range picker (start/end), action type `<Select>`, entity name `<Input>`, entity ID `<Input>`
    - Paginated `<Table>` showing: timestamp (formatted), action label, entity, description
    - Pagination controls below table
    - Empty state when no results
    - Read-only — no mutations, no PWA offline queue needed (but precache GET)

13. **QR Code page** (`app/[locale]/(dashboard)/qr-code/page.tsx`):
    - `usePageMeta(t('qrCode.title'))`
    - Display shop domain URL in plain text (from `useShopProfile()` → `subdomainName`)
    - If no subdomain: show alert with link to Basic Data (`/shop`)
    - Three style cards (A/B/C) with radio selection — each shows a small preview
    - Style B: show foreground/background color pickers (hex input + `<input type="color">`)
    - Style C: auto-embed shop logo from profile
    - QR preview rendered via `qr-code-styling` — updates on every style/color change
    - Download buttons: "Download PNG" and "Download SVG"
    - No backend calls for QR — purely client-side rendering

### Phase 4 — PWA & Polish

14. **Register routes in `hooks/use-page-precache.ts`**:
    ```
    '/payment-gateways': (shopId) => [ShopPaymentGateway.GetByShopId(shopId)]
    '/tables': (shopId) => [Branch.GetByShopId(shopId)]  // need branches for dropdown
    '/contact-info': (shopId) => [ShopContactInfo.GetByShopId(shopId)]
    '/logs': () => []  // logs are filter-driven, no static precache
    '/qr-code': (shopId) => [Shop.GetById(shopId)]  // need subdomain
    ```

15. **Type check and build verification**:
    - `npx tsc --noEmit` — zero errors
    - `pnpm build` — zero errors (Vercel CI compatibility)

## Complexity Tracking

> No constitution violations — table is empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none) | — | — |
