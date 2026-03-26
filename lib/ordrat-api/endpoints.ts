/**
 * Ordrat .NET API — Endpoint Catalog
 *
 * Source of truth: https://api.ordrat.com/index.html
 * Last synced: 2026-03-25
 *
 * Usage:
 *   import { ENDPOINTS } from '@/lib/ordrat-api/endpoints';
 *   ordratFetch(ENDPOINTS.Shop.GetById('/some-uuid'))
 *   ordratFetch(ENDPOINTS.Shop.Update.path, { method: ENDPOINTS.Shop.Update.method, body })
 *
 * Rules:
 *   - Never hardcode an API path outside of this file.
 *   - When the Swagger spec changes, update this file + re-verify the consuming code.
 *   - Fields marked [Update] are accepted by that endpoint's body.
 *   - Fields marked [Response] are returned but cannot be set via that endpoint.
 */

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const Auth = {
  /** POST — body: { email, password } → { accessToken, refreshToken, shopId, ... } */
  Login: { method: 'POST', path: '/api/Auth/Login' },

  /** POST — refreshToken sent as HTTP **header** (not body) → same shape as Login */
  RefreshAccessToken: { method: 'POST', path: '/api/Auth/RefreshAccessToken' },

  /** POST — body: { email } */
  ForgetPassword: { method: 'POST', path: '/api/Auth/ForgetPassword' },

  /** POST — body: { email, verificationCode } → { resetToken } */
  VerifyForgetCode: { method: 'POST', path: '/api/Auth/VerifyForgetCode' },

  /** POST — body: { email } */
  ResendVerificationCode: { method: 'POST', path: '/api/Auth/ResendVerificationCode' },

  /** PATCH — body: { email, newPassword, resetToken } */
  ResetPassword: { method: 'PATCH', path: '/api/Auth/ResetPassword' },
} as const;

// ─── Shop ─────────────────────────────────────────────────────────────────────

export const Shop = {
  /**
   * GET — returns full shop profile.
   * Key response fields: id, nameEn, nameAr, descriptionEn, descriptionAr,
   *   logoUrl, backgroundUrl, languages (shopLanguage enum), shopType,
   *   subdomainName, mainColor, secondaryColor, sellerId, ...
   */
  GetById: (shopId: string) => `/api/Shop/GetById/${shopId}` as const,

  /**
   * PUT — multipart/form-data. shopId comes from the JWT (no path param).
   * Accepted fields: NameAr, NameEn, DescriptionAr, DescriptionEn,
   *   TitleAr, TitleEn, MetaDescriptionAr, MetaDescriptionEn,
   *   Logo (binary), Background (binary), Languages (ShopLanguage enum),
   *   SubdomainName, MainColor, SecondaryColor, CurrencyId, ThemeId,
   *   ShippingPricingMethod, ShippingCost, VAT, VATType, Service, ServiceType,
   *   ShowAllCouponsInSideBar, ApplyFreeShppingOnTarget, FreeShppingTarget,
   *   ApplyDailyAndShift, AutomaticProductionOrder, ApplyOrderSchedule,
   *   ApplyServiceOnDineInOnly, ApplyVatOnDineInOnly,
   *   EnableIntegrationWithShippingCompanies, sourceChannel
   *
   * NOT accepted (read-only or set at creation): shopType, phone, email,
   *   address, latitude, longitude, deliveryTime, minimumOrder, categoryId
   */
  Update: { method: 'PUT', path: '/api/Shop/Update' },

  /**
   * GET — query param: subDomain (full domain, e.g. "galastore.ordrat.com")
   * Response body: plain text — "not exist" = available, anything else = taken/invalid
   */
  CheckSubDomain: { method: 'GET', path: '/api/Shop/CheckSubDomain' },

  /**
   * ⚠️ /api/Shop/UploadLogo and /api/Shop/UploadCover do NOT exist.
   * Upload Logo and Background (cover) as binary fields inside Shop.Update instead.
   */

  /** POST — path params: sellerId, currencyId.
   *  Fields: SubdomainName, NameAr, NameEn, DescriptionAr, DescriptionEn,
   *   Languages, ShopType, Logo, Background, MainColor, SecondaryColor,
   *   ThemeId, OpenAt, ClosedAt, DeliveryTime, AddressText, PhoneNumber,
   *   CoverageRadius, CenterLatitude, CenterLongitude, CurrencyId, SellerId
   */
  Create: (sellerId: string, currencyId: string) =>
    `/api/Shop/Create/${sellerId}/${currencyId}` as const,
} as const;

// ─── Branch ───────────────────────────────────────────────────────────────────

export const Branch = {
  /** GET — returns array of branches for the shop */
  GetByShopId: (shopId: string) => `/api/Branch/GetByShopId/${shopId}` as const,

  /** GET — returns single branch */
  GetById: (id: string) => `/api/Branch/GetById/${id}` as const,

  /** GET — query param: searchParamter (sic — backend typo) */
  SearchByName: { method: 'GET', path: '/api/Branch/SearchByName' },

  /**
   * POST — JSON body.
   * Fields: nameAr, nameEn, shopId, phoneNumber, addressText, zoneName,
   *   centerLatitude, centerLongitude, coverageRadius, openAt, closedAt,
   *   deliveryTime, enableDeliveryOrders, isFixedDelivery, deliveryCharge,
   *   deliveryPerKilo, minimumDeliveryCharge
   */
  Create: { method: 'POST', path: '/api/Branch/Create' },

  /**
   * PUT — JSON body (same fields as Create minus shopId).
   * Extra fields: enableReservation, payDownPayment, downPayment,
   *   defaultReservationDuration
   */
  Update: (id: string) => ({ method: 'PUT', path: `/api/Branch/Update/${id}` } as const),

  /** DELETE */
  Delete: (id: string) => `/api/Branch/Delete/${id}` as const,

  /** PATCH */
  Activate: (id: string) => `/api/Branch/Activate/${id}` as const,

  /** PATCH */
  DeActivate: (id: string) => `/api/Branch/DeActivate/${id}` as const,
} as const;

// ─── Category (product categories within a shop) ──────────────────────────────

export const Category = {
  /** GET — returns product categories for a shop */
  GetAll: (shopId: string) => `/api/Category/GetAll/${shopId}` as const,

  /** GET */
  GetById: (id: string) => `/api/Category/GetCategoryById/${id}` as const,

  /**
   * POST — multipart/form-data.
   * Fields: ShopId, NameAr, NameEn, TitleAr, TitleEn, MetaDescriptionAr,
   *   MetaDescriptionEn, Banner (binary), Priority, NumberOfColumns,
   *   ShowAllProducts, PrintersId
   */
  Create: { method: 'POST', path: '/api/Category/Create' },

  /**
   * PUT — multipart/form-data (same as Create minus ShopId).
   */
  Update: (id: string) => ({ method: 'PUT', path: `/api/Category/Update/${id}` } as const),

  /** DELETE */
  Delete: (id: string) => `/api/Category/Delete/${id}` as const,

  /** PATCH */
  ChangeActivationStatus: (id: string) =>
    `/api/Category/ChangeActivationStatus/${id}` as const,
} as const;

// ─── Currency ─────────────────────────────────────────────────────────────────

export const Currency = {
  /** GET — returns array of { id, name, abbreviation } */
  GetAll: { method: 'GET', path: '/api/Currency/GetAllCurrencies' },
} as const;

// ─── Theme ────────────────────────────────────────────────────────────────────

export const Theme = {
  /** GET — returns { entities: [...], totalPages, nextPage } */
  GetAll: { method: 'GET', path: '/api/Theme/GetAll' },
} as const;

// ─── Aggregated export ────────────────────────────────────────────────────────

export const ENDPOINTS = { Auth, Shop, Branch, Category, Currency, Theme } as const;
