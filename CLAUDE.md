# Ordrat Dashboard — Development Guidelines

## Project

Next.js 15.3 / React 19 / Tailwind CSS 4 seller dashboard. Backend is a **.NET API** (`https://testapi.ordrat.com`) — this is **frontend-only**. No full-stack, no Prisma for business logic.

**Refactoring source**: `https://github.com/Galal-Elsayed/Ordrat-Old-Dashboard`
When implementing any auth or existing feature, check the old repo first — it has the proven logic, endpoints, and flow. Copy and adapt to this project's stack (Zod instead of Yup, `fetch` instead of Axios, NextAuth session instead of raw cookies, no reCAPTCHA).

## Reusable UI Components

This project is a **monorepo with a rich shared component library**. **NEVER build UI components from scratch** — always check `components/ui/` first and use existing components for any UI need (buttons, inputs, alerts, toasts, OTP, dialogs, selects, tables, cards, etc.).

Key components:
- **`components/ui/input-otp.tsx`** — OTP input (`InputOTP`, `InputOTPGroup`, `InputOTPSlot`, `InputOTPSeparator`) — wraps `input-otp` library
- **`components/ui/sonner.tsx`** — Toast notifications (`Toaster` in root layout; use `import { toast } from 'sonner'` in pages)
- **`components/ui/alert.tsx`** — Inline alerts (`Alert`, `AlertIcon`, `AlertTitle`) with `variant="destructive"` and `onClose` prop
- **`components/ui/button.tsx`** — Button with `variant`, `mode`, `asChild` props
- **`components/ui/form.tsx`** — React Hook Form wrappers (`Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`)
- **`components/ui/input.tsx`** — Styled text/password input
- **`components/ui/card.tsx`** — Card layout (`Card`, `CardContent`, etc.)
- **`components/ui/dialog.tsx`**, **`dropdown-menu.tsx`**, **`select.tsx`**, **`table.tsx`**, etc.

The `Toaster` is already mounted in `app/layout.tsx` — **do not add it again** in page or layout components.

---

## Active Technologies

- **Framework**: Next.js 15.3 (App Router)
- **UI**: React 19, Tailwind CSS 4, ReUI + Metronic 9 component system
- **Auth**: NextAuth v4 (`next-auth`) — Credentials provider calling .NET backend
- **Forms**: React Hook Form + Zod
- **Data fetching**: TanStack Query
- **Tables**: TanStack Table
- **Charts**: ApexCharts
- **ORM**: Prisma + PostgreSQL (user management features only — **not** for auth)
- **Storage**: AWS S3 (`@aws-sdk/client-s3`)

## Auth Endpoints (Ordrat .NET Backend)

| Method | Endpoint | Used for |
|---|---|---|
| `POST` | `/api/Auth/Login` | Sign in — body: `{ email, password }` |
| `POST` | `/api/Auth/RefreshAccessToken` | Token refresh — `refreshToken` as **header** |
| `POST` | `/api/Auth/ForgetPassword` | Request password reset email — body: `{ email }` |
| `POST` | `/api/Auth/VerifyForgetCode` | Verify OTP — body: `{ email, verificationCode }` → returns `{ resetToken }` |
| `POST` | `/api/Auth/ResendVerificationCode` | Resend OTP — body: `{ email }` |
| `PATCH` | `/api/Auth/ResetPassword` | Set new password — body: `{ email, newPassword, resetToken }` |

Forget-password flow: `ForgetPassword` → save `ValidationEmail` to localStorage → redirect `/verify-otp` → `VerifyForgetCode` → save `ResetToken` to localStorage → redirect `/change-password` → `ResetPassword` → redirect `/signin`.

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
npm run lint       # ESLint (note: has pre-existing AJV config issue unrelated to app code)
npx tsc --noEmit   # TypeScript type check only
```

## Architecture Notes

- **Route protection** is server-side via `proxy.ts` (`export default function proxy()`). Never use client-side `useEffect` redirects for auth.
- **`BACKEND_API_URL`** is server-only. **`NEXT_PUBLIC_BACKEND_API_URL`** is the client-side copy. Never hardcode the API URL.
- **`userType`** from the .NET backend comes as a number — coerced to string via `z.coerce.string()` in schemas.
- **Token refresh** uses the `refreshToken` as an HTTP **header** (not body) on `POST /api/Auth/RefreshAccessToken`.
- **Roles** are filtered against `KNOWN_ROLES` before storage. Unknown role strings from the backend are silently discarded.

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
<!-- MANUAL ADDITIONS END -->
