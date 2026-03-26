# API Contracts: Ordrat .NET Backend

**Source**: `https://api.ordrat.com/swagger/v1/swagger.json`
**Feature**: `002-shop-branch-management`

All endpoints require `Authorization: Bearer <accessToken>` header.
All endpoints accept `Accept-Language` header for localized responses.

---

## Shop Endpoints (Seller-Only)

### GET /api/Shop/GetByUserId
Returns the shop belonging to the authenticated user.

**Response**: `ShopResponse` object

---

### PUT /api/Shop/Update/{id}
Update shop profile. Multipart form data.

**Path**: `id` (UUID)
**Body** (multipart/form-data):
- `NameEn` (string) — English name
- `NameAr` (string) — Arabic name
- `DescriptionEn` (string)
- `DescriptionAr` (string)
- `Phone` (string)
- `Email` (string)
- `Address` (string)
- `Latitude` (number)
- `Longitude` (number)
- `DeliveryTime` (number)
- `MinimumOrder` (number)
- `CategoryId` (UUID)
- `ShopLanguage` (number enum: 0=Arabic, 1=English, 2=ArabicandEnglish)
- `ShopType` (number enum: 0=Shop, 1=SuperMarket)

---

### POST /api/Shop/UploadLogo/{shopId}
Upload/replace shop logo.

**Path**: `shopId` (UUID)
**Body** (multipart/form-data): `Logo` (file)
**Response**: Updated shop or logo URL

---

### POST /api/Shop/UploadCover/{shopId}
Upload/replace shop cover image.

**Path**: `shopId` (UUID)
**Body** (multipart/form-data): `CoverImage` (file)
**Response**: Updated shop or cover URL

---

## Branch Endpoints

### GET /api/Branch/GetByShopId/{shopId}
List all branches for a shop.

**Path**: `shopId` (UUID)
**Response**: Array of `BranchResponse`

---

### GET /api/Branch/GetById/{id}
Get single branch.

**Path**: `id` (UUID)
**Response**: `BranchResponse`

---

### GET /api/Branch/SearchByName
Search branches by name.

**Query**: `searchParameter` (string)
**Response**: Array of `BranchResponse`

---

### POST /api/Branch/Create
Create a new branch.

**Body** (JSON):
```json
{
  "nameEn": "string",
  "nameAr": "string",
  "shopId": "uuid",
  "phone": "string",
  "email": "string",
  "address": "string",
  "latitude": 0,
  "longitude": 0
}
```
**Response**: Created `BranchResponse`

---

### PUT /api/Branch/Update/{id}
Update existing branch.

**Path**: `id` (UUID)
**Body** (JSON): Same fields as Create
**Response**: Updated `BranchResponse`

---

### DELETE /api/Branch/Delete/{id}
Delete a branch.

**Path**: `id` (UUID)
**Response**: 200 OK

---

## Settings Endpoints

### GET /api/Settings/GetByShopId/{shopId}
Get shop settings.

**Path**: `shopId` (UUID)
**Response**: `ShopSettingsResponse` object

---

### PUT /api/Settings/Update/{shopId}
Update shop settings.

**Path**: `shopId` (UUID)
**Body** (JSON): Settings fields including `transactionType`, `deliveryFeeValue`, `shippingPricingMethod`, `fixedShippingPrice`, `cityPrices[]`
**Response**: Updated `ShopSettingsResponse`

---

## Working Hours Endpoints

### GET /api/WorkingHours/GetByShopId/{shopId}
Get all working hour entries for a shop.

**Path**: `shopId` (UUID)
**Response**: Array of `WorkingHoursResponse` (one per day)

---

### POST /api/WorkingHours/Create
Create a working hours entry.

**Body** (JSON):
```json
{
  "shopId": "uuid",
  "dayOfWeek": 0,
  "openTime": "09:00",
  "closeTime": "22:00",
  "isClosed": false
}
```
**Response**: Created `WorkingHoursResponse`

---

### PUT /api/WorkingHours/Update/{id}
Update existing working hours entry.

**Path**: `id` (UUID)
**Body** (JSON): Same fields as Create (minus shopId)
**Response**: Updated `WorkingHoursResponse`

---

## ShopCategory Endpoints

### GET /api/ShopCategory/GetAll
List all shop categories (for the category dropdown).

**Response**: Array of `ShopCategoryResponse`
