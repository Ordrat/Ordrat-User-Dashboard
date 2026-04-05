# Data Model: QR Print Templates

## Template Configuration (Static Config)

No database or API entities. All data is a **typed constant** in `lib/qr-templates/config.ts`.

### TemplateSlot

Describes one circular slot on the canvas where a QR code is drawn.

| Field | Type | Description |
|-------|------|-------------|
| cx | number | Center X in pixels (2480 × 3508 canvas) |
| cy | number | Center Y in pixels |
| radius | number | Clip circle radius in pixels |

### TemplateConfig

Describes one of the four printable sticker-sheet templates.

| Field | Type | Description |
|-------|------|-------------|
| id | 1 \| 2 \| 3 \| 4 | Template identifier |
| labelKey | string | i18n key for the template name (e.g. `qrCode.template1`) |
| backgroundUrl | string | Path to extracted JPEG background in `public/` |
| thumbnailUrl | string | Path to low-res WebP thumbnail in `public/` |
| canvasWidth | number | Always 2480 |
| canvasHeight | number | Always 3508 |
| slots | TemplateSlot[] | Array of 8 slot descriptors |

### Relationships

```
TemplateConfig 1 ──── * TemplateSlot
     │
     └── backgroundUrl → public/QR-templates/backgrounds/{id}.jpg
     └── thumbnailUrl  → public/QR-templates/thumbnails/{id}.webp
```

### Validation Rules

- `id` must be 1–4.
- `slots` array must have exactly 8 entries.
- `cx` must be in range [0, canvasWidth].
- `cy` must be in range [0, canvasHeight].
- `radius` must be > 0.
- `backgroundUrl` and `thumbnailUrl` must start with `/QR-templates/`.

### State (Component-Level)

The QR page uses `useState` for selected template ID. No persistence across page loads.

| State | Type | Default | Location |
|-------|------|---------|----------|
| selectedTemplateId | 1 \| 2 \| 3 \| 4 | 1 | QR page component |
| isDownloading | boolean | false | QR page component |

---

## Hardcoded Slot Coordinates

Derived from SVG viewBox analysis. Scale factor: `2480 / 595.2 = 4.167`.

### Template 1

8 slots, 4 rows × 2 columns, elliptical clips (treated as circles with r ≈ 100 px on canvas).

```typescript
slots: [
  { cx: 146,  cy: 444,  radius: 100 },
  { cx: 1383, cy: 444,  radius: 100 },
  { cx: 146,  cy: 1317, radius: 100 },
  { cx: 1383, cy: 1317, radius: 100 },
  { cx: 146,  cy: 2198, radius: 100 },
  { cx: 1383, cy: 2198, radius: 100 },
  { cx: 146,  cy: 3072, radius: 100 },
  { cx: 1383, cy: 3072, radius: 100 },
]
```

### Template 2

8 slots, reverse row ordering (bottom-to-top in the SVG).

```typescript
slots: [
  { cx: 1371, cy: 2782, radius: 101 },
  { cx: 130,  cy: 2777, radius: 101 },
  { cx: 1371, cy: 1902, radius: 101 },
  { cx: 130,  cy: 1898, radius: 101 },
  { cx: 1371, cy: 1023, radius: 101 },
  { cx: 130,  cy: 1027, radius: 101 },
  { cx: 1371, cy: 144,  radius: 101 },
  { cx: 130,  cy: 144,  radius: 101 },
]
```

### Template 3

8 slots, standard 4 × 2 grid.

```typescript
slots: [
  { cx: 130,  cy: 443,  radius: 101 },
  { cx: 1355, cy: 443,  radius: 101 },
  { cx: 130,  cy: 1318, radius: 101 },
  { cx: 1355, cy: 1318, radius: 101 },
  { cx: 126,  cy: 2197, radius: 101 },
  { cx: 1351, cy: 2197, radius: 101 },
  { cx: 126,  cy: 3072, radius: 101 },
  { cx: 1351, cy: 3072, radius: 101 },
]
```

### Template 4

8 slots, standard 4 × 2 grid.

```typescript
slots: [
  { cx: 219,  cy: 440,  radius: 101 },
  { cx: 1461, cy: 440,  radius: 101 },
  { cx: 219,  cy: 1319, radius: 101 },
  { cx: 1461, cy: 1319, radius: 101 },
  { cx: 219,  cy: 2194, radius: 101 },
  { cx: 1461, cy: 2194, radius: 101 },
  { cx: 219,  cy: 3074, radius: 101 },
  { cx: 1461, cy: 3074, radius: 101 },
]
```

**Note**: These coordinates are approximate (calculated from SVG transform matrices). They must be visually verified after the background JPEGs are extracted. Fine-tuning of ±5 px is expected during implementation.
