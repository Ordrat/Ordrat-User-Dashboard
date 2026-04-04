# Data Model: Store Settings Extensions

**Feature**: 005-store-settings-extensions
**Date**: 2026-03-31

---

## Entities

### PaymentGateway

Represents a payment method configuration for a shop.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Read-only | Backend-generated |
| shopId | UUID | Create | Current shop |
| paymentGatewayId | UUID | Create | Provider gateway reference |
| isEnabled | boolean | Yes | Toggleable by owner |
| priority | int32 | Yes | Display/processing order |
| paymentMethod | PaymentMethod (enum 0–9) | Yes | See enum below |
| gatewayNameAr | string | null | Optional | Arabic display name |
| gatewayNameEn | string | null | Optional | English display name |
| gatewayDescriptionAr | string | null | Optional | Arabic description |
| gatewayDescriptionEn | string | null | Optional | English description |

**Note**: `gatewayConfigValues` exists in the API but is excluded from the owner-facing UI per clarification.

**Enum: PaymentMethod**

| Value | Label (en) | Label (ar) |
|-------|-----------|-----------|
| 0 | Cash on Delivery | الدفع عند الاستلام |
| 1 | Credit Card | بطاقة ائتمان |
| 2 | Debit Card | بطاقة خصم |
| 3 | Bank Transfer | تحويل بنكي |
| 4 | Digital Wallet | محفظة رقمية |
| 5 | Apple Pay | Apple Pay |
| 6 | Google Pay | Google Pay |
| 7 | STC Pay | STC Pay |
| 8 | Mada | مدى |
| 9 | Other | أخرى |

*Note: Exact enum labels should be confirmed against backend/business requirements. These are reasonable defaults based on the Saudi market context.*

---

### Table

Represents a physical table in a restaurant branch.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Read-only | Backend-generated |
| branchId | UUID | Create | Owning branch |
| tableNumber | int32 | Yes | Unique per branch |
| capacity | int32 | Yes | Seating capacity |
| tableStatus | TableStatus (enum) | Yes | Current state |
| location | TableLocation (enum) | Yes | Physical area |
| descriptionEn | string | null | Optional | English description |
| descriptionAr | string | null | Optional | Arabic description |

**Enum: TableStatus**

| Value | Label (en) | Label (ar) |
|-------|-----------|-----------|
| 0 | Available | متاح |
| 1 | Occupied | مشغول |
| 2 | Reserved | محجوز |

**Enum: TableLocation**

| Value | Label (en) | Label (ar) |
|-------|-----------|-----------|
| 0 | Indoor | داخلي |
| 1 | Outdoor | خارجي |
| 2 | Rooftop | سطح |

**State Transitions** (TableStatus):
- Available → Occupied (seat guests)
- Available → Reserved (reservation made)
- Occupied → Available (guests leave)
- Reserved → Occupied (reserved guests arrive)
- Reserved → Available (reservation cancelled)
- *No deletion — tables are permanent once created*

---

### ContactInfo

Represents a shop's social and contact presence.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Read-only | Backend-generated |
| shopId | UUID | Create | Owning shop |
| whatsAppNumber | string | null | Optional | Phone number format |
| facebookLink | string | null | Optional | Full URL |
| xLink | string | null | Optional | Full URL (X/Twitter) |
| instagramLink | string | null | Optional | Full URL |

**Lifecycle**: Single record per shop. Created if absent, updated if exists, deletable.

---

### LogEntry

Represents an audit trail entry returned by the Logs API.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Read-only | Entry identifier |
| timestamp / createdAt | datetime | Read-only | When the action occurred |
| action | LogsActionType (enum 0–46) | Read-only | Action category |
| entity | string | Read-only | Affected entity type name |
| entityId | UUID | null | Read-only | Affected entity ID |
| description / message | string | null | Read-only | Human-readable summary |

**Note**: Exact field names will be confirmed from actual API response; schema uses `.passthrough()` for forward compatibility.

**Enum: LogsActionType** (partial — full 0–46 range mapped in translation files):

| Value | Label (en) |
|-------|-----------|
| 0 | Created |
| 1 | Updated |
| 2 | Deleted |
| 3–46 | Domain-specific actions (mapped in i18n) |

---

### QRCode (Client-Side Only)

Not a persisted entity — generated in the browser from shop data.

| Property | Type | Notes |
|----------|------|-------|
| url | string | `https://<subdomain>.ordrat.com` |
| style | 'classic' \| 'rounded' \| 'logo' | Selected preset |
| fgColor | string (hex) | Foreground color (Style B) |
| bgColor | string (hex) | Background color (Style B) |
| logoUrl | string \| null | Shop logo URL (Style C) |

---

## Relationships

```
Shop (1) ──< PaymentGateway (many)
Shop (1) ──< Branch (many) ──< Table (many)
Shop (1) ──── ContactInfo (0..1)
Shop (1) ──< LogEntry (many)  [read-only, backend-managed]
Shop (1) ──── QRCode (derived, client-side)
```
