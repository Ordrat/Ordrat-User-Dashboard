import { z } from 'zod';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const ShopLanguage = {
  Arabic: 0,
  English: 1,
  ArabicandEnglish: 2,
} as const;

export const ShopType = {
  Shop: 0,
  SuperMarket: 1,
} as const;

export const TransactionType = {
  Percentage: 0,
  Flat: 1,
} as const;

export const ShippingPricingMethod = {
  Fixed: 0,
  PricePerCity: 1,
} as const;

// ─── Shop ─────────────────────────────────────────────────────────────────────

export const ShopResponseSchema = z
  .object({
    id: z.string(),
    nameEn: z.string().nullable().optional(),
    nameAr: z.string().nullable().optional(),
    descriptionEn: z.string().nullable().optional(),
    descriptionAr: z.string().nullable().optional(),
    logoUrl: z.string().nullable().optional(),
    backgroundUrl: z.string().nullable().optional(),
    languages: z.number(),                         // API field is "languages", not "shopLanguage"
    shopType: z.number(),
    subdomainName: z.string().nullable().optional(), // API field is "subdomainName", not "subdomain"
    mainColor: z.string().nullable().optional(),
    secondaryColor: z.string().nullable().optional(),
  })
  .passthrough();

export type ShopResponse = z.infer<typeof ShopResponseSchema>;

// ─── ShopCategory ─────────────────────────────────────────────────────────────

export const ShopCategorySchema = z
  .object({
    id: z.string(),
    nameEn: z.string(),
    nameAr: z.string().nullable().optional(),
  })
  .passthrough();

export type ShopCategoryResponse = z.infer<typeof ShopCategorySchema>;

// ─── CityPrice ────────────────────────────────────────────────────────────────

export const CityPriceSchema = z.object({
  id: z.string().optional(),
  city: z.string(),
  price: z.number(),
});

export type CityPrice = z.infer<typeof CityPriceSchema>;

// ─── ShopSettings ─────────────────────────────────────────────────────────────

export const ShopSettingsResponseSchema = z
  .object({
    shopId: z.string(),
    transactionType: z.number(),
    deliveryFeeValue: z.number(),
    shippingPricingMethod: z.number(),
    fixedShippingPrice: z.number().nullable().optional(),
    cityPrices: z.array(CityPriceSchema).optional().default([]),
  })
  .passthrough();

export type ShopSettingsResponse = z.infer<typeof ShopSettingsResponseSchema>;

// ─── WorkingHours ─────────────────────────────────────────────────────────────

export const WorkingHoursSchema = z
  .object({
    id: z.string().optional(),
    shopId: z.string(),
    dayOfWeek: z.number(),
    openTime: z.string().nullable().optional(),
    closeTime: z.string().nullable().optional(),
    isClosed: z.boolean(),
  })
  .passthrough();

export type WorkingHoursResponse = z.infer<typeof WorkingHoursSchema>;

// ─── Branch ───────────────────────────────────────────────────────────────────

export const FullBranchSchema = z
  .object({
    id: z.string(),
    shopId: z.string().optional(),
    name: z.string().nullable().optional(),        // API returns combined "name", not nameEn/nameAr
    nameEn: z.string().nullable().optional(),      // kept for form pre-fill fallback
    nameAr: z.string().nullable().optional(),      // kept for form pre-fill fallback
    phoneNumber: z.string().nullable().optional(), // API field is "phoneNumber", not "phone"
    addressText: z.string().nullable().optional(), // API field is "addressText", not "address"
    centerLatitude: z.number().nullable().optional(),  // API field, not "latitude"
    centerLongitude: z.number().nullable().optional(), // API field, not "longitude"
    isMain: z.boolean().optional(),
    openAt: z.string().nullable().optional(),
    closedAt: z.string().nullable().optional(),
    deliveryTime: z.string().nullable().optional(),
    coverageRadius: z.number().nullable().optional(),
    enableDeliveryOrders: z.boolean().nullable().optional(),
    isFixedDelivery: z.boolean().nullable().optional(),
    deliveryCharge: z.number().nullable().optional(),
  })
  .passthrough();

export type FullBranchResponse = z.infer<typeof FullBranchSchema>;

export const BranchSchema = z
  .object({
    id: z.string(),
    nameEn: z.string().optional(),
    nameAr: z.string().optional(),
    isMain: z.boolean().optional(),
  })
  .passthrough();

export const LoginResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  id: z.string().min(1),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  roles: z.array(z.string()).optional().default([]),
}).passthrough();

// Refresh response has the same shape as login
export const RefreshResponseSchema = LoginResponseSchema;

export type LoginResponseType = z.infer<typeof LoginResponseSchema>;
export type RefreshResponseType = z.infer<typeof RefreshResponseSchema>;
export type BranchType = z.infer<typeof BranchSchema>;

// ─── Currency ─────────────────────────────────────────────────────────────────

export const CurrencySchema = z.object({
  id: z.string(),
  name: z.string(),
  abbreviation: z.string(),
}).passthrough();

export type CurrencyResponse = z.infer<typeof CurrencySchema>;

// ─── Theme ────────────────────────────────────────────────────────────────────

export const ThemeSchema = z.object({
  id: z.string(),
  name: z.string(),
  imageURL: z.string().nullable().optional(),
  price: z.number().optional(),
}).passthrough();

export const ThemeListSchema = z.object({
  entities: z.array(ThemeSchema),
  totalPages: z.number().optional(),
  nextPage: z.number().optional(),
}).passthrough();

export type ThemeResponse = z.infer<typeof ThemeSchema>;
