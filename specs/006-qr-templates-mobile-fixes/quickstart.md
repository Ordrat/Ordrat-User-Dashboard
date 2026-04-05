# Quickstart: QR Print Templates & Mobile UI Fixes

## Prerequisites

- Node.js 18+ with `pnpm`
- `sharp` installed as a dev dependency for the extraction script
- Chrome DevTools for mobile viewport testing

## Setup Steps

### 1. Extract template backgrounds (one-time build step)

```bash
# Install sharp if not already present
pnpm add -D sharp

# Run the extraction script (creates backgrounds/ and thumbnails/)
node scripts/extract-qr-backgrounds.js
```

This produces:
- `public/QR-templates/backgrounds/{1-4}.jpg` — compressed JPEG backgrounds (~200–400 KB each)
- `public/QR-templates/thumbnails/{1-4}.webp` — 400 × 566 px thumbnails for the card previews

### 2. Move originals out of public/

```bash
mkdir -p public/QR-templates/originals
mv public/QR-templates/{1,2,3,4}.svg public/QR-templates/originals/
# Add originals/ to .gitignore to avoid committing 250 MB of SVGs
echo "public/QR-templates/originals/" >> .gitignore
```

### 3. Run dev server

```bash
pnpm dev
```

Navigate to `/en/store-settings/qr-code` — the template picker section should appear below the design controls.

## Key Files to Edit

| File | What to do |
|------|-----------|
| `lib/qr-templates/config.ts` | Create — template slot coordinates config |
| `lib/qr-templates/composit.ts` | Create — canvas compositing + download logic |
| `app/[locale]/(dashboard)/store-settings/qr-code/page.tsx` | Modify — integrate template picker |
| `app/[locale]/(dashboard)/store-settings/qr-code/template-picker.tsx` | Create — template card grid UI |
| `app/[locale]/(dashboard)/store-settings/tables/page.tsx` | Modify — wrap table in overflow-x-auto |
| `app/[locale]/(dashboard)/store-settings/logs/page.tsx` | Modify — wrap table in overflow-x-auto |
| `app/[locale]/(dashboard)/store-settings/branches/page.tsx` | Modify — add min-w-0 to root |
| `components/pwa/offline-progress-bar.tsx` | Modify — reposition badge |
| `messages/en.json` | Modify — add template i18n keys |
| `messages/ar.json` | Modify — add template i18n keys |

## Verify

```bash
# Type check
npx tsc --noEmit

# Manual QR download test
# 1. Open /en/store-settings/qr-code
# 2. Select any QR style
# 3. Click a template card → "Download"
# 4. Verify downloaded PNG has correct QR codes + footer intact

# Mobile scroll test
# Open Chrome DevTools → iPhone 12 Pro (390×844)
# Check: Tables, Logs, Branches, QR Code pages → no horizontal scroll
```
