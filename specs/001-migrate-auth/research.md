# Research: Migrate Authentication System

**Feature**: 001-migrate-auth
**Date**: 2026-03-18

---

## Decision 1: Auth Architecture — NextAuth Credentials Provider vs. Bypass

**Decision**: Keep NextAuth v4 as the auth layer. Update the Credentials provider
`authorize()` to call the .NET backend instead of checking a hardcoded demo user.
Do NOT bypass NextAuth.

**Rationale**:
- The new project already has NextAuth wired (SessionProvider, `/api/auth/[...nextauth]`
  route, and `useSession()` in the protected layout).
- Constitution Principle III explicitly requires: "Auth session access MUST go through
  `@auth/core` / `next-auth` helpers; manual JWT parsing in components is forbidden."
- NextAuth's JWT strategy handles secure cookie storage, CSRF protection, and session
  serialization — duplicating this with raw cookies would violate the constitution.
- The old repo's cookie-based bypass was an anti-pattern for this codebase.

**Alternatives considered**:
- Mirror old repo exactly (raw cookies + custom Axios auth): Rejected — violates
  Constitution Principle III.
- Replace NextAuth with a custom solution: Rejected — overkill, removes CSRF
  protection, and requires a constitution amendment.

---

## Decision 2: Access Token Refresh Strategy

**Decision**: Store `accessToken`, `refreshToken`, and `accessTokenExpiresAt`
inside the NextAuth JWT. In the `jwt()` callback, check if the access token is
within 60 seconds of expiry. If so, call the .NET
`POST /api/Auth/RefreshAccessToken` endpoint and update the stored tokens.

**Rationale**:
- This is the standard NextAuth pattern for integrating external auth providers.
- Server-side refresh (inside the `jwt` callback) means refresh happens before
  the session is handed to the client — no client-side 401 needed for normal use.
- The 60-second buffer prevents edge cases where the token expires between the
  refresh check and the actual API call.
- A client-side Axios interceptor is still needed as a fallback for long-running
  client sessions where the NextAuth JWT itself may not re-run between requests.

**Alternatives considered**:
- Client-only refresh via Axios interceptor: Rejected — doesn't protect SSR
  routes and server components.
- Refresh on every request in middleware: Rejected — too expensive; middleware
  runs on every edge request.

**Token refresh request format** (from old repo):
```
POST /api/Auth/RefreshAccessToken
Headers: { refreshToken: "<token>", Content-Type: "application/json" }
```
Note: `refreshToken` is sent as a **header**, not in the request body.

---

## Decision 3: Route Protection — Middleware vs. Client-Side Guard

**Decision**: Replace the current client-side `useEffect`-based guard in
`app/(protected)/layout.tsx` with a proper `middleware.ts` at the project root.
The middleware uses NextAuth's `getToken()` to check the session server-side.

**Rationale**:
- The current approach (redirect inside `useEffect`) causes a flash of protected
  content before the redirect, which is both a UX issue and a potential data leak.
- A Next.js middleware runs at the edge before the page renders — no content flash.
- Constitution Principle III requires server-side session handling.
- NextAuth provides `getToken({ req, secret })` which works in edge middleware
  without a full server-side session fetch.

**Public routes** (no auth check): `/signin`, `/signup`, `/reset-password`,
`/change-password`, `/verify-email`, and any `/auth/*` sub-routes.

**Alternatives considered**:
- Middleware + keep the `useSession` guard as a double-check: Keep the
  `useSession` check in the layout for loading state UX but remove the redirect
  (middleware handles the actual redirect).

---

## Decision 4: Role-Based Access Control

**Decision**: Define a `routeRoles` map in `config/roles.ts` mapping URL path
prefixes to required role strings. Middleware checks the user's roles (stored in
the NextAuth JWT) against this map. If a match fails, redirect to `/unauthorized`.

**Rationale**:
- Mirrors the architecture from the old repo (which had a `routeRoles` map in
  `proxy.ts`), adapted for NextAuth tokens.
- Centralized role config makes it easy to add/remove route permissions without
  touching middleware logic.
- Role strings come from the .NET backend; the frontend only stores and checks them.

**Filtered roles approach**: The old repo filtered backend roles through a known
`dataMap` of ~50 permission strings. This filtering is kept: only recognized
permission strings are stored in the session. Unknown roles are silently discarded.

---

## Decision 5: Session Data Storage

**Decision**: Store the following fields inside the NextAuth JWT (and expose them
via the session callback):

| Field | Source | Notes |
|---|---|---|
| `accessToken` | Login response | Bearer token for .NET API calls |
| `refreshToken` | Login response | Used to renew access token |
| `accessTokenExpiresAt` | Computed (login time + estimated TTL) | For proactive refresh |
| `shopId` | Login response | Required for all shop-specific API calls |
| `sellerId` | Login response (`id`) | User identifier |
| `name` | Login response | `firstName + ' ' + lastName` |
| `email` | Login response | User email |
| `roles` | Login response (filtered) | Array of permission strings |
| `branches` | Login response | Array of branch objects |
| `mainBranchId` | Derived from branches | ID of branch with `isMain: true` |
| `userType` | Login response | User type string |
| `subdomain` | Login response | Shop subdomain |

**What is NOT stored**: Raw password, FCM tokens (ephemeral).

---

## Decision 6: API Client for Dashboard API Calls

**Decision**: Create `lib/api-client.ts` — an Axios instance that:
1. Reads `accessToken` from the NextAuth session (client-side) or from the
   NextAuth JWT (server-side actions/RSCs).
2. Attaches `Authorization: Bearer <token>` to every request.
3. Intercepts 401 responses, triggers `update()` from `useSession` to force a
   NextAuth JWT refresh, then retries the original request.
4. On second 401 (refresh failed), calls `signOut()` and redirects to `/signin`.

**Rationale**:
- Centralizes API configuration — all dashboard API calls use this client.
- Constitution Principle II requires typed responses; this client can be paired
  with typed response interceptors.

---

## Decision 7: Backend URL Configuration

**Decision**: Read the backend base URL from `process.env.BACKEND_API_URL`
(server-side only). Never hardcode. Never use a `NEXT_PUBLIC_` prefix for the
backend URL (would expose it in the client bundle).

**Old repo anti-pattern**: Had `API_BASE_URL = 'https://testapi.ordrat.com'`
hardcoded in `src/config/base-url.ts`. This is corrected here per Constitution
Principle III (no secrets in client bundles) and good practice.

**Required env vars**:
```
BACKEND_API_URL=https://testapi.ordrat.com   # server-only
NEXTAUTH_SECRET=<strong-random-secret>
NEXTAUTH_URL=http://localhost:3000
```

---

## Decision 8: Sign-in Page Changes

**Decision**: Minimal changes to the existing sign-in page. Remove:
- The "Use demo@kt.com / demo123" info alert
- The hardcoded default values (`demo@kt.com`, `demo123`)
- The Google sign-in button (out of scope for this migration)

Keep:
- The form structure (React Hook Form + Zod — already correct)
- The `signIn('credentials', { redirect: false })` call pattern
- The error display and loading state

**Rationale**: The page already follows the right pattern. Only the demo-specific
content needs to be removed. Changing the auth logic happens entirely in
`auth-options.ts`, not in the page.
