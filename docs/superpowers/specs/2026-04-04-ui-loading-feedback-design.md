# UI Loading Feedback & Sidebar Hover Design

**Date:** 2026-04-04
**Branch:** 005-store-settings-extensions

---

## Summary

Four targeted UI polish changes to improve loading feedback and sidebar interaction:

1. Top progress bar on page navigation
2. Spinner on save buttons during mutation pending state
3. Brand-colored spinner replacing "Saving…" text during data loading
4. Light gray sidebar hover replacing dark gray

---

## 1. Top Progress Bar

**Library:** `nextjs-toploader` (new dependency, install with pnpm)

**Placement:** `app/layout.tsx` — add `<NextTopLoader />` as the first child inside `<body>`, before `{children}`.

**Config:**
```tsx
<NextTopLoader
  color="var(--brand)"
  showSpinner={false}
  height={3}
  shadow={false}
/>
```

- `color`: uses the `--brand` CSS variable (`#B91C1C`) so it stays in sync with the brand token
- `showSpinner={false}`: disables the small spinner in the corner (we have our own)
- `height={3}`: thin line, unobtrusive
- `shadow={false}`: no glow effect

---

## 2. Save Buttons — Spinner on Pending

**Pattern (matches auth signin button):**
```tsx
<Button type="submit" disabled={isPending}>
  {isPending && <LoaderCircle className="size-4 animate-spin" />}
  {isPending ? t('actions.saving') : t('actions.save')}
</Button>
```

**Files to update:**
- `app/[locale]/(dashboard)/store-settings/tables/page.tsx` — add dialog (line ~371) and edit dialog (line ~397)
- `app/[locale]/(dashboard)/store-settings/payment-gateways/page.tsx` — save button (line ~234)
- `app/[locale]/(dashboard)/store-settings/contact-info/page.tsx` — save button (line ~584)
- `app/[locale]/(auth)/change-password/page.tsx` — submit button (line ~156)

**Import:** `LoaderCircle` from `lucide-react` (already used in signin page).

---

## 3. Page Loading State — Brand Spinner

Replace all instances of `t('actions.saving')` used as a **data loading placeholder** (not button label) with a centered brand spinner.

**Replacement pattern:**
```tsx
<div className="p-10 flex justify-center">
  <LoaderCircle className="size-6 animate-spin text-brand" />
</div>
```

**Files to update:**
- `app/[locale]/(dashboard)/store-settings/tables/page.tsx` — branches loading (line ~271) and tables loading (line ~274)
- `app/[locale]/(dashboard)/store-settings/payment-gateways/page.tsx` — loading state (line ~198)
- `app/[locale]/(dashboard)/store-settings/qr-code/page.tsx` — loading state (line ~215)
- `app/[locale]/(dashboard)/store-settings/logs/page.tsx` — loading state (line ~150)
- `app/[locale]/(dashboard)/store-settings/contact-info/page.tsx` — loading state (line ~393)

---

## 4. Sidebar Hover — Light Gray

**Current:** `hover:bg-gray-700 hover:text-white` (dark, high-contrast)
**New:** `hover:bg-muted hover:text-foreground` (soft gray, adapts to light/dark mode)

**Why `bg-muted`:** It uses the existing `--muted` CSS token — a desaturated background gray that is already used throughout the app for subtle surfaces. It won't look sharp and adapts to dark mode automatically.

**Files to update:**
- `components/layout/sidebar-primary-menu.tsx` — `classNames.item` (line ~37)
- `components/layout/sidebar-resources-menu.tsx` — `classNames.item` (line ~39)
- `components/layout/sidebar-store-menu.tsx` — `classNames.item` (line ~41)
- `components/layout/sidebar-primary.tsx` — icon button `className` (line ~157-158)

Also remove `focus-visible:bg-gray-700 focus-visible:text-white` from the same locations, replacing with `focus-visible:bg-muted focus-visible:text-foreground`.

---

## Out of Scope

- No changes to the `ScreenLoader` component (used for auth session loading, separate concern)
- No changes to existing skeleton/shimmer patterns
- No new i18n keys needed
- No changes to toast or confirm dialog behavior
