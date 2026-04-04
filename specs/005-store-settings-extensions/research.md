# Research: Store Settings Extensions

**Feature**: 005-store-settings-extensions
**Date**: 2026-03-31

---

## R-001: Sidebar Navigation Restructure

**Decision**: Rename the existing `MENU_SIDEBAR_WORKSPACES` "Store" group to "Store Settings" (`nav.storeSettings`). The existing "My Shop" (`/shop`) becomes "Basic Data" and "Branches" (`/branches`) remains. New sub-items are added: Payment Gateways (`/payment-gateways`), Tables (`/tables`), Contact Info (`/contact-info`), Logs (`/logs`), QR Code (`/qr-code`).

**Rationale**: The current sidebar already has the store group with `nav.store` title. Renaming preserves structure while extending it. All items share the same `AccordionMenu` pattern used by `SidebarWorkspacesMenu` component. The `MenuConfig` type already supports the needed title/path/icon structure.

**Alternatives Considered**:
- Creating a separate sidebar section: Rejected — fragments store management across groups.
- Nested sub-menus: Rejected — `AccordionMenu` component doesn't support nested collapsible groups; flat list matches existing patterns.

---

## R-002: QR Code Client-Side Generation Library

**Decision**: Use `qrcode-react` (or `qr-code-styling` for advanced customization with dot shapes, colors, and logo embedding).

**Rationale**: `qr-code-styling` supports all three style presets from the spec:
- Style A (classic squares): default dot type "square"
- Style B (rounded dots + brand colors): dot type "rounded", custom foreground/background
- Style C (logo embedding): `image` option with the shop logo URL

It also supports SVG and PNG export natively. The library is ~15KB gzipped, no backend dependency.

**Alternatives Considered**:
- `qrcode-react`: Simpler but lacks dot shape customization and logo embedding — insufficient for Style B and C.
- `qrcode` (npm): Raw generator, requires manual canvas rendering for style variants.
- Server-side generation: Rejected per constitution (frontend-only architecture).

---

## R-003: Color Picker Component

**Decision**: Use a lightweight color picker component. The existing `components/ui/` library does not include a color picker. Options: `react-colorful` (minimal, 2KB) or inline hex input with a native HTML `<input type="color">`.

**Rationale**: The shop profile page already uses color inputs for `mainColor`/`secondaryColor`. Follow the same pattern used there. If it's a simple hex input, replicate that. If a richer picker exists, reuse it.

**Alternatives Considered**:
- `react-color`: Heavy dependency (~40KB), overkill for two color fields.
- Custom Radix-based popover + native input: More work, no clear benefit.

---

## R-004: Payment Gateway API Contracts

**Decision**: Map the swagger `PaymentMethod` enum (0–9) to labeled constants in the frontend. The `gatewayConfigValues` field is excluded from the owner-facing UI per clarification — Create/Update DTOs will omit this field.

**Rationale**: Swagger shows `CreateShopPaymentGatewayDTO` with `paymentMethod` as an int32 enum 0–9. The frontend must display human-readable labels. The `CreateShopGatewayConfigValueDTO` child objects are admin-only.

**Alternatives Considered**:
- Fetching gateway config schema from backend dynamically: Rejected — adds complexity, no endpoint for it.

---

## R-005: Table Management — No Delete Endpoint

**Decision**: Tables cannot be deleted. The swagger provides no `DELETE /api/Table` endpoint. The UI will support Create, Update, and ChangeStatus only.

**Rationale**: The absence of a delete endpoint suggests tables are managed by status (Available/Occupied/Reserved) rather than CRUD deletion. This aligns with restaurant workflows where table history matters.

**Alternatives Considered**:
- Soft-delete via status: Already available — changing status effectively "deactivates" a table.

---

## R-006: Activity Logs Response Shape

**Decision**: The `GET /api/Logs/GetLogsOverTime` response shape is not fully defined in swagger (200 Success with no schema). The frontend will define a permissive Zod schema with `.passthrough()` and extract: `id`, `timestamp`/`createdAt`, `action` (LogsActionType enum), `entity`, `entityId`, `description`/`message`. Fields not present will be shown as "—".

**Rationale**: Standard audit log patterns include these fields. Using `.passthrough()` ensures forward compatibility if the backend adds fields later.

**Alternatives Considered**:
- Strict schema: Rejected — swagger doesn't define the response, strict parsing would break if fields differ.

---

## R-007: Existing Page Patterns for Consistency

**Decision**: All new pages follow the exact patterns established in `app/[locale]/(dashboard)/branches/page.tsx` and `lib/ordrat-api/branch.ts`:
- Route: `app/[locale]/(dashboard)/<route>/page.tsx`
- API layer: `lib/ordrat-api/<domain>.ts` with raw functions + TanStack hooks
- Schemas: Added to `lib/ordrat-api/schemas.ts`
- Endpoints: Added to `lib/ordrat-api/endpoints.ts` as `ENDPOINTS.<Domain>`
- Forms: React Hook Form + Zod resolver
- Page title: `usePageMeta(t('key'))`
- PWA: `_entityType`/`_entityId` on mutations, toast suppression via `useOnlineStatus()`
- Precache: Register in `hooks/use-page-precache.ts`

**Rationale**: Constitution mandates consistency. Existing patterns are proven and working.
