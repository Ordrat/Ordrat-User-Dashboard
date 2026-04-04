# Feature Specification: Store Settings Extensions

**Feature Branch**: `005-store-settings-extensions`
**Created**: 2026-03-31
**Status**: Draft
**Input**: Continuation of Store Settings — Payment Gateway, Tables, Contact Info, Activity Logs, and QR Code Generator with style customization

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Manage Payment Gateways (Priority: P1)

A store owner wants to configure which payment methods are accepted in their shop, set their priority order, enable or disable specific gateways, and provide localized names and descriptions for each gateway.

**Why this priority**: Payment configuration is business-critical — without it, the shop cannot properly handle orders. Enabling/disabling specific methods directly affects revenue flow.

**Independent Test**: Navigate to Store Settings → Payment Gateways, view current gateways, toggle one on/off, reorder priority, save — all without requiring other new features.

**Acceptance Scenarios**:

1. **Given** the owner is on the Payment Gateways page, **When** the page loads, **Then** all payment gateways for the shop are shown with name, method type, enabled status, and priority.
2. **Given** a gateway is listed, **When** the owner toggles it enabled/disabled and saves, **Then** the change is persisted and reflected immediately.
3. **Given** multiple gateways exist, **When** the owner changes priority values and saves, **Then** gateways reorder to reflect the new priorities.
4. **Given** no gateways are configured, **When** the owner clicks Add Gateway, **Then** they can select a payment method, provide bilingual names, and save a new entry.
5. **Given** an existing gateway, **When** the owner edits names/descriptions and saves, **Then** changes are persisted without losing other fields.
6. **Given** a gateway with the same method already exists, **When** the owner tries to create a duplicate, **Then** a conflict message is shown.

---

### User Story 2 — Manage Restaurant Tables per Branch (Priority: P2)

A store owner with a dine-in restaurant wants to manage table configurations per branch — adding tables with capacity, location type, and status — so staff and customers can use QR-based table service.

**Why this priority**: Table management enables the dine-in ordering flow. It must be per-branch since different locations may have different floor plans.

**Independent Test**: Select a branch, view its tables, add a new table with number/capacity/location, change a table's status — fully testable without other new features.

**Acceptance Scenarios**:

1. **Given** the owner selects a branch and opens Tables, **When** the page loads, **Then** all tables for that branch are shown with number, capacity, location, and status.
2. **Given** the Tables page is open, **When** the owner adds a table with required fields, **Then** the table appears in the list.
3. **Given** an existing table, **When** the owner updates capacity or description, **Then** changes are saved without affecting other tables.
4. **Given** a table exists, **When** staff changes its status (Available/Occupied/Reserved), **Then** the status updates immediately.
5. **Given** a table number is already used in the same branch, **When** the owner tries to add it again, **Then** an error prevents the duplicate.

---

### User Story 3 — Manage Contact Information (Priority: P3)

A store owner wants to configure their shop's social media and contact links (WhatsApp, Facebook, X/Twitter, Instagram) so customers can reach them from the storefront.

**Why this priority**: Contact info improves customer trust and reachability but does not block core store operations.

**Independent Test**: Navigate to Store Settings → Contact Info, fill in social links, save, update a link, and delete — fully testable independently.

**Acceptance Scenarios**:

1. **Given** no contact info exists, **When** the owner opens Contact Info, **Then** an empty form is ready to fill.
2. **Given** the form is filled, **When** the owner saves, **Then** a new contact info record is created.
3. **Given** existing contact info, **When** the owner updates a link and saves, **Then** only the changed field is updated.
4. **Given** existing contact info, **When** the owner deletes it, **Then** the record is removed and the form reverts to empty state.
5. **Given** an invalid phone number or malformed URL, **When** the owner tries to save, **Then** a clear field-level validation message is shown.

---

### User Story 4 — View Activity Logs (Priority: P3)

A store owner or admin wants to review a chronological record of all actions taken in the system — orders placed, items updated, settings changed — with filtering by date range, action type, and entity for audit and troubleshooting.

**Why this priority**: Logs provide operational visibility but are not required for daily operations. Useful for debugging issues and auditing changes.

**Independent Test**: Navigate to Store Settings → Logs, view the log list, filter by date range and action type, confirm matching entries are shown — testable independently.

**Acceptance Scenarios**:

1. **Given** the owner opens Logs, **When** the page loads, **Then** a paginated list of recent entries is shown, newest first.
2. **Given** a log list, **When** the owner filters by start and end date, **Then** only entries within that range are shown.
3. **Given** a log list, **When** the owner filters by action type, **Then** only entries matching that action are shown.
4. **Given** a log list, **When** the owner filters by entity name or entity ID, **Then** only entries for that entity are shown.
5. **Given** no matching entries, **When** filters are applied, **Then** an empty state with a clear message is shown.
6. **Given** many entries, **When** the owner navigates pages, **Then** pagination works correctly.

---

### User Story 5 — Generate & Customize Shop QR Code (Priority: P2)

A store owner wants to generate a QR code linked to their shop's unique domain so customers can scan it to access the shop menu directly. The owner can choose from three visual styles (shape, color scheme, embedded logo) to match their brand.

**Why this priority**: QR codes are a key marketing and dine-in discovery tool. Customization allows brand alignment. The shop domain is already stored in Basic Data.

**Independent Test**: Navigate to Store Settings → QR Code, see the domain displayed, select a style preset, change colors (Style B) or see logo embedded (Style C), download the QR — fully testable without other new features.

**Acceptance Scenarios**:

1. **Given** the owner opens QR Code, **When** the page loads, **Then** the shop's storefront domain URL is displayed in plain text and a QR code is generated from it.
2. **Given** three style options (A: classic squares, B: rounded dots with brand color, C: shop logo embedded), **When** the owner selects a style, **Then** the QR preview updates immediately.
3. **Given** Style B is selected, **When** the owner picks a foreground or background color, **Then** the QR preview updates with the chosen colors.
4. **Given** Style C is selected, **When** the page renders, **Then** the shop logo is embedded in the center of the QR code.
5. **Given** the QR is customized, **When** the owner clicks Download, **Then** a high-resolution PNG file is downloaded.
6. **Given** no subdomain is configured, **When** the owner opens QR Code, **Then** a prompt is shown directing them to configure their domain in Basic Data first.

---

### Edge Cases

- What if the shop has no subdomain configured — QR Code page shows a prompt to set domain in Basic Data first.
- What if a payment gateway's provider ID no longer exists in the backend catalog — show an error on load.
- How are duplicate table numbers handled per branch — backend validation returns error, UI shows field-level message.
- What if logs return zero entries (new shop) — show empty state illustration.
- What if contact info `Delete` is called but no record exists — handle 404 gracefully without crashing.
- What if the shop logo is unavailable for QR Style C — fall back to Style A rendering without logo.

---

## Requirements *(mandatory)*

### Functional Requirements

**Payment Gateways**

- **FR-001**: System MUST display all payment gateways for the current shop with localized name, payment method type label, enabled status, and priority order.
- **FR-002**: System MUST allow creating a new payment gateway with payment method selection, bilingual names and descriptions, priority, and enabled state. Gateway credential configuration values are not exposed to the store owner.
- **FR-003**: System MUST allow updating an existing gateway's name, description, priority, and enabled state. Gateway credential configuration values are not editable by the store owner.
- **FR-004**: System MUST show a conflict error if the owner attempts to create a gateway with a payment method that already exists for the shop.
- **FR-005**: System MUST display payment method types as human-readable labels (not raw numbers).

**Tables**

- **FR-006**: System MUST display all tables for a selected branch with table number, capacity, location, status, and description.
- **FR-007**: System MUST allow creating a table for a branch with table number, capacity, location type (Indoor/Outdoor/Rooftop), and optional bilingual description.
- **FR-008**: System MUST allow updating a table's capacity, location, and descriptions.
- **FR-009**: System MUST allow changing a table's status (Available/Occupied/Reserved) independently.
- **FR-010**: System MUST scope table management to the currently selected branch. A branch dropdown selector at the top of the Tables page allows the owner to switch branches; the table list updates in place without navigating away.

**Contact Information**

- **FR-011**: System MUST display current contact info for the shop (WhatsApp, Facebook, X, Instagram).
- **FR-012**: System MUST allow creating contact info if none exists, or updating existing info.
- **FR-013**: System MUST allow deleting all contact info for the shop.
- **FR-014**: System MUST validate WhatsApp as a phone number and social links as valid URLs before saving.

**Activity Logs**

- **FR-015**: System MUST display a paginated reverse-chronological list of activity log entries scoped to the current shop. The backend enforces shop-level data isolation; the frontend sends only pagination and filter parameters.
- **FR-016**: System MUST allow filtering logs by start and end date/time.
- **FR-017**: System MUST allow filtering logs by action type from a labeled list.
- **FR-018**: System MUST allow filtering logs by entity name and entity ID.
- **FR-019**: System MUST show each log entry with timestamp, action type label, entity name, and description.
- **FR-020**: System MUST support page number and page size controls.

**QR Code**

- **FR-021**: System MUST generate a QR code encoding the shop's storefront URL derived from the shop subdomain.
- **FR-022**: System MUST display the shop's domain URL in plain text on the page for owner verification.
- **FR-023**: System MUST offer three QR style presets: (A) Classic square, (B) Rounded dots with brand color picker, (C) Classic with embedded shop logo.
- **FR-024**: System MUST provide foreground and background color pickers when Style B is selected.
- **FR-025**: System MUST embed the shop logo in the QR center when Style C is selected, falling back to Style A if logo is unavailable.
- **FR-026**: System MUST allow downloading the QR code as PNG (for digital sharing) and SVG (for print materials such as menus and table cards).
- **FR-027**: System MUST show a prompt to configure the shop domain in Basic Data if no subdomain is set.

**Navigation**

- **FR-028**: Sidebar section MUST be labelled "Store Settings" with sub-items: Basic Data, Branches, Payment Gateways, Tables, Contact Info, Logs, QR Code.
- **FR-029**: Each Store Settings sub-page MUST set the toolbar/page title via the i18n system.

### Key Entities

- **PaymentGateway**: A shop-level payment method configuration — enabled state, display priority, localized name/description, method type, and provider config values.
- **Table**: A physical table in a branch — number identifier, seating capacity, location type (Indoor/Outdoor/Rooftop), operational status (Available/Occupied/Reserved), bilingual description.
- **ContactInfo**: A shop's social and contact presence — WhatsApp number, Facebook URL, X (Twitter) URL, Instagram URL.
- **LogEntry**: A system audit record — timestamp, action type, entity name and ID, action description.
- **QRCode**: A generated visual code encoding the shop storefront URL, with a chosen visual style preset, color scheme, and optional logo overlay.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Store owners can configure all payment gateways in under 3 minutes with no guidance needed.
- **SC-002**: Table setup for a new branch (10 tables) can be completed in under 5 minutes.
- **SC-003**: Contact information can be added or updated in a single form submission.
- **SC-004**: Activity logs load within 2 seconds for queries spanning up to 30 days, with filter changes reflecting in under 1 second.
- **SC-005**: A store owner can generate, customize, and download a QR code (PNG or SVG) in under 1 minute.
- **SC-006**: 100% of generated QR codes encode the correct shop storefront URL (verifiable by scanning).
- **SC-007**: All Store Settings sub-pages are reachable from the sidebar in no more than 2 clicks from any dashboard page.

---

## Clarifications

### Session 2026-03-31

- Q: How should the UI handle `gatewayConfigValues` in the Payment Gateway create/update forms? → A: Hidden from store owner UI — gateway credential config is admin-managed; owners only control enabled state, priority, and bilingual names/descriptions.
- Q: How does the store owner navigate to tables for a specific branch? → A: Branch dropdown selector at the top of the Tables page — owner picks a branch to filter the table list in place.
- Q: Are activity logs scoped to the shop by the backend, or must the frontend pass a shopId filter? → A: Backend auto-scopes to the authenticated user's shop — frontend only sends pagination and filter parameters (date range, action type, entity).
- Q: What download format(s) should the QR Code page support? → A: Both PNG (for digital sharing) and SVG (for print materials like menus and table cards).

---

## Assumptions

- Shop storefront URL pattern is `https://<subdomain>.ordrat.com` — subdomain sourced from existing `SubdomainName` field in Basic Data.
- `PaymentMethod` enum values (0–9) will be mapped to human-readable labels in translation files.
- `TableStatus` enum values map to: 0 = Available, 1 = Occupied, 2 = Reserved.
- `TableLocation` enum values map to: 0 = Indoor, 1 = Outdoor, 2 = Rooftop.
- `LogsActionType` enum values (0–46) will be mapped to human-readable labels in translation files.
- QR code generation is fully client-side using a QR library — no backend endpoint required.
- The shop logo for QR Style C is fetched from the existing shop profile already stored in the session/query cache.
- Basic Data and Branches are already implemented under spec `002-shop-branch-management` and are not re-specified here.
- All pages follow the offline-first PWA pattern established in `004-pwa-offline-resilience`: `_entityType`/`_entityId` on mutations, toast suppression when offline, staleTime/gcTime per project rules, route registration in `use-page-precache.ts`.
