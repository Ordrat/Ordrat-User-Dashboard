# Tasks: Migrate Authentication System

**Input**: Design documents from `specs/001-migrate-auth/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**Note on Next.js 15+**: This project uses Next.js 15.3.x which adopts the new
`proxy.ts` convention for route interception (instead of `middleware.ts`). The
exported function is named `proxy` and uses `config.matcher` identically to
the old middleware pattern. See Context7 docs for reference.

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks grouped by user story. US1 + US2 are both P1; US2 builds
on the `auth-options.ts` modified in US1 (sequential), everything else is parallel.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)

---

## Phase 1: Setup

**Purpose**: Environment and type declarations — required before any implementation.

- [x] T001 Add `BACKEND_API_URL=https://testapi.ordrat.com` to `.env.local`; verify `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are present
- [x] T002 [P] Create `types/next-auth.d.ts` — extend `JWT` (add `accessToken`, `refreshToken`, `accessTokenExpiresAt`, `shopId`, `sellerId`, `roles`, `branches`, `mainBranchId`, `userType`, `subdomain`, `error?: 'RefreshAccessTokenError'`) and extend `Session` (expose `user.id`, `user.shopId`, `user.roles`, `user.branches`, `user.mainBranchId`, `user.userType`, `user.subdomain`, top-level `accessToken`, `error`) per data-model.md interfaces

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core API functions and role config that all user story phases depend on.

⚠️ **CRITICAL**: No user story implementation can begin until this phase is complete.

- [x] T003 Create `lib/ordrat-api/schemas.ts` — define `BranchSchema` and `LoginResponseSchema` (+ `RefreshResponseSchema` with same shape) as Zod schemas using `.passthrough()` on Branch; export `LoginResponseType` and `RefreshResponseType` inferred types; match field names exactly from contracts/backend-auth-api.md
- [x] T004 Create `lib/ordrat-api/auth.ts` — implement `loginWithCredentials(email: string, password: string): Promise<LoginResponseType>` that POSTs to `${process.env.BACKEND_API_URL}/api/Auth/Login` using native `fetch`, validates response with `LoginResponseSchema.parse()`, and throws typed errors for 401/404/500; implement `refreshAccessToken(refreshToken: string): Promise<RefreshResponseType>` that POSTs to `${process.env.BACKEND_API_URL}/api/Auth/RefreshAccessToken` with `refreshToken` as a **header** (not body), validates with `RefreshResponseSchema.parse()` (depends T003)
- [x] T005 [P] Create `config/roles.ts` — define `KNOWN_ROLES` array with the full permission list from the old repo (fetch and copy all ~50 strings from the `dataMap` in `Galal-Elsayed/Ordrat-Old-Dashboard`'s `AllRolles.tsx`); define `ROUTE_ROLES: Record<string, string[]>` mapping path prefixes to required role arrays (copy from old repo's `routeRoles` in `proxy.ts`); export `filterKnownRoles(roles: string[]): string[]` helper; export `userHasRouteAccess(userRoles: string[], pathname: string): boolean` helper

**Checkpoint**: Foundational complete — `loginWithCredentials()`, `refreshAccessToken()`, and role helpers are ready.

---

## Phase 3: User Story 1 — Sign In (Priority: P1) 🎯 MVP

**Goal**: Real credentials against the .NET backend replace the hardcoded demo user.

**Independent Test**: Visit `/signin`, enter valid seller credentials → lands on dashboard. Enter wrong credentials → error message shown. Leave fields blank → inline validation (no network call).

### Implementation for User Story 1

- [x] T006 [US1] Update `app/api/auth/[...nextauth]/auth-options.ts` — in `authorize()`: call `loginWithCredentials(credentials.email, credentials.password)` from `lib/ordrat-api/auth.ts`; if `shopId` is empty redirect to the seller-setup URL (throw error with redirect URL); on success return a user object with all fields (`accessToken`, `refreshToken`, `shopId`, `id` as `sellerId`, `firstName`, `lastName`, `email`, `roles`, `branches`, `userType`, `subdomain`); in `jwt()` callback: on `trigger === 'signIn'` populate all custom JWT fields from the user object, compute `accessTokenExpiresAt = Date.now() + 55 * 60 * 1000` (conservative 55-min estimate); in `session()` callback: map all JWT fields to `session.user.*` and `session.accessToken`; remove `GoogleProvider` and all demo user code (depends T004, T002)
- [x] T007 [P] [US1] Update `app/(auth)/signin/page.tsx` — remove the demo-credentials `<Alert>` block; remove the Google sign-in `<Button>` and the "or" divider; remove hardcoded `defaultValues` (`demo@kt.com`, `demo123`); keep all form fields, validation, error display, loading state, and the `signIn('credentials', { redirect: false })` call unchanged

**Checkpoint**: US1 complete — real login works, demo content removed.

---

## Phase 4: User Story 2 — Token Refresh (Priority: P1)

**Goal**: Expired access tokens are silently renewed; expired refresh tokens sign the user out.

**Independent Test**: After signing in, simulate an expired access token (set `accessTokenExpiresAt` to past in dev); navigate to any protected page — page loads without sign-in prompt. Simulate an expired refresh token — user is redirected to `/signin`.

### Implementation for User Story 2

- [x] T008 [US2] Update `app/api/auth/[...nextauth]/auth-options.ts` jwt() callback — add refresh branch: `if (Date.now() < token.accessTokenExpiresAt - 60_000) return token;` (still valid); otherwise call `refreshAccessToken(token.refreshToken)` from `lib/ordrat-api/auth.ts`; on success update `token.accessToken`, `token.refreshToken`, `token.accessTokenExpiresAt`, `token.roles`, `token.branches`; on failure set `token.error = 'RefreshAccessTokenError'` and return token (NextAuth will clear session on next request); handle network errors as fail-open (return existing token without setting error) (depends T006)
- [x] T009 [P] [US2] Create `lib/api-client.ts` — create an Axios instance with `baseURL` from `process.env.NEXT_PUBLIC_BACKEND_API_URL` (note: a `NEXT_PUBLIC_` copy needed for client-side; server-side calls use `BACKEND_API_URL`); add request interceptor to attach `Authorization: Bearer <accessToken>` from the NextAuth client session; add response interceptor: on 401 call `getSession()` to force session refresh then retry the original request once; on second 401 call `signOut({ callbackUrl: '/signin' })`; export as `apiClient`

---

## Phase 5: User Story 3 — Route Protection & Role-Based Access (Priority: P2)

**Goal**: Unauthenticated users cannot reach protected routes; users lacking a role are shown the unauthorized page — all enforced server-side before any content renders.

**Independent Test**: In incognito, navigate to `/` → redirected to `/signin` with no content flash. Sign in as a user missing `sellerDashboard-store` role, navigate to `/store-admin` → redirected to `/unauthorized`.

### Implementation for User Story 3

- [x] T010 [US3] Create `proxy.ts` at project root — use Next.js 15 convention: `export default async function proxy(req: NextRequest)`; read the NextAuth session with `getToken({ req, secret: process.env.NEXTAUTH_SECRET })`; define `PUBLIC_PATHS = ['/signin', '/signup', '/reset-password', '/change-password', '/verify-email']` and match against `req.nextUrl.pathname`; if path is public and user is authenticated, redirect to `/`; if path is protected and no token, redirect to `/signin`; if path is protected and `token.error === 'RefreshAccessTokenError'`, redirect to `/signin`; call `userHasRouteAccess(token.roles, pathname)` from `config/roles.ts` and redirect to `/unauthorized` on failure; export `config.matcher` to exclude `api`, `_next/static`, `_next/image`, and static file extensions (depends T005, T008)
- [x] T011 [P] [US3] Create `app/(protected)/unauthorized/page.tsx` — simple server component showing "You don't have permission to view this page" with a link back to `/` (follows existing ReUI component patterns; no `"use client"` needed)
- [x] T012 [P] [US3] Update `app/(protected)/layout.tsx` — remove the `useEffect` that calls `router.push('/signin')` when `status === 'unauthenticated'` (route protection is now handled by `proxy.ts`); keep `useSession()` and the `<ScreenLoader />` loading state; keep the `session ? <Demo1Layout>` render guard as a fallback UI safety net only

**Checkpoint**: US3 complete — all protected routes server-guarded with no content flash.

---

## Phase 6: User Story 4 — Sign Out (Priority: P3)

**Goal**: Sign-out clears the session and redirects to `/signin`; back-button cannot return to protected pages.

**Independent Test**: Sign in → click sign-out → lands on `/signin`. Press back → redirected to `/signin` again.

### Implementation for User Story 4

- [x] T013 [US4] Update `app/components/partials/topbar/user-dropdown-menu.tsx` — change `signOut()` to `signOut({ callbackUrl: '/signin' })` to ensure redirect to the sign-in page after logout
- [x] T014 [P] [US4] Update `app/components/partials/topbar/dropdown-menu-user.tsx` — same change: `signOut()` → `signOut({ callbackUrl: '/signin' })`

**Checkpoint**: All 4 user stories complete and independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates and cleanup across all stories.

- [x] T015 Add `NEXT_PUBLIC_BACKEND_API_URL` to `.env.local` (same value as `BACKEND_API_URL`; needed by `lib/api-client.ts` client-side Axios instance from T009)
- [x] T016 [P] Update `data-model.md` "Files to Create / Modify" table — change `middleware.ts` entry to `proxy.ts`; update `plan.md` source code structure tree with same correction
- [x] T017 Run `npm run lint && npm run build` from project root; fix all TypeScript type errors in `types/next-auth.d.ts`, `auth-options.ts`, `proxy.ts`, and `lib/` files until both commands exit with code 0

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001, T002) — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Foundational (T003, T004) completion
- **US2 (Phase 4)**: Depends on US1 completion (T006 — shares `auth-options.ts`)
- **US3 (Phase 5)**: Depends on US2 completion (T008 — needs `error` field in JWT)
- **US4 (Phase 6)**: Depends on US1 completion (T006) — independent of US2/US3
- **Polish (Phase 7)**: Depends on all user stories complete

### Within Each User Story

- T006 before T008 (same file, sequential)
- T008 before T010 (proxy reads `token.error` set in T008)
- All `[P]` tasks within a phase have no intra-phase dependencies

### Parallel Opportunities

```bash
# Phase 1 — run together:
Task: T001  # .env.local
Task: T002  # types/next-auth.d.ts

# Phase 2 — run T003 first, then T004 + T005 together:
Task: T004  # lib/ordrat-api/auth.ts  (after T003)
Task: T005  # config/roles.ts         (after T001, independent of T003/T004)

# Phase 3 — run together:
Task: T006  # auth-options.ts authorize()
Task: T007  # signin/page.tsx cleanup

# Phase 4 — run together:
Task: T008  # auth-options.ts jwt() refresh
Task: T009  # lib/api-client.ts

# Phase 5 — run together:
Task: T010  # proxy.ts
Task: T011  # unauthorized/page.tsx
Task: T012  # layout.tsx cleanup

# Phase 6 — run together:
Task: T013  # user-dropdown-menu.tsx
Task: T014  # dropdown-menu-user.tsx
```

---

## Implementation Strategy

### MVP (User Story 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 (real login)
4. Complete Phase 4: US2 (token refresh)
5. **STOP and VALIDATE**: Test sign-in + session persistence manually
6. Real auth works end-to-end — deploy if needed

### Full Delivery

1. MVP above
2. Phase 5: US3 (route protection + roles) — security hardening
3. Phase 6: US4 (sign-out redirect) — polish
4. Phase 7: Lint + build gate

### Notes

- `[P]` = safe to run in parallel (different files, no shared state)
- `auth-options.ts` is modified in T006 AND T008 — run these sequentially
- `proxy.ts` uses `export default function proxy()` — NOT `middleware` — per Next.js 15.3.x convention
- `BACKEND_API_URL` is server-only; `NEXT_PUBLIC_BACKEND_API_URL` is the client-side copy for Axios
- The old repo's complete `KNOWN_ROLES` list and `ROUTE_ROLES` map must be copied during T005 — do not guess role strings
