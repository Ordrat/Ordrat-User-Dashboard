# Ordrat Dashboard — Development Guidelines

## Project

Next.js 16.x / React 19 / Tailwind CSS 4 seller dashboard. Backend is a **.NET API** (`https://api.ordrat.com`) — this is **frontend-only**. No full-stack, no Prisma for business logic.

**API source**: All endpoint contracts come from the Swagger docs at `https://api.ordrat.com/index.html`. This is the single source of truth for API shapes, request bodies, and response structures.

## Reusable UI Components

This project is a **monorepo with a rich shared component library**. **NEVER build UI components from scratch** — always check `components/ui/` first and use existing components for any UI need (buttons, inputs, alerts, toasts, OTP, dialogs, selects, tables, cards, etc.).

Key components:
- **`components/ui/input-otp.tsx`** — OTP input (`InputOTP`, `InputOTPGroup`, `InputOTPSlot`, `InputOTPSeparator`) — wraps `input-otp` library
- **`components/ui/sonner.tsx`** — Toast notifications (`Toaster` in root layout; use `import { toast } from 'sonner'` in pages)
- **`components/ui/alert.tsx`** — Inline alerts (`Alert`, `AlertIcon`, `AlertTitle`) with `variant="destructive"` and `appearance="light"` props
- **`components/ui/button.tsx`** — Button with `variant`, `mode`, `asChild` props
- **`components/ui/form.tsx`** — React Hook Form wrappers (`Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`)
- **`components/ui/input.tsx`** — Styled text/password input
- **`components/ui/card.tsx`** — Card layout (`Card`, `CardContent`, etc.)
- **`components/ui/dialog.tsx`**, **`dropdown-menu.tsx`**, **`select.tsx`**, **`table.tsx`**, etc.

The `Toaster` is already mounted in `app/layout.tsx` — **do not add it again** in page or layout components.

## Toolbar Page Title & Logo

The layout toolbar (`components/layout/wrapper.tsx`) renders the page title and an optional logo dynamically. The data flows through `LayoutContext`:

```
usePageMeta(title, logo?)          ← called in any page component
    ↓  setPageTitle / setPageLogo
LayoutContext (context.tsx)        ← holds pageTitle / pageLogo state
    ↓  consumed by
Wrapper (wrapper.tsx)              ← renders icon + title in <Toolbar>
```

**Hook usage — every dashboard page that needs a custom title must call this:**

```tsx
import { usePageMeta } from '@/hooks/use-page-meta';

usePageMeta(t('shop.profile'), logoPreview);  // title + reactive logo URL
usePageMeta(t('nav.dashboard'));               // title only (no logo)
usePageMeta(t('branches.title'), null);        // explicit null — no logo
```

**Fallback icon:** When `logo` is `null`/`undefined`, the wrapper automatically falls back to the current page's sidebar menu icon (resolved via `useMenu` + `layout.config.tsx`). No extra work needed.

**Logo reactivity:** `logo` updates independently from `title` — pass `logoPreview` state directly and it will reflect immediately after an upload or API load without remounting.

**Rules:**
- `title` must always come from `useTranslation('common')` — never a hardcoded string
- `logo` is optional; pass a URL string, `null`, or omit entirely
- The hook cleans up `pageTitle` and `pageLogo` to `null` on page unmount automatically
- All text keys live in `messages/en.json` and `messages/ar.json` — keep both in sync

## Hydration Warning Suppression

Next.js can emit hydration mismatch warnings when server-rendered HTML differs from the first client render. This project suppresses them in two places:

| Element | File | Why |
|---|---|---|
| `<html>` | `app/layout.tsx` | `next-themes` injects `class` + the inline dir/lang script mutates attributes before React hydrates |
| `<body>` | `app/layout.tsx` | `LayoutProvider` appends to `body.className` via `useEffect` |
| Layout wrapper `<div>` | `components/layout/context.tsx` | `data-sidebar-open` is client-only state (boolean) — no server value |

**Rules for future additions:**
- Add `suppressHydrationWarning` only on elements whose attributes/classNames are intentionally mutated by `useEffect` or third-party scripts before React hydrates.
- Do **not** add it to suppress bugs — fix the root cause instead (e.g. mismatched initial state between SSR and CSR).
- `pageTitle` and `pageLogo` are set via `useEffect` inside `usePageMeta`, so they are always `null` on the first render on both server and client — **no suppression needed** for those.

---

## Active Technologies
- TypeScript 5.x / Next.js 16.x (App Router) + React 19, TanStack Query 5.x, React Hook Form 7.x, Zod 4.x, react-i18next, i18next, ReUI/Metronic 9 component system (002-shop-branch-management)
- N/A (frontend-only; all data via .NET API) (002-shop-branch-management)

- **Framework**: Next.js 16.x (App Router)
- **UI**: React 19, Tailwind CSS 4, ReUI + Metronic 9 component system
- **Layout**: **layout is the only dashboard layout** — all others removed
- **Auth**: NextAuth v4 (`next-auth`) — Credentials provider calling .NET backend
- **Forms**: React Hook Form + Zod
- **Data fetching**: TanStack Query
- **Tables**: TanStack Table
- **Charts**: ApexCharts

## App Structure

```
app/
├── layout.tsx                    # Root layout — SessionProvider + ThemeProvider
├── page.tsx                      # Redirects to /dashboard
├── (auth)/                       # Auth pages — no sidebar, centered layout
│   ├── layout.tsx
│   ├── signin/page.tsx
│   ├── forgot-password/page.tsx
│   ├── verify-otp/page.tsx
│   └── change-password/page.tsx
├── (dashboard)/                  # Protected pages — wrapped in Layout14
│   ├── layout.tsx                # useSession guard + Layout14 wrapper
│   └── dashboard/page.tsx        # Main dashboard page
├── unauthorized/page.tsx
└── api/auth/[...nextauth]/
    ├── route.ts
    └── auth-options.ts

lib/
├── ordrat-api/                   # .NET backend API functions (grouped by domain)
│   ├── endpoints.ts              # ⭐ ENDPOINT CATALOG — all API paths + accepted fields
│   ├── auth.ts                   # loginWithCredentials(), refreshAccessToken()
│   ├── shop.ts                   # useShopProfile(), useUpdateShop(), useUploadLogo/Cover()
│   ├── branch.ts                 # useBranches(), useCreateBranch(), etc.
│   └── schemas.ts                # Zod schemas for backend responses
└── api-client.ts                 # ordratFetch() — fetch wrapper with Bearer token + 401 retry

config/
├── roles.ts                      # KNOWN_ROLES, ROUTE_ROLES, helpers
├── layout.config.tsx          # Sidebar menu config for layout
└── types.ts                      # MenuConfig type

components/
├── layout/                       # Only layout in use — all components directly in this dir
├── providers/session-provider.tsx
└── ui/                           # ~79 shared UI components
```

## Auth Endpoints (Ordrat .NET Backend — `https://api.ordrat.com`)

| Method | Endpoint | Used for |
|---|---|---|
| `POST` | `/api/Auth/Login` | Sign in — body: `{ email, password }` |
| `POST` | `/api/Auth/RefreshAccessToken` | Token refresh — `refreshToken` as **header** (not body) |
| `POST` | `/api/Auth/ForgetPassword` | Request password reset email — body: `{ email }` |
| `POST` | `/api/Auth/VerifyForgetCode` | Verify OTP — body: `{ email, verificationCode }` → returns `{ resetToken }` |
| `POST` | `/api/Auth/ResendVerificationCode` | Resend OTP — body: `{ email }` |
| `PATCH` | `/api/Auth/ResetPassword` | Set new password — body: `{ email, newPassword, resetToken }` |

**Forget-password flow**:
1. `POST /api/Auth/ForgetPassword` → save `ValidationEmail` to localStorage → redirect `/verify-otp`
2. `POST /api/Auth/VerifyForgetCode` → save `ResetToken` to localStorage → redirect `/change-password`
3. `PATCH /api/Auth/ResetPassword` → clear localStorage → redirect `/signin`

## API Endpoint Catalog

**`lib/ordrat-api/endpoints.ts`** is the single source of truth for all API paths and their accepted fields. **Never hardcode an API path outside this file.**

```ts
import { ENDPOINTS } from '@/lib/ordrat-api/endpoints';

// Path helpers
ENDPOINTS.Shop.GetById(shopId)          // '/api/Shop/GetById/<id>'
ENDPOINTS.Shop.Update.path              // '/api/Shop/Update'
ENDPOINTS.Shop.Update.method            // 'PUT'
ENDPOINTS.Branch.Create.path            // '/api/Branch/Create'
```

The file is organized by domain (`Auth`, `Shop`, `Branch`, `Category`) and each entry includes JSDoc comments listing every accepted field. When the Swagger spec changes, update `endpoints.ts` first, then fix consuming code.

**Offline Swagger snapshot — `lib/ordrat-api/swagger.json`:**

The full Swagger spec (589 endpoints, 102 controllers) is saved locally so it can be queried without a network request. Refresh it when the backend changes:

```bash
npm run swagger:sync
```

Query it with Python — examples:
```bash
# List all paths for a controller
cat lib/ordrat-api/swagger.json | python3 -c "
import json,sys; d=json.load(sys.stdin)
print('\n'.join(k for k in d['paths'] if k.startswith('/api/Shop')))
"

# Show accepted fields for a specific endpoint
cat lib/ordrat-api/swagger.json | python3 -c "
import json,sys; d=json.load(sys.stdin)
op = d['paths']['/api/Shop/Update']['put']
rb = op['requestBody']['content']['multipart/form-data']['schema']
print(list(rb['properties'].keys()))
"

# List all controllers
cat lib/ordrat-api/swagger.json | python3 -c "
import json,sys; d=json.load(sys.stdin)
tags = sorted(set(t for p in d['paths'].values() for m in p.values() for t in m.get('tags',[])))
print(tags)
"
```

**Rules:**
- Each endpoint entry in `endpoints.ts` documents which fields are accepted vs. read-only
- When adding a new feature, query `swagger.json` first — don't guess field names

## Adding New API Domains

1. Add endpoint constants to `lib/ordrat-api/endpoints.ts`
2. Create `lib/ordrat-api/<domain>.ts` with TanStack Query hooks
3. Add Zod response schemas to `lib/ordrat-api/schemas.ts`

Use `ordratFetch()` from `lib/api-client.ts` for all client-side API calls (handles Bearer token + 401 retry).
Use raw `fetch` with `process.env.BACKEND_API_URL` for server-side calls (in NextAuth, Server Actions).

## Key Files

| File | Purpose |
|---|---|
| `proxy.ts` | Route protection + role-based access (Next.js 15+ — **not** `middleware.ts`) |
| `app/api/auth/[...nextauth]/auth-options.ts` | NextAuth config — calls .NET login + token refresh |
| `lib/ordrat-api/auth.ts` | `loginWithCredentials()`, `refreshAccessToken()` |
| `lib/ordrat-api/schemas.ts` | Zod schemas for .NET backend responses |
| `lib/api-client.ts` | `ordratFetch()` — fetch wrapper with Bearer token + 401 retry |
| `config/roles.ts` | `KNOWN_ROLES`, `ROUTE_ROLES`, `filterKnownRoles()`, `userHasRouteAccess()` |
| `types/next-auth.d.ts` | Extended NextAuth JWT + Session types |

## Commands

```bash
npm run dev        # start dev server
npm run build      # production build (also runs TS type check)
npm run lint       # ESLint
npx tsc --noEmit   # TypeScript type check only
```

## Architecture Notes

- **Route protection** is server-side via `proxy.ts` (`export default function proxy()`). The dashboard layout also has a client-side `useSession` guard as a fallback.
- **`BACKEND_API_URL`** is server-only. **`NEXT_PUBLIC_BACKEND_API_URL`** is the client-side copy. Never hardcode the API URL.
- **`userType`** from the .NET backend comes as a number — coerced to string via `z.coerce.string()` in schemas.
- **Token refresh** uses the `refreshToken` as an HTTP **header** (not body) on `POST /api/Auth/RefreshAccessToken`.
- **Roles** are filtered against `KNOWN_ROLES` before storage. Unknown role strings from the backend are silently discarded.
- **Incomplete seller setup**: if `shopId` is empty after login, redirect to `https://ordrat.com/seller-setup?sellerId=<id>`.
- **layout only** — all other Metronic layout examples removed. Components live in `components/layout/` (not a subdirectory); config at `config/layout.config.tsx`.

---

## Speckit Workflow

Speckit is the feature-development workflow built into `.specify/`. **Every new feature MUST go through this workflow** before implementation.

### Commands (run as slash commands in Claude Code)

| Command | What it does |
|---|---|
| `/speckit.constitution` | Create or update the project constitution (`.specify/memory/constitution.md`) — governance rules, principles, tech stack |
| `/speckit.specify <description>` | Create a feature spec from a plain-language description. Creates a branch `NNN-feature-name` and `specs/NNN-feature-name/spec.md` |
| `/speckit.clarify` | Ask targeted clarification questions to fill gaps in the current spec |
| `/speckit.plan` | Generate an implementation plan (`plan.md`), research doc, data model, API contracts, and quickstart guide in the feature's spec folder |
| `/speckit.tasks` | Generate an actionable `tasks.md` from the plan — organized by user story, with parallel markers |
| `/speckit.implement` | Execute all tasks in `tasks.md` — implements code phase by phase, marks tasks complete |
| `/speckit.analyze` | Cross-artifact consistency check across spec/plan/tasks |
| `/speckit.checklist` | Generate a quality checklist for the current feature |

### Full Feature Workflow

```
1. /speckit.specify "plain language description of the feature"
   → creates branch NNN-name + specs/NNN-name/spec.md

2. /speckit.clarify          (optional — resolves ambiguities in spec)

3. /speckit.plan
   → creates plan.md, research.md, data-model.md, contracts/, quickstart.md

4. /speckit.tasks
   → creates tasks.md organized by user story

5. /speckit.implement
   → implements all tasks, marks them [x] as complete

6. After implementation:
   - npm run build  (verify zero TS errors)
   - Follow quickstart.md validation steps
   - Merge branch to main, delete feature branch
```

### File Structure per Feature

```
specs/NNN-feature-name/
├── spec.md          # user stories, requirements, success criteria
├── plan.md          # tech context, constitution check, source layout
├── research.md      # decisions + rationale
├── data-model.md    # TypeScript interfaces, entities, file change map
├── quickstart.md    # validation steps
├── contracts/       # external API contracts
├── checklists/      # quality checklists
└── tasks.md         # implementation task list
```

### Tips

- `/speckit.tasks` accepts extra instructions after the command — e.g. `/speckit.tasks use proxy.ts not middleware.ts` — these are passed as context to the task generator.
- Use **Context7 MCP** (`/speckit.plan`, `/speckit.tasks`) to look up the latest framework docs (e.g. Next.js auth patterns, library APIs) before generating plans/tasks.
- After `/speckit.implement`, always run `npx tsc --noEmit` to catch type errors before merging.
- The `.specify/memory/constitution.md` is the single source of truth for project principles. Re-run `/speckit.constitution` when the tech stack or governance changes.

### Post-Implementation: Merge & Cleanup

```bash
# 1. Commit all changes on the feature branch
git add <files>
git commit -m "feat: <description>"

# 2. Switch to main and merge
git checkout main
git merge 001-feature-name --no-ff -m "feat: merge 001-feature-name"

# 3. Delete the feature branch
git branch -d 001-feature-name

# 4. specs/ folder stays in main — it's the living documentation
```

<!-- MANUAL ADDITIONS START -->
## Logo Files (`public/media/app/`)

Available: `logo.svg` (light), `logo-dark.png` (dark), `default-logo.svg` (light, full-width), `default-logo-dark.svg` (dark, full-width), `logo-transparent.svg`
**Do not reference:** `mini-logo.svg`, `mini-logo-gray.svg`, `mini-logo-gray-dark.svg` — these do not exist.

Usage convention:
- **Header sidebar brand**: `default-logo.svg` / `default-logo-dark.svg` (full-width wordmark)
- **Screen loader + auth panel**: `logo.svg` / `logo-dark.png`
- Light/dark pattern: `<img src="logo.svg" className="dark:hidden" />` + `<img src="logo-dark.png" className="hidden dark:block" />`

## UI Gotchas

- **`SheetContent` accessibility** — Radix Dialog requires a `DialogTitle`. Always include `<SheetTitle className="sr-only">…</SheetTitle>` inside `SheetHeader` for navigation drawers that have no visible title.
<!-- MANUAL ADDITIONS END -->

## Recent Changes
- 002-shop-branch-management: Added TypeScript 5.x / Next.js 16.x (App Router) + React 19, TanStack Query 5.x, React Hook Form 7.x, Zod 4.x, react-i18next, i18next, ReUI/Metronic 9 component system
