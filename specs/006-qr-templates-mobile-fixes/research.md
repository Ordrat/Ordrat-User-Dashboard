# Research: QR Print Templates & Mobile UI Fixes

## 1. SVG Template Structure

### Decision: Canvas-based PNG compositing (not SVG manipulation)

**Rationale**: The raw SVG templates are 50–80 MB each because they contain multiple embedded JPEG images as base64. Each template has ~8–10 full-page background layers (2480 × 3508 px JPEG) and 8 circular image slots (1079 × 1079 px JPEG). Manipulating these SVGs in the browser is impractical due to memory constraints. Instead, we extract one background JPEG per template at build time and composite the user's content on an HTML Canvas at download time.

**Alternatives considered**:
- SVG DOM manipulation: Rejected — loading a 60 MB SVG string into DOMParser causes memory issues on mobile.
- Server-side rendering: Rejected — violates frontend-only architecture and offline requirement.

### Template Slot Analysis

All templates have `viewBox="0 0 595.2 841.92"` (A4 at 72 DPI). Circular image slots are rendered at ~48.3 × 48.3 SVG units via a transform matrix (`scale ≈ 0.0447`). The conversion from SVG viewBox coordinates to pixel coordinates on a 2480 × 3508 canvas uses scale factor **4.167** (`2480 / 595.2`).

Each template has **8 stickers** arranged in a 4-row × 2-column grid. Each sticker has **one circular slot** that appears in the SVG. The background JPEG already contains the decorative border, Ordrat footer, and header area for each sticker. 

**Critical finding**: The research agent found 8 circular `<image>` slots per template (1079 × 1079). The user spec says each sticker has a separate QR slot AND a logo slot. Looking at the SVG coordinates more carefully:

For Template 1:
- Slots 0,2,4,6 (left column): cx ≈ 35, cy ≈ 106, 316, 527, 737
- Slots 1,3,5,7 (right column): cx ≈ 332, cy ≈ 106, 316, 527, 737

These are 8 total circular slots across 8 sticker positions. **This means each sticker currently has ONE circular slot** (not two). The logo placeholder may be part of the background image (non-replaceable) OR the templates have been designed with only QR slots, and the logo area in the header of each sticker is part of the fixed background.

**Resolution**: We will treat all 8 circular slots as **QR code slots**. The shop logo will be composited **into the center of the QR code** using `qr-code-styling`'s built-in `imageOptions` (which already overlays a logo in the center of the QR). This means each sticker gets a QR code with the shop logo embedded in it — matching the user's QR design from the main page. If the user clarifies that there are separate logo slots, additional positions can be added to the config later.

### Slot Coordinates (SVG viewBox units)

#### Template 1 (Elliptical clips: rx=24.12, ry=24.08)

| Slot | center (cx, cy) | Pixel coords (×4.167) |
|------|------------------|-----------------------|
| 0 | (34.99, 106.49) | (146, 444) |
| 1 | (331.88, 106.49) | (1383, 444) |
| 2 | (34.99, 316.11) | (146, 1317) |
| 3 | (331.88, 316.11) | (1383, 1317) |
| 4 | (34.99, 527.49) | (146, 2198) |
| 5 | (331.88, 527.49) | (1383, 2198) |
| 6 | (34.99, 737.11) | (146, 3072) |
| 7 | (331.88, 737.11) | (1383, 3072) |

Rendered slot size: ~48.3 SVG units → **201 px** diameter on canvas.

#### Template 2 (Circular clips: r=24.13)

| Slot | center (cx, cy) | Pixel coords (×4.167) |
|------|------------------|-----------------------|
| 0 | (329.10, 667.50) | (1371, 2782) |
| 1 | (31.10, 666.50) | (130, 2777) |
| 2 | (329.10, 456.50) | (1371, 1902) |
| 3 | (31.10, 455.50) | (130, 1898) |
| 4 | (329.10, 245.50) | (1371, 1023) |
| 5 | (31.10, 246.50) | (130, 1027) |
| 6 | (329.10, 34.50) | (1371, 144) |
| 7 | (31.10, 34.50) | (130, 144) |

#### Template 3 (Circular clips: r=24.13, decorative rings: r=55.75)

| Slot | center (cx, cy) | Pixel coords (×4.167) |
|------|------------------|-----------------------|
| 0 | (31.18, 106.31) | (130, 443) |
| 1 | (325.18, 106.31) | (1355, 443) |
| 2 | (31.18, 316.31) | (130, 1318) |
| 3 | (325.18, 316.31) | (1355, 1318) |
| 4 | (30.18, 527.31) | (126, 2197) |
| 5 | (324.18, 527.31) | (1351, 2197) |
| 6 | (30.18, 737.31) | (126, 3072) |
| 7 | (324.18, 737.31) | (1351, 3072) |

#### Template 4 (Circular clips: r=24.13)

| Slot | center (cx, cy) | Pixel coords (×4.167) |
|------|------------------|-----------------------|
| 0 | (52.51, 105.61) | (219, 440) |
| 1 | (350.51, 105.61) | (1461, 440) |
| 2 | (52.51, 316.61) | (219, 1319) |
| 3 | (350.51, 316.61) | (1461, 1319) |
| 4 | (52.51, 526.61) | (219, 2194) |
| 5 | (350.51, 526.61) | (1461, 2194) |
| 6 | (52.51, 737.61) | (219, 3074) |
| 7 | (350.51, 737.61) | (1461, 3074) |

---

## 2. QR Code Generation (Current Page)

**Library**: `qr-code-styling` — creates a `QRCodeStyling` instance, stores in `qrInstance` ref.

**Current export methods**:
- `downloadPng()` → `qrInstance.current?.download({ extension: 'png', name: 'shop-qr' })`
- `downloadSvg()` → same with `extension: 'svg'`

**For template compositing**:
- Create a **separate** `QRCodeStyling` instance at **201 × 201 px** (matching the rendered slot diameter on the 2480 × 3508 canvas) with the same design options (`buildQROptions()` but with adjusted width/height).
- Call `getRawData('png')` → returns `Promise<Blob>` → convert to `Image` → draw on canvas with circular clip.

**Design state accessible**: `selectedStyle`, `fgColor`, `margin`, `logoScale`, `roundness` — all available as component state. The `buildQROptions()` function already constructs the full config.

---

## 3. Background Extraction Strategy

### Decision: One-time Node.js build script using `sharp`

**Process**:
1. For each template SVG, regex-extract the **first** `<image ... width="2480" height="3508" ... xlink:href="data:image/jpeg;base64,{data}">`.
2. Decode the base64 to a JPEG buffer.
3. Re-encode with `sharp` at quality 85, targeting ≤ 500 KB per file.
4. Save to `public/QR-templates/backgrounds/{1-4}.jpg`.
5. Also resize to 400 × 566 px WebP for thumbnails → `public/QR-templates/thumbnails/{1-4}.webp`.
6. Move originals to `public/QR-templates/originals/` and add to `.gitignore`.

**Alternatives considered**:
- Manual screenshot export from Illustrator: More accurate but requires designer tooling.
- Runtime extraction: Rejected — would require loading 50+ MB in the browser.

---

## 4. Canvas Compositing Flow

```
1. Load background.jpg as Image (2480 × 3508)
2. Create offscreen canvas (2480 × 3508)
3. Draw background image at (0, 0)
4. For each slot in template config:
   a. Create QRCodeStyling instance (201 × 201 px, user's design)
   b. Get raw PNG blob → convert to Image
   c. Save canvas state
   d. Create circular clip at (slot.cx, slot.cy) with radius slot.r
   e. Draw QR image centered in clip region
   f. Restore canvas state
5. canvas.toBlob('image/png') → trigger download
```

**Logo handling**: The shop logo is embedded inside the QR code itself via `qr-code-styling`'s `image` option (already configured in `buildQROptions()`). No separate logo compositing step is needed — the QR code already contains the logo.

---

## 5. Mobile Horizontal Scroll Root Causes

| Page | Root Cause | Fix |
|------|-----------|-----|
| Tables | `<Table>` inside `<CardContent>` without `overflow-x-auto` | Wrap table in `<div className="overflow-x-auto">` |
| Logs | Same as Tables — 7 columns with `whitespace-nowrap` push table wider | Same fix |
| Branches | Table wrapper already has `overflow-x-auto`; root div missing `min-w-0` | Add `min-w-0` to root div |
| QR Code | Canvas at 288 px fixed width inside `p-8` container overflows on small screens | Add `[&_canvas]:max-w-full [&_canvas]:h-auto` + reduce padding to `p-6 sm:p-8` |

**Note**: Some of these fixes were already applied in the previous conversation session but need verification.

---

## 6. Offline Badge Positioning

**Current state**: `OfflineProgressBar` uses `absolute bottom-0 inset-x-0` inside the fixed `<header>`. This correctly pins the progress bar to the header's bottom edge.

**Issue from screenshot**: A separate "You're currently offline. Showing cached data." banner appears to be overlapping above the header with a large gap. This is likely from a different component or toast, not the `OfflineProgressBar` itself.

**Fix approach**: Investigate whether there is a separate offline toast/banner (possibly from a toast call or another component) and either remove it or reposition it inside the header bounds.
