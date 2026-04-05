# Implementation Plan: QR Print Templates & Mobile UI Fixes

**Branch**: `006-qr-templates-mobile-fixes` | **Date**: 2026-04-04 | **Spec**: [spec.md](./spec.md)  
**Approach updated**: SVG string-replacement (not canvas compositing)

## Summary

Add four downloadable A4 print-template sticker sheets to the QR Code page. The user selects a template, clicks "Download", the client generates their QR code as a PNG data URL (via `qr-code-styling`), POSTs it to a Next.js API route, and the server reads the corresponding SVG from disk, replaces all 8 `<image width="1079" height="1079">` placeholder elements, and streams the modified SVG back as a file download. Template cards use extracted WebP thumbnails for preview. In parallel, fix mobile horizontal-scroll issues (already done) and reposition the offline badge.

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: Next.js 16.x (App Router), React 19, TanStack Query 5.x, Tailwind CSS 4.x, qr-code-styling, ReUI/Metronic 9  
**Download flow**: Client → `POST /api/qr-template` → Server reads `public/QR-templates/{id}.svg` → string replace 8 QR images → stream SVG back  
**Testing**: Manual viewport testing, open downloaded SVG in browser/Inkscape and scan QR codes  
**Target Platform**: Web (all modern browsers, mobile ≥ 320 px)  
**Performance**: Template download < 10 s (API route processes 80 MB SVG server-side); thumbnails < 100 KB each  
**Constraints**: SVG files are gitignored (50–80 MB each); thumbnails committed as WebP; no runtime canvas required

## Constitution Check

| Principle | Status | Notes |
|---|---|---|
| I. Frontend-Only Architecture | **PASS** | API route is a Next.js internal route — no external backend. Server reads `public/` files at runtime. |
| II. Component-Library-First | **PASS** | Template cards use existing Card, Badge, Button, Tooltip from `components/ui/`. |
| III. Swagger-First API Contracts | **PASS** | No new backend API endpoints. `shop.logoUrl` already available. |
| IV. Server-Side Route Protection | **PASS** | `/api/qr-template` is a download utility route, not a data route. |
| V. Internationalisation (i18n) First | **PASS** | All new labels added to both en.json and ar.json. ✅ Done |
| VI. Type Safety & Schema Validation | **PASS** | Template config typed; request body validated in API route. |

## Project Structure

### Source Code (repository root)

```text
public/QR-templates/
├── 1.svg  2.svg  3.svg  4.svg      # Original templates (gitignored — 50-80 MB each)
├── thumbnails/                      # Committed — 67 KB WebP each ✅ Done
│   ├── 1.webp  2.webp  3.webp  4.webp
└── backgrounds/                     # Committed — 484 KB JPEG each (kept, not used for download)

lib/qr-templates/
├── config.ts         # Template metadata (id, labelKey, thumbnailUrl, svgUrl) — needs simplification ✅ skeleton done
└── composit.ts       # Client-side: generates QR PNG data URL → POST to API → triggers download (needs rewrite)

app/api/qr-template/
└── route.ts          # NEW — POST handler: reads SVG, replaces QR images, streams SVG

app/[locale]/(dashboard)/store-settings/qr-code/
├── page.tsx           # Modified — states + download handler + template picker section
└── template-picker.tsx  # NEW component ✅ Done

components/pwa/
└── offline-progress-bar.tsx   # Modified — badge positioning fix

messages/
├── en.json   # ✅ Done — template i18n keys added
└── ar.json   # ✅ Done — template i18n keys added
```

---

## Phase 0: Research ✅ Complete

See [research.md](./research.md).

**Key findings:**
1. Each SVG is 50–80 MB and contains 10 copies of the background JPEG (Illustrator export artefact) plus 8 × `<image width="1079" height="1079">` QR placeholder images.
2. All 8 QR placeholders per template are identical (same placeholder QR code). They are identified solely by `width="1079" height="1079"`.
3. No separate logo image elements exist in the SVG. The logo is handled by `qr-code-styling`'s `image` option.
4. The base64 data inside each `<image>` href spans multiple lines in the SVG source. Replacement is done by string position (find opening `"`, find closing `"`, replace the span).
5. WebP thumbnails (extracted from background JPEGs) are 67 KB each — practical for picker display.

---

## Phase 1: Design ✅ Complete

See [data-model.md](./data-model.md) — note: slot coordinates from the canvas approach are now unused. The relevant data model is:

```typescript
type TemplateConfig = {
  id: 1 | 2 | 3 | 4;
  labelKey: string;        // i18n key
  thumbnailUrl: string;    // /QR-templates/thumbnails/{id}.webp
  svgUrl: string;          // /QR-templates/{id}.svg  (server-side path only)
};
```

No per-slot coordinates needed — the SVG replacement finds slots by `width="1079"` attribute.

---

## Phase 2: SVG Replacement Core (Foundational)

**T-A** `lib/qr-templates/config.ts` — simplify to only `id`, `labelKey`, `thumbnailUrl`, `svgUrl`. Remove all `TemplateSlot` and canvas coordinate data. *(skeleton exists — needs cleanup)*

**T-B** `lib/qr-templates/composit.ts` — rewrite entirely:
- Export `downloadTemplate(templateId, qrOptions, shopUrl)` async function
- Step 1: `new QRCodeStyling({ ...qrOptions, width: 1079, height: 1079, data: shopUrl })` → `getRawData('png')` → convert Blob to base64 data URL (`data:image/png;base64,...`)
- Step 2: `POST /api/qr-template` with `{ templateId, qrDataUrl }`
- Step 3: Response is a binary SVG stream → `response.blob()` → `URL.createObjectURL` → trigger anchor download as `qr-template-{id}.svg`
- Error: re-throw so caller can show toast

**T-C** `app/api/qr-template/route.ts` — new POST route:
- Validate `templateId` (1–4) and `qrDataUrl` (must start with `data:image/png;base64,`)
- Read `path.join(process.cwd(), 'public', 'QR-templates', `${templateId}.svg`)` with `fs.readFile`
- Call `replaceQRImages(svgText, qrDataUrl)` — replaces ALL `<image width="1079" height="1079">` href values
- Return `NextResponse` with `Content-Type: image/svg+xml` and `Content-Disposition: attachment; filename="qr-template-{id}.svg"`

**`replaceQRImages` algorithm** (must handle multiline base64 correctly):
```
pos = 0
while pos < text.length:
  imageStart = text.indexOf('<image', pos)
  if not found: append rest, break
  preview = text[imageStart .. imageStart+100]  // check dimensions
  if 'width="1079"' in preview and 'height="1079"' in preview:
    hrefKey = 'xlink:href="'
    hrefPos = text.indexOf(hrefKey, imageStart)
    dataStart = hrefPos + len(hrefKey)
    dataEnd = text.indexOf('"', dataStart)   // safe: base64 has no quotes
    append text[pos..dataStart]
    append newDataUrl
    pos = dataEnd
  else:
    append text[pos..imageStart+1]
    pos = imageStart + 1
```

**Checkpoint**: `npx tsc --noEmit` passes. POST to `/api/qr-template` with a test data URL returns a modified SVG where all 8 QR images are replaced.

---

## Phase 3: QR Page Wiring (US1)

**T-D** `app/[locale]/(dashboard)/store-settings/qr-code/page.tsx`:
- `handleTemplateDownload` calls `downloadTemplate(selectedTemplateId, buildQROptions(), shopUrl)` from the rewritten `composit.ts` *(already hooked up — only needs composit.ts rewrite)*
- Disable download button when `!shopUrl` (show tooltip) or `isDownloading`

**Checkpoint**: Click download → spinner appears → modified SVG downloads → QR codes in SVG scan to correct URL.

---

## Phase 4: Template Picker UI (US2)

**T-E** `template-picker.tsx` *(already created)* — verify it renders 4 cards with WebP thumbnails, selected-ring highlight, disabled state + tooltip. No changes needed unless visual issues.

**T-F** `app/[locale]/(dashboard)/store-settings/qr-code/page.tsx` — add "Print Templates" card section below the design-controls card:
```tsx
<Card>
  <CardHeader><CardTitle>{t('qrCode.printTemplates')}</CardTitle></CardHeader>
  <CardContent className="space-y-4">
    <TemplatePicker
      selectedId={selectedTemplateId}
      onSelect={setSelectedTemplateId}
      disabled={!shopUrl}
      disabledTooltip={t('qrCode.templateDisabledTooltip')}
    />
    <Button
      onClick={handleTemplateDownload}
      disabled={!shopUrl || isDownloading}
      className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
    >
      {isDownloading ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {t('qrCode.downloadTemplate')}
    </Button>
  </CardContent>
</Card>
```

**Checkpoint**: Template picker visible at 390 px. Cards selectable. Download button functional.

---

## Phase 5: Mobile Scroll Fixes (US3) ✅ Already Done

Verify only — no code changes needed:
- Tables: `overflow-x-auto` wrapper on table ✅
- Logs: `overflow-x-auto` wrapper on table ✅
- Branches: `min-w-0` on root div ✅
- QR Code: `[&_canvas]:max-w-full` on qrRef div ✅

---

## Phase 6: Offline Badge (US4)

**T-G** Investigate `components/pwa/offline-progress-bar.tsx` and layout header — identify what causes the large gap above the badge in the screenshot.

**T-H** Fix: ensure the badge is a direct child of the `<header>` element positioned `absolute bottom-0 inset-x-0`. Remove any separate "offline banner" component that renders outside the header.

---

## Phase 7: Polish

- **T-I**: Update `CLAUDE.md` — document that `<Table>` must always be wrapped in `overflow-x-auto`.
- **T-J**: Verify `hooks/use-page-precache.ts` has `/store-settings/qr-code` route entry.
- **T-K**: Visual verify downloaded SVG — open in browser, confirm QR codes are centred in their circular slots, scan QR with phone.
- **T-L**: `npx tsc --noEmit` → zero errors.
- **T-M**: `pnpm build` → zero errors.
