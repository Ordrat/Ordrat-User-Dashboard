# Quickstart: Migrate Authentication System

**Feature**: 001-migrate-auth
**Date**: 2026-03-18

This guide validates that the auth migration is working correctly in a local environment.

---

## Prerequisites

1. Node.js 16+ installed
2. `.env.local` at project root (see below)
3. Access to the Ordrat .NET backend (test environment)

---

## Environment Setup

Add to `.env.local`:

```bash
# Ordrat .NET backend (server-only — never NEXT_PUBLIC_)
BACKEND_API_URL=https://testapi.ordrat.com

# NextAuth
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
```

---

## Start Dev Server

```bash
npm run dev
```

---

## Validation Steps

### 1. Unauthenticated Route Protection

Open `http://localhost:3000/` in an incognito window.

**Expected**: Immediately redirected to `http://localhost:3000/signin`
(no flash of dashboard content).

---

### 2. Sign In — Valid Credentials

1. Go to `http://localhost:3000/signin`
2. Enter a valid seller email and password
3. Click **Continue**

**Expected**:
- Spinner shows while request is in flight
- No error alert appears
- Browser redirects to `http://localhost:3000/` (dashboard home)
- User name and/or shop info appears in the layout header

---

### 3. Sign In — Invalid Credentials

1. Go to `http://localhost:3000/signin`
2. Enter any email + wrong password
3. Click **Continue**

**Expected**:
- Error alert appears with a readable message ("Invalid email or password" or similar)
- User remains on the sign-in page
- No redirect

---

### 4. Sign In — Empty Fields

1. Go to `http://localhost:3000/signin`
2. Leave email and password blank
3. Click **Continue**

**Expected**:
- Inline validation errors appear under both fields
- No network request is made (check browser DevTools Network tab — no calls to `/api/auth/callback/credentials`)

---

### 5. Session Persistence on Reload

After signing in successfully:
1. Reload the page (`Cmd+R` / `Ctrl+R`)

**Expected**: User remains on the dashboard without being redirected to sign-in.

---

### 6. Token Refresh (Manual Test)

This requires a backend environment where you can control token TTL, or:
1. Sign in and note the session is active
2. In DevTools → Application → Cookies, find the `next-auth.session-token` cookie
3. Wait for the configured access token TTL to pass
4. Navigate to any protected route

**Expected**: Page loads normally without sign-in prompt (refresh happened transparently).

---

### 7. Role-Based Access — Insufficient Role

1. Sign in as a user who does NOT have a specific role (e.g., `sellerDashboard-store`)
2. Navigate directly to the route guarded by that role

**Expected**: Redirected to `/unauthorized` page.

---

### 8. Sign Out

1. Sign in and navigate to the dashboard
2. Click the sign-out action (in the user menu)

**Expected**:
- All auth cookies are cleared
- User lands on `/signin`
- Pressing browser back button redirects back to `/signin`

---

### 9. Build Check

```bash
npm run lint && npm run build
```

**Expected**: Zero errors. Any TypeScript error in auth files is a blocker.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Redirect loop on signin page | `NEXTAUTH_URL` mismatch | Verify env var matches `localhost:3000` |
| "BACKEND_API_URL is not defined" error | Missing env var | Add to `.env.local` |
| 401 immediately after login | Access token from backend is already invalid | Check backend environment / clock skew |
| Network error on login | Backend unreachable | Verify `BACKEND_API_URL` is correct and reachable |
| Session lost on reload | `NEXTAUTH_SECRET` changed between restarts | Use a stable secret value |
