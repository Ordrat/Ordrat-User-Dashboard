# Data Model: Shop & Branch Management

**Feature**: `002-shop-branch-management` | **Date**: 2026-03-25

## Enums

```typescript
// Backend enum values — used in Zod schemas and form selects
enum ShopLanguage {
  Arabic = 0,
  English = 1,
  ArabicandEnglish = 2,
}

enum ShopType {
  Shop = 0,
  SuperMarket = 1,
}

enum TransactionType {
  Percentage = 0,
  Flat = 1,
}

enum ShippingPricingMethod {
  Fixed = 0,
  PricePerCity = 1,
}
```

**Note**: .NET enums are typically serialized as integers. Zod schemas should use `z.nativeEnum()` or `z.number()` with transforms.

## Entities

### Shop

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID (string) | yes | Read-only |
| `nameEn` | string | conditional | Required when ShopLanguage includes English |
| `nameAr` | string | conditional | Required when ShopLanguage includes Arabic |
| `descriptionEn` | string | no | |
| `descriptionAr` | string | no | |
| `logo` | string (URL) | no | Read from GET; uploaded separately via POST |
| `coverImage` | string (URL) | no | Read from GET; uploaded separately via POST |
| `phone` | string | yes | |
| `email` | string (email) | yes | |
| `address` | string | no | |
| `latitude` | number | no | |
| `longitude` | number | no | |
| `deliveryTime` | number | no | Minutes |
| `minimumOrder` | number | no | Monetary amount |
| `categoryId` | UUID (string) | no | FK to ShopCategory |
| `shopLanguage` | number (enum) | yes | 0=Arabic, 1=English, 2=ArabicandEnglish |
| `shopType` | number (enum) | yes | 0=Shop, 1=SuperMarket |
| `subdomain` | string | no | Read-only |

### ShopSettings

| Field | Type | Required | Notes |
|---|---|---|---|
| `shopId` | UUID (string) | yes | |
| `transactionType` | number (enum) | yes | 0=Percentage, 1=Flat |
| `deliveryFeeValue` | number | yes | % or flat amount based on transactionType |
| `shippingPricingMethod` | number (enum) | yes | 0=Fixed, 1=PricePerCity |
| `fixedShippingPrice` | number | conditional | Required when shippingPricingMethod=Fixed |
| `cityPrices` | CityPrice[] | conditional | Required when shippingPricingMethod=PricePerCity |

*Additional fields may exist — Zod schema uses `.passthrough()` to accommodate.*

### CityPrice

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID (string) | no | Present on existing entries |
| `city` | string | yes | City name |
| `price` | number | yes | Delivery price for this city |

### WorkingHours

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID (string) | no | Present on existing entries |
| `shopId` | UUID (string) | yes | |
| `dayOfWeek` | number | yes | 0=Sunday, 1=Monday, ..., 6=Saturday |
| `openTime` | string | conditional | HH:mm format; required when isClosed=false |
| `closeTime` | string | conditional | HH:mm format; required when isClosed=false |
| `isClosed` | boolean | yes | |

### Branch

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID (string) | yes | Read-only |
| `shopId` | UUID (string) | yes | Set from session |
| `nameEn` | string | conditional | Based on ShopLanguage |
| `nameAr` | string | conditional | Based on ShopLanguage |
| `phone` | string | yes | |
| `email` | string | no | |
| `address` | string | no | |
| `latitude` | number | no | |
| `longitude` | number | no | |
| `isMain` | boolean | no | Read-only flag |

### ShopCategory

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID (string) | yes | |
| `nameEn` | string | yes | |
| `nameAr` | string | no | |

## Zod Schema Design

All schemas go in `lib/ordrat-api/schemas.ts`. Pattern:

```typescript
// Response schemas (read from API)
export const ShopResponseSchema = z.object({
  id: z.string(),
  nameEn: z.string().nullable().optional(),
  nameAr: z.string().nullable().optional(),
  // ... all fields
  shopLanguage: z.number(),
  shopType: z.number(),
}).passthrough();

export type ShopResponse = z.infer<typeof ShopResponseSchema>;

// Form schemas (for RHF validation — separate from API response)
export const ShopProfileFormSchema = z.object({
  nameEn: z.string().optional(),
  nameAr: z.string().optional(),
  // ... editable fields only
}).refine(/* conditional validation based on shopLanguage */);
```

## File Change Map

| File | Action | Description |
|---|---|---|
| `lib/ordrat-api/schemas.ts` | MODIFY | Add Shop, ShopSettings, WorkingHours, Branch, ShopCategory, CityPrice schemas |
| `lib/ordrat-api/shop.ts` | CREATE | `getShopByUserId()`, `updateShop()`, `uploadLogo()`, `uploadCover()` |
| `lib/ordrat-api/branch.ts` | CREATE | `getBranchesByShopId()`, `createBranch()`, `updateBranch()`, `deleteBranch()`, `searchBranches()` |
| `lib/ordrat-api/settings.ts` | CREATE | `getSettingsByShopId()`, `updateSettings()`, `getWorkingHours()`, `createWorkingHours()`, `updateWorkingHours()` |
| `lib/ordrat-api/shop-category.ts` | CREATE | `getAllShopCategories()` |
| `app/(dashboard)/shop/page.tsx` | CREATE | Shop profile page |
| `app/(dashboard)/shop/settings/page.tsx` | CREATE | Shop settings + working hours page |
| `app/(dashboard)/branches/page.tsx` | CREATE | Branch list + CRUD page |
| `config/layout.config.tsx` | MODIFY | Add sidebar items for My Shop and Branches |
| `config/roles.ts` | MODIFY | Add route role mappings for /shop and /branches |
| `proxy.ts` | NO CHANGE | Existing logic handles new ROUTE_ROLES entries automatically |
