# Feature Specification: Shop & Branch Management

**Feature Branch**: `002-shop-branch-management`
**Created**: 2026-03-25
**Status**: Draft
**Input**: Shop and branch management pages for seller dashboard — view/edit shop profile, upload logo and cover, manage branches (CRUD), sidebar navigation, using existing UI components.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — View & Edit Shop Profile (Priority: P1)

A seller lands on the "My Shop" page and sees their current shop details (name in Arabic and English, logo, cover image, description, phone, email, address, delivery time, minimum order). They can edit any field and save changes. They can also upload a new logo or cover image independently.

**Why this priority**: This is the foundation of the seller's presence — every other feature references the shop. It must exist before anything else is useful.

**Independent Test**: Navigate to `/dashboard/shop`, verify current data populates from the API, edit a field, save, and confirm a success toast appears.

**Acceptance Scenarios**:

1. **Given** a logged-in seller, **When** they visit the shop profile page, **Then** all current shop details are displayed in a pre-filled form.
2. **Given** a seller on the shop profile page, **When** they update the shop name and click Save, **Then** the changes persist and a success toast is shown.
3. **Given** a seller uploading a new logo, **When** they select an image file, **Then** the logo uploads and the preview updates without a page reload.
4. **Given** a seller uploading a cover image, **When** they select an image file, **Then** the cover uploads and the preview updates without a page reload.
5. **Given** a seller submitting invalid data (e.g. empty required field), **When** they click Save, **Then** inline validation errors appear and no API call is made.

---

### User Story 2 — View & Edit Shop Settings (Priority: P2)

A seller visits the "Shop Settings" page and sees configuration options for their shop. They can update settings and save.

**Why this priority**: Settings control how the shop operates. Must be accessible but is secondary to the profile.

**Independent Test**: Navigate to `/dashboard/shop/settings`, verify settings data pre-fills the form, update a value, save, and confirm a success toast.

**Acceptance Scenarios**:

1. **Given** a logged-in seller, **When** they open Shop Settings, **Then** current settings are pre-filled including `TransactionType` and `ShippingPricingMethod`.
2. **Given** a seller changing a setting value, **When** they save, **Then** the setting persists and a success toast is shown.
3. **Given** a seller submitting invalid settings, **When** they click Save, **Then** validation errors appear without calling the API.
4. **Given** a seller selecting `ShippingPricingMethod = PricePerCity`, **When** the form updates, **Then** a city-price table appears where they can add, edit, and remove rows.
5. **Given** a seller selecting `TransactionType = Percentage`, **When** they enter the fee, **Then** the input is labeled as a percentage. When they switch to `Flat`, the input reflects a fixed amount label.

---

### User Story 3 — Manage Working Hours (Priority: P2)

A seller configures their shop's weekly schedule — for each day of the week they can toggle open/closed and set opening/closing times.

**Why this priority**: Customers depend on this to know when the shop is open. Closely coupled to shop settings.

**Independent Test**: Navigate to `/dashboard/shop/settings`, find the working hours section, set a day's hours, save, and verify the schedule is reflected on page reload.

**Acceptance Scenarios**:

1. **Given** a seller on the settings page, **When** they view working hours, **Then** all 7 days show current open/close times.
2. **Given** a seller toggling a day as closed, **When** they save, **Then** that day is marked closed and its time inputs are disabled/hidden.
3. **Given** a seller updating hours for a day, **When** they save, **Then** the schedule is persisted correctly.

---

### User Story 4 — List & Search Branches (Priority: P3)

A seller sees all branches of their shop in a table. They can search by name and click a branch to view its details.

**Why this priority**: Multi-location support is important but not needed for single-location sellers.

**Independent Test**: Navigate to `/dashboard/branches`, confirm branch list loads, type in the search box, and verify the list filters accordingly.

**Acceptance Scenarios**:

1. **Given** a logged-in seller, **When** they visit the Branches page, **Then** all their branches are listed with name, phone, address, and action buttons.
2. **Given** a seller with branches, **When** they type in the search box, **Then** the list filters to matching branch names.
3. **Given** a seller with no branches, **When** they visit the page, **Then** an empty state with a "Add Branch" call-to-action is shown.

---

### User Story 5 — Create Branch (Priority: P3)

A seller adds a new branch by filling in a form with name (Arabic/English), phone, email, address, and map coordinates.

**Why this priority**: Depends on the list page; CRUD completeness.

**Independent Test**: Click "Add Branch" on `/dashboard/branches`, fill the form, submit, verify the new branch appears in the list.

**Acceptance Scenarios**:

1. **Given** a seller on the Branches page, **When** they click "Add Branch" and fill the required fields, **Then** a new branch is created and appears in the list.
2. **Given** a seller submitting an incomplete form, **When** they click Save, **Then** required field errors appear without calling the API.

---

### User Story 6 — Edit & Delete Branch (Priority: P3)

A seller can update a branch's information or delete it. Deletion requires a confirmation dialog.

**Why this priority**: CRUD completeness after create.

**Independent Test**: Click edit on a branch row, change the phone number, save, verify the update. Click delete, confirm in the dialog, verify the branch is removed.

**Acceptance Scenarios**:

1. **Given** an existing branch, **When** the seller edits it and saves, **Then** the branch details update and a success toast appears.
2. **Given** an existing branch, **When** the seller clicks Delete, **Then** a confirmation dialog appears before any deletion occurs.
3. **Given** a seller confirming deletion, **When** they confirm, **Then** the branch is removed from the list.

---

### Edge Cases

- What happens when the shop has no branches yet? → Empty state with "Add Branch" CTA.
- What happens if logo or cover upload fails? → Error toast is shown; existing image is retained.
- What happens if the seller's `shopId` is not yet set? → Redirect to `https://ordrat.com/seller-setup` (handled by existing auth logic).
- What happens if working hours have never been configured? → All days default to "closed".
- What happens if a branch form save fails? → Error toast shown; form stays open with data intact.
- What happens when `ShippingPricingMethod` switches from `PricePerCity` to `Fixed`? → The city-price table is hidden; existing city prices are preserved on the backend until explicitly removed.
- What happens if a seller saves `PricePerCity` with no city rows entered? → Validation error shown; save is blocked until at least one city-price pair is added.

---

## Requirements *(mandatory)*

### Functional Requirements

**Shop Profile**
- **FR-001**: The system MUST display the seller's shop profile pre-filled using their authenticated session's `shopId`.
- **FR-002**: The seller MUST be able to update shop details: `NameEn`/`NameAr` (shown based on `ShopLanguage`), `Description`, `Phone`, `Email`, `Address`, `Latitude`, `Longitude`, `DeliveryTime`, `MinimumOrder`, `ShopLanguage`, `ShopType`.
- **FR-002a**: The profile form MUST conditionally render language-specific inputs based on the current `ShopLanguage` value: Arabic → AR fields only; English → EN fields only; ArabicandEnglish → both fields shown.
- **FR-003**: The seller MUST be able to upload a logo image independently (separate from the general profile save).
- **FR-004**: The seller MUST be able to upload a cover image independently.
- **FR-005**: All profile form fields MUST validate before submission (required fields, phone/email formats).

**Shop Settings**
- **FR-006**: The system MUST display current shop settings pre-filled from the API.
- **FR-007**: The seller MUST be able to update shop settings and save them.
- **FR-007a**: The settings form MUST include a `TransactionType` selector (Percentage | Flat) that determines how the delivery fee is calculated.
- **FR-007b**: When `TransactionType` is `Percentage`, the delivery fee input MUST accept a percentage value (e.g. 10%). When `Flat`, it MUST accept a fixed monetary amount.
- **FR-007c**: The settings form MUST include a `ShippingPricingMethod` selector (Fixed | PricePerCity).
- **FR-007d**: When `ShippingPricingMethod` is `Fixed`, a single delivery price input is shown. When `PricePerCity`, a sub-table is shown where the seller can add, edit, and remove city-price pairs. City name is a free-text input (no API lookup — Bosta city dropdown is deferred to the delivery feature).

**Working Hours**
- **FR-008**: The system MUST display the weekly working schedule for the shop (7 days).
- **FR-009**: The seller MUST be able to toggle each day as open or closed.
- **FR-010**: When a day is open, the seller MUST be able to set opening and closing times.
- **FR-011**: Saving working hours MUST handle both creating new entries and updating existing ones.

**Branch Management**
- **FR-012**: The system MUST list all branches for the seller's shop.
- **FR-013**: The seller MUST be able to search branches by name.
- **FR-014**: The seller MUST be able to create a branch with: `NameEn`, `NameAr`, `Phone`, `Email`, `Address`, `Latitude`, `Longitude`.
- **FR-015**: The seller MUST be able to edit any branch field.
- **FR-016**: The seller MUST be able to delete a branch — deletion MUST require explicit confirmation.
- **FR-017**: Branch forms MUST validate required fields before submitting.

**Navigation & Access**
- **FR-018**: The sidebar MUST include a "My Shop" link (profile + settings) and a "Branches" link under a dedicated section.
- **FR-019**: All pages in this feature MUST be accessible only to authenticated sellers (protected routes).

**Dashboard Shell — Header Toolbar**
- **FR-020**: The header toolbar MUST display icon buttons for: Coffee, MessageSquareCode, Pin (in that order).
- **FR-021**: The header toolbar MUST display an "Add" button (Plus icon + label on desktop; icon-only on mobile).
- **FR-022**: The "Reports" button MUST be removed from the header toolbar entirely.
- **FR-023**: The header toolbar MUST include a standalone dark/light mode toggle button (Moon icon in light mode, Sun icon in dark mode) — visible directly in the toolbar, not only inside the user dropdown.
- **FR-024**: The header toolbar MUST include a `LanguageSwitcher` component that allows switching between Arabic (`ar`) and English (`en`).
- **FR-025**: The `LanguageSwitcher` MUST display the current language as a short label (e.g. "AR" / "EN") and allow toggling between the two.

**Localization (i18n)**
- **FR-026**: The dashboard MUST be configured with `react-i18next` supporting Arabic (`ar`) and English (`en`) locales.
- **FR-027**: The selected language MUST persist across page reloads (stored in localStorage).
- **FR-028**: When Arabic is active, the document direction MUST switch to RTL (`dir="rtl"`); when English is active, it MUST revert to LTR (`dir="ltr"`).

**Excluded (admin-only — do NOT implement)**
- `GET /api/Shop/GetAll` — platform-wide shop listing (admin)
- `DELETE /api/Shop/Delete/{id}` — admin shop deletion
- `GET /api/Shop/GetShopsNearby` — customer discovery
- `GET /api/Shop/GetShopsByCategory` — customer discovery
- `GET /api/Shop/Search` — platform-wide search

### Key Entities

- **Shop**: The seller's store. Key attributes: `id`, `nameEn`, `nameAr`, `logo`, `coverImage`, `description`, `phone`, `email`, `address`, `latitude`, `longitude`, `deliveryTime`, `minimumOrder`, `categoryId`, `shopLanguage` (enum: Arabic | English | ArabicandEnglish), `shopType` (enum: Shop | SuperMarket).
- **ShopSettings**: Operational configuration for the shop. Key attributes: `shopId`, `transactionType` (enum: Percentage | Flat — delivery fee calculation method), `deliveryFeeValue` (number — interpreted as % or flat amount based on `transactionType`), `shippingPricingMethod` (enum: Fixed | PricePerCity), plus any additional fields returned by the API.
- **WorkingHours**: Weekly schedule. Key attributes: `id`, `shopId`, `dayOfWeek`, `openTime`, `closeTime`, `isClosed`.
- **Branch**: A physical location belonging to the shop. Key attributes: `id`, `shopId`, `nameEn`, `nameAr`, `phone`, `email`, `address`, `latitude`, `longitude`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Sellers can view and update their shop profile without leaving the dashboard.
- **SC-002**: Logo and cover image uploads complete and show a preview update without a full page reload.
- **SC-003**: The branch list loads and displays all branches on page open.
- **SC-004**: Sellers can create a new branch end-to-end (fill form → save → visible in list) without errors.
- **SC-005**: 100% of destructive actions (branch delete) require explicit confirmation before executing.
- **SC-006**: All forms show clear inline validation errors — no API calls are made with invalid data.
- **SC-007**: All Shop & Branch pages are reachable from the sidebar in one click.

---

## Assumptions

- The seller has exactly one shop tied to their account (`GET /api/Shop/GetByUserId` returns one shop).
- `shopId` is available from the NextAuth session after login.
- Map coordinates for branches are entered manually as number inputs — no embedded map picker in this phase.
- Working hours default to all-closed if they have never been configured before.
- Shop category dropdown for the profile form uses `GET /api/ShopCategory/GetAll`.
- All UI is built using existing `components/ui/` components — no custom components from scratch.
- Bilingual inputs (`NameEn`/`NameAr`, `DescriptionEn`/`DescriptionAr`) are conditionally rendered based on `ShopLanguage`: Arabic → AR inputs only; English → EN inputs only; ArabicandEnglish → both inputs shown.
- Branch name inputs follow the same `ShopLanguage` visibility rule.

## Clarifications

### Session 2026-03-25

- Q: Does `ShopLanguage` control which name/description inputs are visible in the profile form? → A: Yes — `ShopLanguage` drives input visibility. Arabic shows only AR fields; English shows only EN fields; ArabicandEnglish shows both.
- Q: Is `ShopType` (Shop | SuperMarket) editable by the seller, or read-only? → A: Editable — seller can switch between `Shop` and `SuperMarket` via a select in the profile form.
- Q: What does `TransactionType` (Percentage | Flat) configure? → A: Delivery fee calculation method — seller picks whether their delivery charge is a flat amount or a percentage of the order total.
- Q: Is the `PricePerCity` city-price configuration table in scope for this feature? → A: Fully in scope — when `PricePerCity` is selected, a sub-table appears for the seller to add/edit/remove city-price pairs.
- Q: Do branch name inputs follow `ShopLanguage` visibility rules? → A: Yes — branch forms use the same conditional rendering as the shop profile (follows `ShopLanguage`).
- Directive: Add i18n (react-i18next, AR/EN), language switcher in header toolbar, remove Reports button, keep Coffee/MessageSquareCode/Pin/Add, add standalone Moon/Sun theme toggle to toolbar.
