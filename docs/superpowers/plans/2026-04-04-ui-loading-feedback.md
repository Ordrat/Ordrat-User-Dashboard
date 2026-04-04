# UI Loading Feedback & Sidebar Hover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a brand-colored top progress bar, loading spinners on save buttons and page loading states, and change sidebar hover to light gray.

**Architecture:** Four independent changes — install one library, update root layout, find-and-replace spinner/hover patterns across 8 files. No new components needed; all use existing `LoaderCircle` from lucide-react and existing CSS tokens.

**Tech Stack:** Next.js 16 App Router, lucide-react, Tailwind CSS 4, `nextjs-toploader` (new)

---

### Task 1: Install nextjs-toploader and add to root layout

**Files:**
- Modify: `package.json` (via pnpm)
- Modify: `app/layout.tsx`

- [ ] **Step 1: Install the package**

```bash
pnpm add nextjs-toploader
```

Expected output: package added to `dependencies` in `package.json` and `pnpm-lock.yaml` updated.

- [ ] **Step 2: Add NextTopLoader to `app/layout.tsx`**

Add the import at the top of the file:
```tsx
import NextTopLoader from 'nextjs-toploader';
```

Then add the component as the **first child inside `<body>`**, before `<ThemeProvider>`:
```tsx
<body
  className="antialiased flex h-full text-base text-foreground bg-muted font-sans overflow-x-hidden"
  suppressHydrationWarning
>
  <NextTopLoader
    color="var(--brand)"
    showSpinner={false}
    height={3}
    shadow={false}
  />
  <ThemeProvider
    ...
```

- [ ] **Step 3: Verify dev server starts without errors**

```bash
pnpm dev
```

Navigate to any store-settings page, then click a sidebar link — a thin red bar should sweep across the top of the viewport on every page transition.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx package.json pnpm-lock.yaml
git commit -m "feat: add brand-colored top progress bar on navigation"
```

---

### Task 2: Add loading spinner to save buttons — tables page

**Files:**
- Modify: `app/[locale]/(dashboard)/store-settings/tables/page.tsx`

The file already imports `Plus, Pencil, Trash2` from lucide-react. Add `LoaderCircle` to that import.

- [ ] **Step 1: Update lucide-react import**

Find line ~9:
```tsx
import { Plus, Pencil, Trash2 } from 'lucide-react';
```
Change to:
```tsx
import { Plus, Pencil, Trash2, LoaderCircle } from 'lucide-react';
```

- [ ] **Step 2: Update the Add Table dialog save button**

Find the save button in the Add Table dialog (around line 371). Current code:
```tsx
{createTable.isPending ? t('actions.saving') : t('actions.save')}
```
Replace the entire `<Button>` for that submit with:
```tsx
<Button type="submit" disabled={createTable.isPending}>
  {createTable.isPending && <LoaderCircle className="size-4 animate-spin" />}
  {createTable.isPending ? t('actions.saving') : t('actions.save')}
</Button>
```

- [ ] **Step 3: Update the Edit Table dialog save button**

Find the save button in the Edit Table dialog (around line 397). Same pattern:
```tsx
<Button type="submit" disabled={updateTable.isPending}>
  {updateTable.isPending && <LoaderCircle className="size-4 animate-spin" />}
  {updateTable.isPending ? t('actions.saving') : t('actions.save')}
</Button>
```

- [ ] **Step 4: Commit**

```bash
git add app/[locale]/\(dashboard\)/store-settings/tables/page.tsx
git commit -m "feat: add spinner to tables page save buttons"
```

---

### Task 3: Add loading spinner to save buttons — payment-gateways and contact-info

**Files:**
- Modify: `app/[locale]/(dashboard)/store-settings/payment-gateways/page.tsx`
- Modify: `app/[locale]/(dashboard)/store-settings/contact-info/page.tsx`

- [ ] **Step 1: Update payment-gateways save button**

Open `app/[locale]/(dashboard)/store-settings/payment-gateways/page.tsx`.

Add `LoaderCircle` to the lucide-react import at the top of the file.

Find the save button (around line 234) — current pattern:
```tsx
{isPending ? t('actions.saving') : t('actions.save')}
```
Replace the entire save `<Button>` with:
```tsx
<Button type="submit" disabled={isPending}>
  {isPending && <LoaderCircle className="size-4 animate-spin" />}
  {isPending ? t('actions.saving') : t('actions.save')}
</Button>
```

- [ ] **Step 2: Update contact-info save button**

Open `app/[locale]/(dashboard)/store-settings/contact-info/page.tsx`.

Add `LoaderCircle` to the lucide-react import.

Find the save button (around line 584) — same pattern, replace with:
```tsx
<Button type="submit" disabled={isPending}>
  {isPending && <LoaderCircle className="size-4 animate-spin" />}
  {isPending ? t('actions.saving') : t('actions.save')}
</Button>
```

- [ ] **Step 3: Commit**

```bash
git add "app/[locale]/(dashboard)/store-settings/payment-gateways/page.tsx" \
        "app/[locale]/(dashboard)/store-settings/contact-info/page.tsx"
git commit -m "feat: add spinner to payment-gateways and contact-info save buttons"
```

---

### Task 4: Add loading spinner to save button — change-password auth page

**Files:**
- Modify: `app/[locale]/(auth)/change-password/page.tsx`

- [ ] **Step 1: Update the submit button**

Open `app/[locale]/(auth)/change-password/page.tsx`.

Add `LoaderCircle` to the lucide-react import.

Find the submit button (around line 156) — current code:
```tsx
{isSubmitting ? t('actions.saving') : t('auth.setNewPassword')}
```
Replace the `<Button>` with:
```tsx
<Button type="submit" disabled={isSubmitting} className="w-full auth-brand-button">
  {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
  {isSubmitting ? t('actions.saving') : t('auth.setNewPassword')}
</Button>
```

- [ ] **Step 2: Commit**

```bash
git add "app/[locale]/(auth)/change-password/page.tsx"
git commit -m "feat: add spinner to change-password submit button"
```

---

### Task 5: Replace "Saving…" page loading text with brand spinner

**Files:**
- Modify: `app/[locale]/(dashboard)/store-settings/tables/page.tsx`
- Modify: `app/[locale]/(dashboard)/store-settings/payment-gateways/page.tsx`
- Modify: `app/[locale]/(dashboard)/store-settings/qr-code/page.tsx`
- Modify: `app/[locale]/(dashboard)/store-settings/logs/page.tsx`
- Modify: `app/[locale]/(dashboard)/store-settings/contact-info/page.tsx`

The replacement target is the **data loading placeholder** pattern — a `div` that shows `t('actions.saving')` while an API query is in progress (not a button label).

**Replacement pattern** (use this exact JSX in all cases):
```tsx
<div className="p-10 flex justify-center">
  <LoaderCircle className="size-6 animate-spin text-brand" />
</div>
```

- [ ] **Step 1: Update tables/page.tsx loading states**

There are two instances in this file:

Instance 1 — branches loading (around line 271):
```tsx
{branchesLoading ? t('actions.saving') : t('tables.selectBranchPrompt')}
```
Change to:
```tsx
{branchesLoading ? (
  <div className="p-10 flex justify-center">
    <LoaderCircle className="size-6 animate-spin text-brand" />
  </div>
) : t('tables.selectBranchPrompt')}
```

Instance 2 — tables loading (around line 274):
```tsx
<div className="p-6 text-center text-muted-foreground">{t('actions.saving')}</div>
```
Change to:
```tsx
<div className="p-10 flex justify-center">
  <LoaderCircle className="size-6 animate-spin text-brand" />
</div>
```

`LoaderCircle` is already imported from Task 2.

- [ ] **Step 2: Update payment-gateways/page.tsx loading state**

Find (around line 198):
```tsx
<div className="text-center text-muted-foreground py-16">{t('actions.saving')}</div>
```
Change to:
```tsx
<div className="p-10 flex justify-center">
  <LoaderCircle className="size-6 animate-spin text-brand" />
</div>
```

`LoaderCircle` is already imported from Task 3.

- [ ] **Step 3: Update qr-code/page.tsx loading state**

Open the file. Add `LoaderCircle` to its lucide-react import.

Find (around line 215):
```tsx
return <div className="p-6 text-muted-foreground">{t('actions.saving')}</div>;
```
Change to:
```tsx
return (
  <div className="p-10 flex justify-center">
    <LoaderCircle className="size-6 animate-spin text-brand" />
  </div>
);
```

- [ ] **Step 4: Update logs/page.tsx loading state**

Open the file. Add `LoaderCircle` to its lucide-react import.

Find (around line 150):
```tsx
<div className="p-6 text-center text-muted-foreground">{t('actions.saving')}</div>
```
Change to:
```tsx
<div className="p-10 flex justify-center">
  <LoaderCircle className="size-6 animate-spin text-brand" />
</div>
```

- [ ] **Step 5: Update contact-info/page.tsx loading state**

Find (around line 393):
```tsx
<div className="text-muted-foreground">{t('actions.saving')}</div>
```
Change to:
```tsx
<div className="p-10 flex justify-center">
  <LoaderCircle className="size-6 animate-spin text-brand" />
</div>
```

`LoaderCircle` is already imported from Task 3.

- [ ] **Step 6: Commit**

```bash
git add "app/[locale]/(dashboard)/store-settings/tables/page.tsx" \
        "app/[locale]/(dashboard)/store-settings/payment-gateways/page.tsx" \
        "app/[locale]/(dashboard)/store-settings/qr-code/page.tsx" \
        "app/[locale]/(dashboard)/store-settings/logs/page.tsx" \
        "app/[locale]/(dashboard)/store-settings/contact-info/page.tsx"
git commit -m "feat: replace Saving text with brand spinner on page loading states"
```

---

### Task 6: Change sidebar hover to light gray

**Files:**
- Modify: `components/layout/sidebar-primary-menu.tsx`
- Modify: `components/layout/sidebar-resources-menu.tsx`
- Modify: `components/layout/sidebar-store-menu.tsx`
- Modify: `components/layout/sidebar-primary.tsx`

Replace `hover:bg-gray-700 hover:text-white` → `hover:bg-muted hover:text-foreground`
Replace `focus-visible:bg-gray-700 focus-visible:text-white` → `focus-visible:bg-muted focus-visible:text-foreground`

- [ ] **Step 1: Update sidebar-primary-menu.tsx**

Open `components/layout/sidebar-primary-menu.tsx`.

Find in the `classNames.item` string (line ~37):
```
hover:bg-gray-700 hover:text-white focus-visible:bg-gray-700 focus-visible:text-white
```
Replace with:
```
hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground
```

- [ ] **Step 2: Update sidebar-resources-menu.tsx**

Open `components/layout/sidebar-resources-menu.tsx`.

Find in the `classNames.item` string (line ~39):
```
hover:bg-gray-700 hover:text-white focus-visible:bg-gray-700 focus-visible:text-white
```
Replace with:
```
hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground
```

- [ ] **Step 3: Update sidebar-store-menu.tsx**

Open `components/layout/sidebar-store-menu.tsx`.

Find in the `classNames.item` string (line ~41):
```
hover:bg-gray-700 hover:text-white focus-visible:bg-gray-700 focus-visible:text-white
```
Replace with:
```
hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground
```

- [ ] **Step 4: Update sidebar-primary.tsx icon buttons**

Open `components/layout/sidebar-primary.tsx`.

Find the icon button className (line ~157):
```
'hover:bg-gray-700 hover:text-white',
'focus-visible:bg-gray-700 focus-visible:text-white',
```
Replace with:
```
'hover:bg-muted hover:text-foreground',
'focus-visible:bg-muted focus-visible:text-foreground',
```

- [ ] **Step 5: Commit**

```bash
git add components/layout/sidebar-primary-menu.tsx \
        components/layout/sidebar-resources-menu.tsx \
        components/layout/sidebar-store-menu.tsx \
        components/layout/sidebar-primary.tsx
git commit -m "feat: change sidebar hover to light gray using muted token"
```

---

### Task 7: Type-check and verify

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors. If errors appear, they will be in the modified files — check that `LoaderCircle` is imported in each file that uses it.

- [ ] **Step 2: Visual verification checklist**

Start dev server: `pnpm dev`

- Navigate between pages → red progress bar sweeps top of viewport
- Open Tables page → brand spinner appears while data loads (no "Saving..." text)
- Click Add Table → fill form → click Save → spinner appears on button
- Hover over sidebar items → light gray highlight (not dark)
- Hover over primary sidebar icons → light gray highlight
