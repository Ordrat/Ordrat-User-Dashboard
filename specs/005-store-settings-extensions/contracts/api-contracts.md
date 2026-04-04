# API Contracts: Store Settings Extensions

**Feature**: 005-store-settings-extensions
**Source**: Swagger at `https://api.ordrat.com/index.html`
**Date**: 2026-03-31

---

## ShopPaymentGateway

### GET /api/ShopPaymentGateway/GetByShopId/{shopId}

**Purpose**: Fetch all payment gateways for a shop.

| Param | In | Type | Required |
|-------|----|------|----------|
| shopId | path | UUID | Yes |
| Accept-Language | header | string | No |

**Response 200**: `PaymentGatewayResponse[]`

---

### POST /api/ShopPaymentGateway/Create

**Purpose**: Add a new payment gateway to the shop.

**Request Body** (`CreateShopPaymentGatewayDTO`):
```json
{
  "isEnabled": true,
  "priority": 1,
  "paymentMethod": 0,
  "shopId": "uuid",
  "paymentGatewayId": "uuid",
  "gatewayNameAr": "string | null",
  "gatewayNameEn": "string | null",
  "gatewayDescriptionAr": "string | null",
  "gatewayDescriptionEn": "string | null"
}
```

*Note: `gatewayConfigValues` omitted from frontend — admin-only.*

**Responses**: 204 No Content | 404 Not Found | 409 Conflict (duplicate method)

---

### PUT /api/ShopPaymentGateway/Update/{id}

**Purpose**: Update an existing payment gateway.

| Param | In | Type | Required |
|-------|----|------|----------|
| id | path | UUID | Yes |

**Request Body** (`UpdateShopPaymentGatewayDTO`):
```json
{
  "isEnabled": true,
  "priority": 1,
  "paymentMethod": 0,
  "gatewayNameAr": "string | null",
  "gatewayNameEn": "string | null",
  "gatewayDescriptionAr": "string | null",
  "gatewayDescriptionEn": "string | null"
}
```

**Responses**: 204 No Content | 404 Not Found

---

## Table

### GET /api/Table/GetAllShopTables/{branchId}

**Purpose**: Fetch all tables for a branch.

| Param | In | Type | Required |
|-------|----|------|----------|
| branchId | path | UUID | Yes |

**Response 200**: `TableResponse[]`

---

### GET /api/Table/GetTableById/{id}

**Purpose**: Fetch a single table by ID.

| Param | In | Type | Required |
|-------|----|------|----------|
| id | path | UUID | Yes |

**Response 200**: `TableResponse`

---

### POST /api/Table/CreateTable/{branchId}

**Purpose**: Create a table for a branch.

| Param | In | Type | Required |
|-------|----|------|----------|
| branchId | path | UUID | Yes |

**Request Body** (`CreateTableDto`):
```json
{
  "tableNumber": 1,
  "tableStatus": 0,
  "capacity": 4,
  "location": 0,
  "branchId": "uuid",
  "descriptionEn": "string | null",
  "descriptionAr": "string | null"
}
```

**Response 200**: Success

---

### PUT /api/Table/UpdateTable/{id}

**Purpose**: Update a table's details.

| Param | In | Type | Required |
|-------|----|------|----------|
| id | path | UUID | Yes |

**Request Body** (`UpdateTableDto`):
```json
{
  "tableNumber": 1,
  "descriptionEn": "string | null",
  "descriptionAr": "string | null",
  "capacity": 4,
  "location": 0
}
```

**Response 200**: Success

---

### PUT /api/Table/ChangeTableStatus/ChangeTableStatus/{id}

**Purpose**: Change a table's operational status independently.

| Param | In | Type | Required |
|-------|----|------|----------|
| id | path | UUID | Yes |

**Request Body**: `TableStatus` (int32 enum: 0, 1, 2)

**Response 200**: Success

---

## ShopContactInfo

### GET /api/ShopContactInfo/GetByShopId/{shopId}

**Purpose**: Fetch contact info for a shop.

| Param | In | Type | Required |
|-------|----|------|----------|
| shopId | path | UUID | Yes |

**Response 200**: `ContactInfoResponse`

---

### POST /api/ShopContactInfo/Create

**Purpose**: Create contact info record.

**Request Body** (`CreateShopContactInfoDto`):
```json
{
  "whatsAppNumber": "string | null",
  "facebookLink": "string | null",
  "xLink": "string | null",
  "instagramLink": "string | null",
  "shopId": "uuid | null"
}
```

**Responses**: 200 Success | 404 Not Found | 400 Bad Request

---

### PUT /api/ShopContactInfo/Update/{id}

**Purpose**: Update contact info.

| Param | In | Type | Required |
|-------|----|------|----------|
| id | path | UUID | Yes |

**Request Body** (`UpdateShopContactInfoDto`):
```json
{
  "whatsAppNumber": "string | null",
  "facebookLink": "string | null",
  "xLink": "string | null",
  "instagramLink": "string | null"
}
```

**Responses**: 200 Success | 404 Not Found

---

### DELETE /api/ShopContactInfo/Delete/{id}

**Purpose**: Delete contact info for the shop.

| Param | In | Type | Required |
|-------|----|------|----------|
| id | path | UUID | Yes |

**Responses**: 200 Success | 404 Not Found

---

## Logs

### GET /api/Logs/GetLogsOverTime

**Purpose**: Fetch paginated activity logs (auto-scoped to shop by backend).

| Param | In | Type | Required |
|-------|----|------|----------|
| PageNumber | query | int32 | No |
| PageSize | query | int32 | No |
| StartTime | query | date-time | No |
| EndTime | query | date-time | No |
| Action | query | LogsActionType (0–46) | No |
| Entity | query | string | No |
| EntityId | query | UUID | No |

**Response 200**: Paginated `LogEntryResponse[]`

---

## Query Key Conventions

| Entity | Key Pattern |
|--------|-------------|
| PaymentGateway | `['payment-gateways', shopId]` |
| Table | `['tables', branchId]` |
| ContactInfo | `['contact-info', shopId]` |
| Logs | `['logs', { page, pageSize, startTime, endTime, action, entity, entityId }]` |
| Shop (existing) | `['shop', shopId]` |
| Branches (existing) | `['branches', shopId]` |
