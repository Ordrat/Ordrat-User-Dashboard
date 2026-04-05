# Tasks: QR Print Templates & Mobile UI Fixes

**Input**: Design documents from `/specs/006-qr-templates-mobile-fixes/`
**Prerequisites**: plan.md ✅  spec.md ✅  research.md ✅  data-model.md ✅  contracts/ ✅

**Approach**: SVG string-replacement — client generates QR PNG data URL via `qr-code-styling`, POSTs to a Next.js API route, server reads the SVG from disk, replaces all 8 `<image width="1079" height="1079">` placeholder elements, streams modified SVG back as download.

**Organization**: Tasks grouped by user story. US3 (mobile scroll) and US4 (offline badge) are fully independent and can run in parallel with US1/US2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared in-progress dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- **✅ Already done**: Present in codebase — verify only, no implementation needed

---

## Phase 1: Setup (Already Complete)

All setup work was done in the previous session.

- [x] T001 i18n keys added to `messages/en.json` and `messages/ar.json` (`printTemplates`, `template1–4`, `downloadTemplate`, `templateDisabledTooltip`, `downloadError`) ✅
- [x] T002 WebP thumbnails extracted to `public/QR-templates/thumbnails/{1-4}.webp` (67 KB each) ✅
- [x] T003 SVG files placed at `public/QR-templates/{1,2,3,4}.svg` (gitignored, accessible server-side) ✅
- [x] T004 `selectedTemplateId` (default `1`) and `isDownloading` state added to `app/[locale]/(dashboard)/store-settings/qr-code/page.tsx` ✅
- [x] T005 `handleTemplateDownload` async function added to `app/[locale]/(dashboard)/store-settings/qr-code/page.tsx` (calls `downloadTemplate`, shows `toast.error` on failure, guards on `!shopUrl`/`isDownloading`) ✅
- [x] T006 `app/[locale]/(dashboard)/store-settings/qr-code/template-picker.tsx` created (2-col grid, WebP thumbnails, ring selection, disabled+tooltip state) ✅

**Checkpoint**: All scaffolding in place. Ready for foundational logic.

---

## Phase 2: Foundational (Blocking — Complete Before US1 and US2)

**Purpose**: Core SVG-replacement logic. US1 and US2 cannot work until all three tasks below are complete.

**⚠️ CRITICAL**: T007 must precede T008; T008 and T009 can be implemented concurrently once T007 is done.

- [x] T007 Simplify `lib/qr-templates/config.ts` — remove `TemplateSlot` type and all per-slot pixel coordinate data (leftover from old canvas approach); keep only `TemplateConfig` with `{ id, labelKey, thumbnailUrl, svgUrl }` and the `QR_TEMPLATES` array. Final shape:
  ```typescript
  type TemplateConfig = { id: 1|2|3|4; labelKey: string; thumbnailUrl: string; svgUrl: string }
  QR_TEMPLATES = [
    { id:1, labelKey:'qrCode.template1', thumbnailUrl:'/QR-templates/thumbnails/1.webp', svgUrl:'/QR-templates/1.svg' },
    ...
  ]
  ```

- [x] T008 Create `app/api/qr-template/route.ts` — POST handler that: (1) validates `templateId` ∈ {1,2,3,4} and `qrDataUrl` starts with `data:image/png;base64,`; (2) reads `public/QR-templates/{templateId}.svg` via `fs.readFile` using `path.join(process.cwd(), 'public', 'QR-templates', ...)` ; (3) calls internal `replaceQRImages(svgText, qrDataUrl)` which iterates the SVG string, finds every `<image` where first 150 chars of the tag contain both `width="1079"` and `height="1079"`, locates the `xlink:href="` opening, finds the next `"` (closing quote — safe since base64 has no quotes), replaces that span with `qrDataUrl`; (4) returns `new NextResponse(modified, { headers: { 'Content-Type': 'image/svg+xml', 'Content-Disposition': 'attachment; filename="qr-template-{id}.svg"' } })`. Return 400 on invalid input, 404 if SVG file missing.

- [x] T009 Rewrite `lib/qr-templates/composit.ts` entirely — export `downloadTemplate(templateId, qrOptions, shopUrl)` that: (1) creates `new QRCodeStyling({ ...qrOptions, width: 1079, height: 1079, data: shopUrl })`, calls `getRawData('png')`, normalises result to a `Blob` (handles both browser Blob and Node.js Buffer), converts to base64 data URL via `FileReader`; (2) POSTs `{ templateId, qrDataUrl }` to `/api/qr-template`; (3) on non-ok response throws `Error` with server's `error` field; (4) on success calls `response.blob()`, creates object URL, triggers anchor download as `qr-template-{templateId}.svg`, revokes URL after 10 s. Delete all canvas/compositing code from the old implementation.

**Checkpoint**: `npx tsc --noEmit` passes. A manual `curl -X POST /api/qr-template -d '{"templateId":1,"qrDataUrl":"data:image/png;base64,iVBOR..."}' ` returns a modified SVG file where all 8 `<image width="1079">` elements contain the supplied data URL.

---

## Phase 3: User Story 1 — Download a Branded QR Sticker Sheet (Priority: P1) 🎯 MVP

**Goal**: Clicking "Download" on a selected template generates the user's QR code and downloads the original template SVG with all 8 QR placeholders replaced.

**Independent Test**: Navigate to `/store-settings/qr-code`, configure a QR style, select template 1, click "Download". Verify: (a) a spinner appears during processing; (b) an SVG file is downloaded; (c) opening the SVG in a browser shows the template with QR codes in every slot; (d) scanning any QR code with a phone reads the correct shop URL; (e) all other template artwork is unchanged.

- [x] T010 [US1] Verify `handleTemplateDownload` in `app/[locale]/(dashboard)/store-settings/qr-code/page.tsx` passes `shopUrl` (not `null`) as the third argument to `downloadTemplate` — update the call site to `downloadTemplate(selectedTemplateId, buildQROptions(), shopUrl)` where `shopUrl` is the non-null shop URL string. Confirm the button is disabled when `!shopUrl` and while `isDownloading`. No other changes needed to this function.

**Checkpoint**: End-to-end download works. Downloaded SVG has correct QR codes. No-subdomain case → button disabled.

---

## Phase 4: User Story 2 — Preview Templates Before Downloading (Priority: P2)

**Goal**: Four template thumbnail cards appear below the design-controls card. Selected card has a ring highlight. Download button is below the picker. Layout is mobile-responsive.

**Independent Test**: Load the QR page at 390 px viewport in DevTools. Confirm: four cards visible in 2-column grid without horizontal scroll; clicking a card highlights it and changes which template is downloaded; "Download" button is present.

- [x] T011 [US2] Add the "Print Templates" `<Card>` section to `app/[locale]/(dashboard)/store-settings/qr-code/page.tsx` — place it after the closing `</div>` of the `grid gap-7 xl:grid-cols-[...]` wrapper. Import `TemplatePicker` from `./template-picker`. The card contains: `<CardHeader>` with `<CardTitle>{t('qrCode.printTemplates')}</CardTitle>`, then `<CardContent className="space-y-4">` with `<TemplatePicker selectedId={selectedTemplateId} onSelect={setSelectedTemplateId} disabled={!shopUrl} disabledTooltip={t('qrCode.templateDisabledTooltip')} />` and a full-width `<Button>` that calls `handleTemplateDownload`, shows a `<LoaderCircle className="size-4 animate-spin me-2" />` while `isDownloading`, is disabled when `!shopUrl || isDownloading`, and is labelled `{t('qrCode.downloadTemplate')}` with `className="w-full bg-brand text-brand-foreground hover:bg-brand/90"`.

- [x] T012 [US2] Wrap the download `<Button>` in T011 in a `<Tooltip>` — when `!shopUrl`, `<TooltipContent>` shows `t('qrCode.templateDisabledTooltip')`; when `shopUrl` exists, no tooltip content is rendered. Use a `<span className="inline-flex w-full">` as `<TooltipTrigger asChild>` so the tooltip fires even when the button is disabled.

- [x] T013 [P] [US2] Verify `app/[locale]/(dashboard)/store-settings/qr-code/template-picker.tsx` renders correctly — open page at 390 px and confirm: `grid grid-cols-2` layout has no horizontal overflow, WebP thumbnail images are `w-full h-auto object-cover`, selected ring (`ring-2 ring-brand`) is visible. Make any minor visual fixes needed (padding, label truncation, etc.). No structural changes expected.

**Checkpoint**: Template picker section visible below design controls at all breakpoints. Cards selectable, highlighted, thumbnails loading. Download button functional with loading state.

---

## Phase 5: User Story 3 — Mobile-Responsive Pages (Priority: P3)

**Goal**: Zero horizontal scroll on Tables, Logs, Branches, and QR Code pages at ≥ 320 px viewport.

**Independent Test**: Chrome DevTools → iPhone 12 Pro (390 × 844). Check all four pages. Expected: no horizontal scrollbar visible, all interactive elements reachable.

- [x] T014 [P] [US3] Verify `app/[locale]/(dashboard)/store-settings/tables/page.tsx` — confirm `<Table>` is wrapped in `<div className="overflow-x-auto">` inside `<CardContent>`. ✅ Already present — visual verify only; apply the wrap if somehow missing.

- [x] T015 [P] [US3] Verify `app/[locale]/(dashboard)/store-settings/logs/page.tsx` — confirm `<Table>` is wrapped in `<div className="overflow-x-auto">` inside `<CardContent>`. ✅ Already present — visual verify only; apply the wrap if somehow missing.

- [x] T016 [P] [US3] Verify `app/[locale]/(dashboard)/store-settings/branches/page.tsx` — confirm root `<div>` has `min-w-0` class. ✅ Already present — visual verify only; apply if missing.

- [x] T017 [P] [US3] Verify `app/[locale]/(dashboard)/store-settings/qr-code/page.tsx` — confirm the `<div ref={qrRef}>` wrapper has `className` containing `[&_canvas]:max-w-full [&_canvas]:h-auto [&_svg]:max-w-full [&_svg]:h-auto`, and its container has `overflow-hidden`. ✅ Already present — visual verify only; apply if missing.

**Checkpoint**: Open each of the four pages at 390 px viewport. Zero horizontal scrollbar. Tables scroll within their cards.

---

## Phase 6: User Story 4 — Offline Badge Positioned in Header (Priority: P4)

**Goal**: The offline status indicator is flush below the header row with no large gap and does not overlap page content.

**Independent Test**: Enable DevTools offline mode. Navigate any dashboard page at 390 px. Offline badge appears immediately below header, toolbar and breadcrumbs are unobscured.

- [x] T018 [US4] Investigate `components/pwa/offline-progress-bar.tsx` and `components/layout/header.tsx` (and any layout component that renders an "offline" message) — identify every component that shows a banner, badge, or notification when `isOffline === true`. Document what each renders and where it is positioned (fixed, absolute, or in-flow).

- [x] T019 [US4] Fix offline badge positioning based on T018 findings — ensure the single offline indicator is `absolute bottom-0 inset-x-0` inside the fixed `<header>` element. If a separate floating offline banner exists outside the header (e.g. a toast, a fixed `div`, or an in-flow alert), either remove it (if the progress bar badge already communicates the offline state) or move it inside the header. Ensure the header's height variable accounts for the badge sub-bar so toolbar content below is not obscured.

**Checkpoint**: Enable offline mode. Thin badge strip at header's bottom edge, no gap, toolbar unobscured. Returns to normal when online.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T020 [P] Verify `hooks/use-page-precache.ts` has an entry for `/store-settings/qr-code` in `ROUTE_API_ENDPOINTS` with the correct API endpoints listed — add entry `() => []` if the page has no cacheable GET routes, or list the shop profile endpoint it calls.

- [x] T021 [P] Verify `CLAUDE.md` "Mobile / no horizontal scroll" rules section includes the `<Table>` → `overflow-x-auto` wrapper rule and the `[&_canvas]:max-w-full` canvas rule — add them if missing.

- [x] T022 Run `npx tsc --noEmit` and confirm zero TypeScript errors across all new and modified files (`config.ts`, `composit.ts`, `route.ts`, `page.tsx`, `template-picker.tsx`).

- [x] T023 Run `pnpm build` and confirm zero build errors. Check that the API route at `app/api/qr-template/route.ts` compiles correctly under Next.js App Router.

- [ ] T024 Visual QR verification — download one SVG per template (all four), open each in a browser or SVG viewer, scan every QR code with a phone → confirm each scans to the correct shop URL and that the template artwork (background, Ordrat footer) is unchanged.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ✅ Complete
  └──► Phase 2 (Foundational: T007 → T008 + T009)
         └──► Phase 3 (US1: T010)
                └──► Phase 4 (US2: T011 → T012, T013)

Phase 5 (US3: T014–T017)  ← INDEPENDENT — verify only, no blocking dependencies
Phase 6 (US4: T018–T019)  ← INDEPENDENT — no blocking dependencies

Phase 7 (Polish) ← After all phases complete
```

### User Story Dependencies

- **US1 (P1)**: Requires Phase 2 (T007 + T008 + T009) complete
- **US2 (P2)**: Requires Phase 2 complete (needs `QR_TEMPLATES` from updated config.ts)
- **US3 (P3)**: No dependencies — verify only
- **US4 (P4)**: No dependencies — layout-only

### Within Phase 2 (Critical Path)

```
T007 (simplify config.ts)
  └──► T008 (API route — imports nothing from config.ts, but logically follows)
  └──► T009 (rewrite composit.ts — imports TemplateConfig from updated config.ts)
```

T008 and T009 touch different files and can run in parallel after T007.

### Parallel Opportunities

Once Phase 2 is complete, the following can run simultaneously:
- T010 (US1) + T013 (US2 verify) + T014–T017 (US3 verifies) + T018 (US4 investigate)
- T011 and T012 are sequential (T012 modifies the output of T011)

---

## Parallel Example: Phase 2 Core

```text
After T007 completes:
  Task T008: app/api/qr-template/route.ts  — create API route
  Task T009: lib/qr-templates/composit.ts  — rewrite client orchestrator
  (Both touch different files — safe to run in parallel)
```

---

## Implementation Strategy

### MVP (US1 + US2 Core)

1. **Phase 2**: Simplify config.ts + create API route + rewrite composit.ts (T007–T009)
2. **Phase 3**: Wire download call in page.tsx (T010)
3. **Phase 4**: Add template picker section to page.tsx (T011–T013)
4. **STOP & VALIDATE**: Download all 4 templates, scan QR codes with phone

### Incremental Delivery

1. After Phase 2 + 3: Download works (even without the picker card UI)
2. After Phase 4: Full picker UI with thumbnails and download button
3. After Phase 5: Mobile scroll verified
4. After Phase 6: Offline badge polished
5. After Phase 7: Production-ready build passes

### Notes

- `replaceQRImages` in T008 must handle multiline base64 data (the `<image>` href values span multiple lines in the SVG). Use string position search (`indexOf`), not regex, to find the closing `"` of the href — base64 contains no quote characters, so the first `"` after `xlink:href="` is guaranteed to be the closing delimiter.
- The downloaded SVG will be ~80 MB (same as the original) — no compression is applied; the file size is an inherent property of the source SVGs. Do not attempt to strip redundant background layers.
- `qr-code-styling.getRawData('png')` returns `Blob` in the browser and `Buffer` in Node.js. T009 must normalise both cases before calling `FileReader.readAsDataURL`.
- The API route reads `public/QR-templates/{id}.svg` via `process.cwd()`. The SVG files must exist locally at that path. In production, this requires a deployment strategy (Git LFS or CDN) — out of scope for this branch.
