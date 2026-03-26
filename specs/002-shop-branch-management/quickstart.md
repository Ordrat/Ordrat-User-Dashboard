# Quickstart: Shop & Branch Management

**Feature**: `002-shop-branch-management` | **Branch**: `002-shop-branch-management`

## Prerequisites

- Node.js 20+, pnpm
- `.env.local` with `BACKEND_API_URL` and `NEXT_PUBLIC_BACKEND_API_URL` pointing to `https://api.ordrat.com`
- Authenticated seller account with a shop already created

## Setup

```bash
git checkout 002-shop-branch-management
pnpm install
npm run dev
```

## Validation Steps

### 1. Sidebar Navigation
- [ ] Sign in as a seller
- [ ] Verify sidebar shows "My Shop" and "Branches" under the Store section
- [ ] Click each item — verify correct page loads

### 2. Header Toolbar
- [ ] Verify Bell icon, Language Switcher (AR/EN), Moon/Sun toggle, and Search are visible
- [ ] Click language switcher — verify UI toggles between AR and EN
- [ ] When AR is active, verify page direction switches to RTL
- [ ] Click Moon/Sun — verify theme switches between light and dark

### 3. Shop Profile Page (`/dashboard/shop`)
- [ ] Page loads and displays current shop details (pre-filled form)
- [ ] `ShopLanguage` selector shows current value
- [ ] Changing `ShopLanguage` to Arabic hides English name/description inputs
- [ ] Changing `ShopLanguage` to English hides Arabic name/description inputs
- [ ] `ShopType` selector shows Shop / SuperMarket options
- [ ] Logo upload: select image → preview updates immediately
- [ ] Cover upload: select image → preview updates immediately
- [ ] Edit a field (e.g., phone), click Save → success toast appears
- [ ] Submit empty required field → inline validation error appears, no API call

### 4. Shop Settings Page (`/dashboard/shop/settings`)
- [ ] Page loads with current settings pre-filled
- [ ] `TransactionType` selector: switch between Percentage and Flat → label updates
- [ ] `ShippingPricingMethod` selector: selecting PricePerCity shows city-price table
- [ ] Add a city-price row, fill it in, save → success toast
- [ ] Switch to Fixed → city table hides, single price input shows
- [ ] Save with PricePerCity and no city rows → validation error shown

### 5. Working Hours (on Settings page)
- [ ] All 7 days displayed with open/close toggles
- [ ] Toggle a day to "closed" → time inputs hide/disable
- [ ] Set hours for a day, save → changes persist on page reload

### 6. Branch List Page (`/dashboard/branches`)
- [ ] Page loads with list of branches (or empty state if none)
- [ ] Search box filters branches by name
- [ ] "Add Branch" button opens create dialog

### 7. Branch Create
- [ ] Fill required fields (name, phone) and save → new branch in list
- [ ] Submit empty form → validation errors shown
- [ ] Name inputs follow `ShopLanguage` rule (show only relevant language fields)

### 8. Branch Edit
- [ ] Click edit on a branch row → dialog opens pre-filled
- [ ] Change phone, save → updated in list + success toast

### 9. Branch Delete
- [ ] Click delete on a branch row → confirmation dialog appears
- [ ] Confirm → branch removed from list + success toast
- [ ] Cancel → nothing happens

### 10. Build Verification
```bash
npx tsc --noEmit    # Zero errors
npm run build        # Successful production build
```

## Troubleshooting

- **401 on page load**: Token may have expired. Sign out and sign back in.
- **Empty shop profile**: `shopId` may not be set in session. Check `session.user.shopId`.
- **Missing sidebar items**: Verify `config/layout.config.tsx` has the new menu entries.
- **RTL not switching**: Check `lib/i18n.ts` `changeLanguage()` function sets `document.documentElement.dir`.
