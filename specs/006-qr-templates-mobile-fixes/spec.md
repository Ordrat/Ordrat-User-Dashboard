# Feature Specification: QR Print Templates & Mobile UI Fixes

**Feature Branch**: `006-qr-templates-mobile-fixes`  
**Created**: 2026-04-04  
**Updated**: 2026-04-04 (SVG-replacement approach)  
**Status**: In Progress

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Download a Branded QR Sticker Sheet (Priority: P1)

A shop owner finishes customising their QR code style (shape, colours, logo) on the QR Code page. Below the design controls they see four template cards showing pre-designed A4 sticker-sheet layouts. They pick one, click "Download", and receive the original SVG template file with every QR slot replaced by their own QR code. The rest of the template — background, Ordrat branding, decorative elements — is pixel-identical to the original.

**Why this priority**: Core new feature — this is the entire reason for the branch.

**Independent Test**: Navigate to `/store-settings/qr-code`, configure any QR style, click a template card's download button, open the downloaded SVG in a viewer (browser, Illustrator, Inkscape), and verify (a) every QR slot contains a QR code that scans to the shop URL, (b) the Ordrat footer is unchanged, (c) all other artwork is unchanged.

**Acceptance Scenarios**:

1. **Given** the QR page is loaded and a subdomain exists, **When** the user clicks "Download" on template 1, **Then** an SVG file is downloaded with the original template's A4 layout intact (viewBox `0 0 595.2 841.92`).
2. **Given** the user has chosen a custom QR style (e.g. rounded, dark red foreground), **When** they download a template, **Then** every QR code image element in the SVG reflects that exact style and colour.
3. **Given** the shop has a logo URL and the user selected the "Logo" QR style, **When** the template is downloaded, **Then** each QR code in the template has the shop logo embedded in its centre (via qr-code-styling's `image` option).
4. **Given** the shop has no logo, **When** the template is downloaded, **Then** QR codes are generated without a centre logo and the download still completes successfully.
5. **Given** any template, **When** it is downloaded, **Then** all SVG elements outside the 8 QR `<image>` slots are byte-for-byte identical to the original template file.

---

### User Story 2 — Preview Templates Before Downloading (Priority: P2)

The user can see thumbnail previews of all four templates in a card grid below the design controls on the QR page. Each card shows a small visual preview and a label. The selected template is highlighted. On mobile the card grid reflows without breaking the page layout.

**Why this priority**: Without previews, users cannot meaningfully choose between templates.

**Independent Test**: Load the QR page on both desktop (≥ 1024 px) and a 390 px wide mobile viewport; confirm all four template cards are visible without horizontal page-level scroll.

**Acceptance Scenarios**:

1. **Given** the QR page is open, **When** the user scrolls past the design controls, **Then** a "Print Templates" section is visible with exactly four cards.
2. **Given** the page is viewed on a 390 px wide mobile screen, **When** the template section is in view, **Then** no horizontal scrollbar appears at the page level.
3. **Given** the user clicks a template card, **When** the click is registered, **Then** the card shows a ring/active state and that template will be used for the next download.

---

### User Story 3 — Mobile-Responsive Pages (No Horizontal Scroll) (Priority: P3)

All dashboard pages — specifically Tables, Logs, Branches, and the QR Code page — render cleanly on mobile viewports (≥ 320 px). No content forces horizontal scroll at the page level.

**Why this priority**: Critical usability defect.

**Acceptance Scenarios**:

1. Tables, Logs, Branches, QR Code pages: zero horizontal scrollbar at 390 px viewport width.
2. Tables/Logs: table scrolls within its card container — the page itself does not scroll.
3. QR Code: QR canvas scales to fit without overflowing the page.

> **Status**: Already implemented in codebase. Verify only.

---

### User Story 4 — Offline Badge Properly Positioned in Header (Priority: P4)

The offline status badge sits as a contained sub-bar directly below the main header row, without a large gap above it and without overlapping page content below.

**Acceptance Scenarios**:

1. Offline mode → badge appears flush below the header nav row, no large margin above.
2. Badge visible → page content below header is not obscured.
3. Back online → badge disappears within 2 seconds.

---

### Edge Cases

- **No subdomain**: Template cards are disabled with a tooltip directing the user to set a subdomain first.
- **Large SVG processing**: The SVG files are 50–80 MB. The QR PNG data URL (~500 KB) is generated client-side and POSTed to the API route; the server streams the modified SVG back. The download button shows a loading spinner during this round-trip.
- **Logo CORS failure**: If `shop.logoUrl` cannot be loaded as an image, `qr-code-styling` will silently omit the logo. The QR is still generated and the download still completes.
- **No subdomain configured**: Download button is disabled.
- **Offline at download time**: The download requires the API route, so it will fail while offline. Show a toast error.

---

## Requirements *(mandatory)*

### Functional Requirements

**QR Print Templates**

- **FR-001**: The QR Code page MUST display a "Print Templates" section below the design-controls card, containing exactly four selectable template options.
- **FR-002**: Each template card MUST show a static thumbnail preview (WebP, 400 × 566 px) of the corresponding A4 sticker layout.
- **FR-003**: Users MUST be able to select one template at a time; the selected card MUST display a visually distinct active/selected state (ring highlight).
- **FR-004**: On download, the system MUST produce an SVG file that is the original template file with all 8 `<image width="1079" height="1079">` QR placeholder elements replaced with the user's generated QR code (as PNG data URL). All other SVG content is unchanged.
- **FR-005**: The replacement QR code MUST be generated at 1079 × 1079 px using the user's current `qr-code-styling` options (style, colour, shop URL, logo if applicable).
- **FR-006**: The shop logo (`shop.logoUrl`) is included in the QR code itself via `qr-code-styling`'s `image` option when the user has selected the "Logo" QR style — there is no separate logo slot in the SVG.
- **FR-007**: All SVG content outside the 8 replaced `<image>` elements MUST be preserved unchanged — background artwork, Ordrat footer branding, decorative elements.
- **FR-008**: The download flow uses a Next.js API route (`POST /api/qr-template`). The client generates the QR PNG as a base64 data URL, posts `{ templateId, qrDataUrl }` to the route, and the server reads the SVG from `public/QR-templates/{id}.svg`, does the string replacement, and returns the modified SVG as a file attachment.
- **FR-009**: Template thumbnail images for the picker are WebP files at `public/QR-templates/thumbnails/{id}.webp` (already committed). The original SVG files are gitignored due to size (50–80 MB each) and accessed only server-side via the API route.
- **FR-010**: Template cards MUST be disabled with an explanatory tooltip when the shop has no subdomain set.

**Mobile Horizontal Scroll Fixes**

- **FR-011** to **FR-015**: Already implemented. Tables/Logs wrapped in `overflow-x-auto`; Branches root div has `min-w-0`; QR canvas has `[&_canvas]:max-w-full`.

**Offline Badge**

- **FR-016**: The offline status indicator MUST be positioned as a contained sub-bar directly below the main header row, with no excessive gap.
- **FR-017**: The offline indicator MUST NOT overlap the toolbar or page content on any viewport width.

### Key Entities

- **QR Template**: One of four pre-designed A4 sticker-sheet SVG files. Attributes: id (1–4), label i18n key, thumbnail WebP URL, SVG file URL. The SVG is the source of truth — no pixel-coordinate config needed.
- **QR Slot**: An `<image width="1079" height="1079">` element in the SVG where the placeholder QR code lives. There are exactly 8 per template. Replaced at download time with the user's QR PNG data URL.
- **Ordrat Footer**: Fixed SVG branding — never touched. Preserved by the replacement approach since only `<image width="1079">` elements are modified.

---

## Success Criteria *(mandatory)*

- **SC-001**: A shop owner can select a template and receive a downloaded SVG in under 10 seconds on a standard broadband connection (includes API round-trip for 80 MB SVG processing).
- **SC-002**: Thumbnail images are each under 100 KB (WebP), enabling fast preview load.
- **SC-003**: All four named pages pass a zero horizontal-scroll check at 390 px viewport width.
- **SC-004**: Offline badge is fully contained within header bounds on all tested viewports.
- **SC-005**: 100% of the 8 QR slots in a downloaded SVG contain a scannable QR code pointing to the correct shop URL.
- **SC-006**: All SVG content outside the 8 `<image width="1079">` elements is byte-identical to the original template file.

---

## Clarifications

### Session 2026-04-04 (Updated)

- Q: What is the download file format? → **SVG** — the original template SVG with QR placeholder images replaced. Not a canvas-composited PNG.
- Q: Is the shop logo a separate slot in the SVG, or embedded in the QR? → **Embedded in QR** — there are only 8 × 1079×1079 image slots in the SVG (QR placeholders). No separate logo image element exists. The logo is rendered inside the QR code via `qr-code-styling`'s `image` option (only active when the user chose the "Logo" style).
- Q: How are QR slots identified in the SVG? → By their dimensions: every `<image width="1079" height="1079">` element is a QR placeholder. There are exactly 8 per template. All other image elements are background artwork.
- Q: Does the download require a server round-trip? → **Yes.** The 50–80 MB SVG files live on the server (gitignored, not loaded client-side). The client POSTs the QR data URL to `POST /api/qr-template`; the server modifies and streams the SVG back.

---

## Assumptions

- The four SVG templates are at `public/QR-templates/{1,2,3,4}.svg`; they are gitignored due to large size and accessed only server-side.
- WebP thumbnails at `public/QR-templates/thumbnails/{1,2,3,4}.webp` are committed to git and used for picker display.
- Each SVG contains exactly 8 `<image width="1079" height="1079">` elements as QR placeholders. All other image elements are background artwork and must not be modified.
- The `qr-code-styling` library generates QR codes client-side. Its `getRawData('png')` method returns a Blob (browser) or Buffer (Node.js). We use the browser Blob path and convert to base64 data URL before POSTing to the API.
- The red colour scheme and all decorative elements in the templates are part of the SVG background — they are NOT image elements and are not affected by the replacement.
