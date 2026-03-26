# PWA Manual Test Guide

## What We Built (Simple Version)

| Feature | What it means |
|---------|--------------|
| **Installable** | Users can add the dashboard to their home screen like a native app |
| **Offline pages** | If a user visited a page while online, they can still see it offline |
| **Offline banner** | A banner appears at the top when the user loses internet |
| **Auto refresh** | When internet comes back, all data refreshes automatically |
| **Update toast** | When we deploy a new version, a "New version available" toast appears |
| **Session warning** | If the JWT expires while offline, a warning badge shows (no forced logout) |
| **Cache clear on sign-out** | API cache is wiped when a user signs out (prevents data leakage) |

---

## Before Testing

```bash
npm run build
npm run start
```

Open: **http://localhost:3000**

> You MUST use the production build. Service workers don't run in `npm run dev`.

---

## Test 1 — Favicon & Tab Icon

**What to check:**

1. Open http://localhost:3000 in Chrome
2. Look at the browser tab — you should see the **Ordrat icon** (not the orange Metronic icon)
3. Check the address bar — same icon should appear there

**Pass:** Ordrat favicon in browser tab ✓

---

## Test 2 — Manifest is Valid

**Steps:**

1. Go to http://localhost:3000/en/dashboard
2. Open DevTools → **Application** tab → **Manifest**
3. Check Identity section

**Expected values:**

| Field | Value |
|-------|-------|
| Name | Ordrat Dashboard |
| Short name | Ordrat |
| Start URL | / |
| Display | standalone |
| Theme color | #4f46e5 (purple) |

**Pass:** All fields correct, no red "Syntax error" ✓

---

## Test 3 — Install Prompt (Desktop Chrome)

**Steps:**

1. Open http://localhost:3000/en/dashboard in Chrome
2. Look at the **address bar** — you should see an install icon (screen with down arrow)
3. Click it → "Install Ordrat Dashboard" dialog appears
4. Click **Install**
5. The app opens in its own standalone window (no browser chrome)

**Pass:** App installs and opens standalone ✓

> Note: The warnings about "screenshots" in DevTools are optional — they only affect the rich install UI on mobile stores, not the basic install prompt.

---

## Test 4 — Offline Banner

**Steps:**

1. Open http://localhost:3000/en/dashboard (must be running `npm start`)
2. Open DevTools → **Network** tab
3. Click the **"No throttling"** dropdown → select **"Offline"**
4. Navigate around in the app

**Expected:**

- A yellow/warning banner appears at the top of the page: "You're offline..."
- Pages that were visited before still load (from cache)
- Unvisited pages → redirected to the offline fallback screen

**Pass:** Banner appears when offline ✓

---

## Test 5 — Offline Fallback Page

**Steps (continuing from Test 4 while offline):**

1. Try to navigate to a page you've **never** visited
2. You should see the Ordrat offline fallback page with:
   - Ordrat logo
   - "You're offline" title
   - Retry button

3. Click **Retry** — page attempts to reload

**Pass:** Offline fallback page appears for uncached routes ✓

---

## Test 6 — Auto Refresh on Reconnect

**Steps:**

1. Go to http://localhost:3000/en/dashboard
2. Go offline (DevTools → Network → Offline)
3. Wait 30 seconds
4. Go back online (switch back to "No throttling")
5. Watch the **Network** tab

**Expected:**

- As soon as you go online, new API requests fire automatically (you'll see them in Network tab)
- Page data updates without you clicking anything

**Pass:** Network requests fire within 5 seconds of reconnecting ✓

---

## Test 7 — Service Worker is Active

**Steps:**

1. Open DevTools → **Application** → **Service Workers**
2. You should see `/sw.js` listed as **Active and running**

**Expected:**

| Field | Value |
|-------|-------|
| Status | ✅ activated and is running |
| Source | sw.js |
| Scope | http://localhost:3000/ |

**Pass:** SW is active ✓

---

## Test 8 — API Cache in Cache Storage

**Steps:**

1. Visit http://localhost:3000/en/shop (or any page that loads API data)
2. Open DevTools → **Application** → **Cache Storage**
3. Look for **`ordrat-api-cache`**
4. Click it — you should see GET requests to `api.ordrat.com` cached there

**Pass:** API responses stored in `ordrat-api-cache` ✓

---

## Test 9 — SW Update Toast

**Steps:**

1. Start the app with `npm run build && npm run start`
2. Open the app in browser — wait for it to load fully
3. Make any small code change (e.g., add a space in any file)
4. Run `npm run build` again (keep the browser open)
5. Run `npm run start` again on the new build

**Expected:**

- A toast appears at the bottom: **"A new version is available"** with a **"Reload"** button
- Clicking Reload activates the new service worker and refreshes the page

> You already saw this working in your screenshot! The "A new version is available / Reload" toast was visible.

**Pass:** Update toast appears and Reload works ✓

---

## Test 10 — Cache Cleared on Sign Out

**Steps:**

1. Log in and visit some pages (so API cache fills up)
2. Open DevTools → Application → Cache Storage → confirm `ordrat-api-cache` has entries
3. Click **Sign Out**
4. Open DevTools → Application → Cache Storage

**Expected:**

- `ordrat-api-cache` is **gone** (or empty) after sign-out
- This prevents the next user on the same device from seeing your data

**Pass:** Cache wiped on sign-out ✓

---

## Quick Status Check (All at Once)

Open DevTools → Application and verify:

```
Manifest          → Identity shows "Ordrat Dashboard" (no syntax errors)
Service Workers   → sw.js is "activated and running"
Cache Storage     → ordrat-api-cache exists after visiting pages
```

---

## Common Issues

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Old Metronic favicon | Browser has old cached favicon | Hard refresh: Cmd+Shift+R |
| SW not showing | Running `npm run dev` | Must use `npm run build && npm start` |
| Manifest syntax error | Middleware intercepting `/manifest.webmanifest` | Already fixed in `proxy.ts` |
| Cache empty | Haven't visited any API pages yet | Visit a few pages first |
| No install icon | Chrome security: must be HTTPS or localhost | localhost is fine — check you're on port 3000 not 3001 |
