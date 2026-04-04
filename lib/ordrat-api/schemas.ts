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

// ─── PaymentGateway ───────────────────────────────────────────────────────────

export const PaymentMethod = {
  CashOnDelivery: 0,
  CreditCard: 1,
  DebitCard: 2,
  BankTransfer: 3,
  DigitalWallet: 4,
  ApplePay: 5,
  GooglePay: 6,
  StcPay: 7,
  Mada: 8,
  Other: 9,
} as const;

export type PaymentMethodType = typeof PaymentMethod[keyof typeof PaymentMethod];

export const PaymentGatewaySchema = z
  .object({
    id: z.string(),
    shopId: z.string().optional(),
    paymentGatewayId: z.string().nullable().optional(),
    isEnabled: z.boolean(),
    priority: z.number(),
    paymentMethod: z.number(),
    gatewayNameAr: z.string().nullable().optional(),
    gatewayNameEn: z.string().nullable().optional(),
    gatewayDescriptionAr: z.string().nullable().optional(),
    gatewayDescriptionEn: z.string().nullable().optional(),
  })
  .passthrough();

export type PaymentGatewayResponse = z.infer<typeof PaymentGatewaySchema>;

// ─── Table ────────────────────────────────────────────────────────────────────

export const TableStatus = {
  Available: 0,
  Occupied: 1,
  Reserved: 2,
} as const;

export type TableStatusType = typeof TableStatus[keyof typeof TableStatus];

export const TableLocation = {
  Indoor: 0,
  Outdoor: 1,
  Rooftop: 2,
} as const;

export type TableLocationType = typeof TableLocation[keyof typeof TableLocation];

export const TableSchema = z
  .object({
    id: z.string(),
    branchId: z.string().optional(),
    tableNumber: z.number(),
    capacity: z.number(),
    tableStatus: z.number(),
    location: z.number(),
    descriptionEn: z.string().nullable().optional(),
    descriptionAr: z.string().nullable().optional(),
  })
  .passthrough();

export type TableResponse = z.infer<typeof TableSchema>;

// ─── ContactInfo ──────────────────────────────────────────────────────────────

export const ContactInfoSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(String),
    shopId: z.union([z.string(), z.number()]).transform(String).optional(),
    whatsAppNumber: z.string().nullable().optional(),
    facebookLink: z.string().nullable().optional(),
    xLink: z.string().nullable().optional(),
    instagramLink: z.string().nullable().optional(),
  })
  .passthrough();

export type ContactInfoResponse = z.infer<typeof ContactInfoSchema>;

// ─── SourceChannel ────────────────────────────────────────────────────────────

export const SourceChannel = {
  0: 'Dashboard',
  1: 'App',
  2: 'POS',
} as const;

// ─── LogEntry ─────────────────────────────────────────────────────────────────

export const LogsActionType = {
  0: 'Created',
  1: 'Updated',
  2: 'Deleted',
  3: 'Activated',
  4: 'Deactivated',
  5: 'StatusChanged',
  6: 'Login',
  7: 'Logout',
  8: 'PasswordChanged',
  9: 'OrderPlaced',
  10: 'OrderCancelled',
  11: 'OrderCompleted',
  12: 'OrderRefunded',
  13: 'PaymentReceived',
  14: 'PaymentFailed',
  15: 'ShippingUpdated',
  16: 'ProductAdded',
  17: 'ProductRemoved',
  18: 'ProductUpdated',
  19: 'CategoryAdded',
  20: 'CategoryRemoved',
  21: 'BranchAdded',
  22: 'BranchRemoved',
  23: 'BranchUpdated',
  24: 'SettingsUpdated',
  25: 'CouponCreated',
  26: 'CouponDeleted',
  27: 'TableAdded',
  28: 'TableUpdated',
  29: 'TableStatusChanged',
  30: 'ContactInfoUpdated',
  31: 'WorkingHoursUpdated',
  32: 'ThemeChanged',
  33: 'SubdomainChanged',
  34: 'LogoUpdated',
  35: 'CoverUpdated',
  36: 'StaffAdded',
  37: 'StaffRemoved',
  38: 'RoleChanged',
  39: 'ProfileUpdated',
  40: 'InvoiceGenerated',
  41: 'ReservationCreated',
  42: 'ReservationCancelled',
  43: 'ReservationConfirmed',
  44: 'MenuUpdated',
  45: 'IntegrationEnabled',
  46: 'IntegrationDisabled',
} as const;

export const LogEntrySchema = z
  .object({
    id: z.string().nullable().optional(),
    createdAt: z.string().nullable().optional(),
    timestamp: z.string().nullable().optional(),
    action: z.number().nullable().optional(),
    entity: z.string().nullable().optional(),
    entityId: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    message: z.string().nullable().optional(),
    shopName: z.string().nullable().optional(),
    branchName: z.string().nullable().optional(),
    source: z.union([z.number(), z.string()]).nullable().optional(),
    userName: z.string().nullable().optional(),
  })
  .passthrough();

export type LogEntryResponse = z.infer<typeof LogEntrySchema>;
