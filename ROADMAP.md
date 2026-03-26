# Ordrat Dashboard — API Implementation Roadmap

> Auth is already complete. Build phases in order — each phase unlocks the next.

---

## Phase 1 — Shop Foundation
> Everything depends on `shopId`. Start here.

| Feature | Method | Endpoint |
|---|---|---|
| Get shop profile | `GET` | `/api/Shop/GetById/{id}` |
| Update shop profile | `PUT` | `/api/Shop/Update/{id}` |
| Get shop settings | `GET` | `/api/Settings/GetShopSettings/{shopId}` |
| Update shop settings | `PUT` | `/api/Settings/UpdateShopSettings` |

**Deliverable:** A "Store Settings" page where the seller can view and edit their shop info and configuration.

---

## Phase 2 — Product Catalog
> Build Category → Product → Inventory → Banner in that order (each depends on the previous).

### Categories
| Feature | Method | Endpoint |
|---|---|---|
| List categories | `GET` | `/api/Category/GetAll/{shopId}` |
| Get category | `GET` | `/api/Category/GetById/{id}` |
| Create category | `POST` | `/api/Category/Create` |
| Update category | `PUT` | `/api/Category/Update/{id}` |
| Delete category | `DELETE` | `/api/Category/Delete/{id}` |

### Products
| Feature | Method | Endpoint |
|---|---|---|
| List products | `GET` | `/api/Product/GetAll/{shopId}` |
| Get product | `GET` | `/api/Product/GetById/{id}` |
| Create product | `POST` | `/api/Product/Create` |
| Update product | `PUT` | `/api/Product/Update/{id}` |
| Delete product | `DELETE` | `/api/Product/Delete/{id}` |

### Inventory
| Feature | Method | Endpoint |
|---|---|---|
| List inventory | `GET` | `/api/Inventory/GetAll/{shopId}` |
| Get item | `GET` | `/api/Inventory/GetById/{id}` |
| Update stock | `PUT` | `/api/Inventory/Update/{id}` |

### Banners
| Feature | Method | Endpoint |
|---|---|---|
| List banners | `GET` | `/api/Banner/GetAll/{shopId}` |
| Create banner | `POST` | `/api/Banner/Create` |
| Update banner | `PUT` | `/api/Banner/Update/{id}` |
| Delete banner | `DELETE` | `/api/Banner/Delete/{id}` |

**Deliverable:** Full catalog management — categories, products with stock levels, and promotional banners.

---

## Phase 3 — Orders
> The core revenue flow. Build Orders → Coupons → Payments in that order.

### Orders
| Feature | Method | Endpoint |
|---|---|---|
| List orders | `GET` | `/api/Order/GetAll/{shopId}` |
| Get order | `GET` | `/api/Order/GetById/{id}` |
| Update order | `PUT` | `/api/Order/Update/{id}` |
| Cancel order | `DELETE` | `/api/Order/Cancel/{id}` |

### Coupons
| Feature | Method | Endpoint |
|---|---|---|
| List coupons | `GET` | `/api/Coupon/GetAll/{shopId}` |
| Get coupon | `GET` | `/api/Coupon/GetById/{id}` |
| Create coupon | `POST` | `/api/Coupon/Create` |
| Update coupon | `PUT` | `/api/Coupon/Update/{id}` |
| Delete coupon | `DELETE` | `/api/Coupon/Delete/{id}` |
| Validate coupon | `POST` | `/api/Coupon/ValidateCoupon` |

### Payments
| Feature | Method | Endpoint |
|---|---|---|
| List payments | `GET` | `/api/Payment/GetAll/{shopId}` |
| Get payment | `GET` | `/api/Payment/GetById/{id}` |

**Deliverable:** Full order management with status updates, coupon management, and payment history.

---

## Phase 4 — Dashboard & Analytics
> Wire up the home page now that real order/product data exists.

### Statistics
| Feature | Method | Endpoint |
|---|---|---|
| Shop stats | `GET` | `/api/Statistics/GetShopStats/{shopId}` |
| Dashboard data | `GET` | `/api/Statistics/GetDashboard/{shopId}` |

### Analytics
| Feature | Method | Endpoint |
|---|---|---|
| Visit timeline | `GET` | `/api/Analytics/visits/{shopId}` |
| Shop performance | `GET` | `/api/Analytics/shop-stats` |
| Visits by country | `GET` | `/api/Analytics/visits-by-country/{shopId}` |
| Visit count | `GET` | `/api/Analytics/ChekcNumberOfVisites/{shopId}` |
| Abandoned checkouts | `GET` | `/api/Analytics/abandoned-checkouts/phones` |

**Deliverable:** Dashboard home page with KPI cards, charts, and abandoned checkout recovery.

---

## Phase 5 — Customer Engagement
> Builds on top of order/product data.

### Customers
| Feature | Method | Endpoint |
|---|---|---|
| List customers | `GET` | `/api/Customer/GetAll` |
| Get customer | `GET` | `/api/Customer/GetById/{id}` |
| Update customer | `PUT` | `/api/Customer/Update/{id}` |

### Reviews & Feedback
| Feature | Method | Endpoint |
|---|---|---|
| List reviews | `GET` | `/api/Review/GetAll/{shopId}` |
| Delete review | `DELETE` | `/api/Review/Delete/{id}` |
| List feedback | `GET` | `/api/Feedback/GetAll/{shopId}` |

**Deliverable:** Customer directory and reputation management (reviews + feedback).

---

## Phase 6 — Delivery & Logistics
> Only needed if the seller uses delivery. These are independent — can be built in parallel.

### Branches
| Feature | Method | Endpoint |
|---|---|---|
| List branches | `GET` | `/api/Branch/GetByShopId/{shopId}` |
| Get branch | `GET` | `/api/Branch/GetById/{id}` |
| Search branches | `GET` | `/api/Branch/SearchByName` |

### Bosta (3rd-party delivery)
| Feature | Method | Endpoint |
|---|---|---|
| List pickup locations | `GET` | `/api/Bosta/GetAllPickupLocations/{shopId}` |
| Create pickup location | `POST` | `/api/Bosta/CreatePickupLocation` |
| Create delivery | `POST` | `/api/Bosta/CreateBostaDelivery` |
| Create pickup | `POST` | `/api/Bosta/CreateBostaPickup` |
| List cities | `GET` | `/api/Bosta/GetAllCities/{shopId}` |
| List districts | `GET` | `/api/Bosta/GetAllDistricts/{shopId}/{cityId}` |

### Delivery Management
| Feature | Method | Endpoint |
|---|---|---|
| List deliveries | `GET` | `/api/Delivery/GetAll` |
| Get delivery | `GET` | `/api/Delivery/GetById/{id}` |
| Create delivery | `POST` | `/api/Delivery/Create` |
| Update delivery | `PUT` | `/api/Delivery/Update/{id}` |

**Deliverable:** Multi-branch support and delivery scheduling with Bosta integration.

---

## Phase 7 — Growth & Advanced Features
> Nice-to-have. Build last or on demand.

### Notifications
| Feature | Method | Endpoint |
|---|---|---|
| List notifications | `GET` | `/api/Notification/GetAll` |
| Send notification | `POST` | `/api/Notification/Send` |
| Mark as read | `PUT` | `/api/Notification/MarkAsRead/{id}` |

### Affiliate Program
| Feature | Method | Endpoint |
|---|---|---|
| Get affiliate link | `GET` | `/api/Affiliate/link` |
| Affiliate stats | `GET` | `/api/Affiliate/stats` |
| Referrals list | `GET` | `/api/Affiliate/referrals` |
| Affiliate wallet | `GET` | `/api/Affiliate/wallet` |

### AI Menu Parser
| Feature | Method | Endpoint |
|---|---|---|
| Parse from file | `POST` | `/api/AIMenuParser/ParseFromFile` |
| Parse from URL | `POST` | `/api/AIMenuParser/ParseFromUrl` |
| Generate product images | `POST` | `/api/AIMenuParser/GenerateProductImages/generate-product-images` |
| Check job status | `GET` | `/api/AIMenuParser/GetJobStatus/{correlationId}` |
| Jobs by shop | `GET` | `/api/AIMenuParser/GetJobsByShopId/ByShop/{shopId}` |

### QR Codes
| Feature | Method | Endpoint |
|---|---|---|
| Generate QR | `GET` | `/api/QR/Generate/{shopId}` |
| Validate QR | `GET` | `/api/QR/Validate` |

### Employees
| Feature | Method | Endpoint |
|---|---|---|
| List employees | `GET` | `/api/Employee/GetAll` |
| Get employee | `GET` | `/api/Employee/GetById/{id}` |
| Create employee | `POST` | `/api/Employee/Create` |
| Update employee | `PUT` | `/api/Employee/Update/{id}` |

### Subscription
| Feature | Method | Endpoint |
|---|---|---|
| List plans | `GET` | `/api/Subscription/GetPlans` |
| Subscribe | `POST` | `/api/Subscription/Subscribe` |
| Upgrade plan | `PUT` | `/api/Subscription/Upgrade` |

**Deliverable:** Push notifications, affiliate marketing, AI-powered menu import, QR menus, staff management, and billing.

---

## Dependency Map

```
Auth ✓
└── Shop / Settings                    ← Phase 1
    ├── Category
    │   └── Product                    ← Phase 2 (build together)
    │       ├── Inventory
    │       └── Banner
    └── Order                          ← Phase 3
        ├── Coupon
        └── Payment
            └── Delivery / Bosta       ← Phase 6
└── Statistics / Analytics             ← Phase 4 (needs real data)
└── Customer / Review / Feedback       ← Phase 5
└── Notifications / Affiliate / AI /
    QR / Employees / Subscription      ← Phase 7
```

---

## Build Order Within Each Feature

For every feature, follow this sequence:

1. **List page** — table of all items
2. **Detail/view** — clicking a row shows full info
3. **Edit** — update existing item
4. **Create** — add new item
5. **Delete** — with confirmation dialog

This order gives you visible progress fastest and lets you test real data before building forms.

---

## Skip for Seller Dashboard

These APIs belong in a separate **admin panel**, not here:

- `AdminStatistics/*` — platform-wide metrics
- `Achievement/*` — gamification admin
- `Article/*` — blog/CMS
- `Address/*` — end-user address management (customer-facing)
- `Driver/*` — driver management (ops team)
