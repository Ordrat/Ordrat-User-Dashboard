# Quickstart: Store Settings Extensions

**Feature**: 005-store-settings-extensions
**Date**: 2026-03-31

---

## Prerequisites

- Node.js 18+, pnpm installed
- Dev server: `pnpm dev`
- Access to `https://api.ordrat.com` (or staging equivalent)
- Authenticated session with a shop that has at least one branch

## New Dependency

```bash
pnpm add qr-code-styling
```

`qr-code-styling` provides QR generation with dot shape variants, color customization, and logo embedding — required for all three QR style presets (classic/rounded/logo).

## Files to Create

| File | Purpose |
|------|---------|
| `lib/ordrat-api/payment-gateway.ts` | API functions + TanStack hooks for ShopPaymentGateway |
| `lib/ordrat-api/table.ts` | API functions + TanStack hooks for Table |
| `lib/ordrat-api/contact-info.ts` | API functions + TanStack hooks for ShopContactInfo |
| `lib/ordrat-api/logs.ts` | API function + TanStack hook for Logs |
| `app/[locale]/(dashboard)/payment-gateways/page.tsx` | Payment Gateways page |
| `app/[locale]/(dashboard)/tables/page.tsx` | Tables page (branch dropdown) |
| `app/[locale]/(dashboard)/contact-info/page.tsx` | Contact Info page |
| `app/[locale]/(dashboard)/logs/page.tsx` | Activity Logs page |
| `app/[locale]/(dashboard)/qr-code/page.tsx` | QR Code page |

## Files to Modify

| File | Change |
|------|--------|
| `config/layout.config.tsx` | Rename "Store" to "Store Settings", add 5 new sidebar items |
| `lib/ordrat-api/endpoints.ts` | Add `ShopPaymentGateway`, `Table`, `ShopContactInfo`, `Logs` endpoint groups |
| `lib/ordrat-api/schemas.ts` | Add Zod schemas + enums for all new entities |
| `hooks/use-page-precache.ts` | Register 5 new routes in `ROUTE_API_ENDPOINTS` |
| `messages/en.json` | Add translation keys for all new pages |
| `messages/ar.json` | Add Arabic translations for all new pages |

## Verification

```bash
npx tsc --noEmit          # Type check — must pass
pnpm build                # Full build — must pass (Vercel compatibility)
```

Manual verification:
1. Navigate sidebar → "Store Settings" shows all 7 sub-items
2. Payment Gateways: list, add, toggle, edit priority
3. Tables: select branch, list tables, add, change status
4. Contact Info: create, update, delete
5. Logs: view list, filter by date/action/entity, paginate
6. QR Code: see domain, switch styles, change colors, download PNG/SVG
