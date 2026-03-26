<!--
  Sync Impact Report
  ═══════════════════
  Version change: N/A (initial) → 1.0.0
  Modified principles: N/A (first ratification)
  Added sections:
    - Core Principles (5 principles)
    - Technology Stack & Constraints
    - Development Workflow
    - Governance
  Removed sections: None
  Templates requiring updates:
    - .specify/templates/plan-template.md        ✅ compatible (no changes needed)
    - .specify/templates/spec-template.md         ✅ compatible (no changes needed)
    - .specify/templates/tasks-template.md        ✅ compatible (no changes needed)
    - .specify/templates/checklist-template.md    ✅ compatible (no changes needed)
    - .specify/templates/agent-file-template.md   ✅ compatible (no changes needed)
  Follow-up TODOs: None
-->

# Ordrat Dashboard Constitution

## Core Principles

### I. Frontend-Only Architecture

This project is a **frontend-only** Next.js seller dashboard.
The backend is a .NET API at the configured `BACKEND_API_URL` —
this codebase MUST NOT contain server-side business logic,
ORM-based data mutations for business entities, or direct
database access for domain operations.

- All business data MUST be fetched from and mutated through
  the .NET backend API.
- Prisma + PostgreSQL are permitted **only** for local user
  management features (e.g., NextAuth session storage). They
  MUST NOT be used for Ordrat business entities.
- `BACKEND_API_URL` is server-only. `NEXT_PUBLIC_BACKEND_API_URL`
  is the client-side equivalent. Hardcoding API URLs is
  forbidden.

### II. Component-Library-First

Every UI element MUST use existing components from
`components/ui/` before considering custom implementations.
The project ships a rich shared component library (ReUI +
Metronic 9) — building UI from scratch when a suitable
component exists is a violation.

- Before creating any UI element, check `components/ui/` for
  an existing component (buttons, inputs, alerts, toasts, OTP,
  dialogs, selects, tables, cards, etc.).
- The `Toaster` component is mounted once in `app/layout.tsx`.
  It MUST NOT be added again in any page or layout component.
- Use `class-variance-authority`, `clsx`, and `tailwind-merge`
  for variant and class composition — do not invent ad-hoc
  class-merging patterns.

### III. Swagger-First API Contracts

All endpoint contracts, request bodies, response shapes, and
field names MUST be sourced from the Swagger documentation at
`https://api.ordrat.com/index.html`. This is the **single
source of truth** for the .NET backend API.

- Every new API function in `lib/ordrat-api/` MUST match the
  exact field names and types from the Swagger spec.
- reCAPTCHA MUST NOT be used — it is intentionally absent from
  this project.
- Deviations from the Swagger contract MUST be justified in the
  feature spec or PR description.

### IV. Server-Side Route Protection

Route protection and role-based access control MUST be
implemented server-side via `proxy.ts` (Next.js 15+ pattern).

- Client-side `useEffect` redirects for auth are forbidden.
- Roles are filtered against `KNOWN_ROLES` before storage;
  unknown role strings from the backend are silently discarded.
- `userType` from the .NET backend arrives as a number and MUST
  be coerced to string via `z.coerce.string()` in schemas.
- Token refresh uses the `refreshToken` as an HTTP **header**
  (not body) on `POST /api/Auth/RefreshAccessToken`.

### V. Internationalisation (i18n) First

All user-visible text MUST use `react-i18next` (`useTranslation('common')`) and
be sourced from `messages/en.json` and `messages/ar.json`. Hardcoded strings are
forbidden in components, hooks, and pages.

- Every new text string MUST be added to **both** `messages/en.json` and
  `messages/ar.json` at the same time.
- Toolbar, nav, action labels, and error messages are all subject to this rule.
- The `usePageMeta(title, logo?)` hook (`hooks/use-page-meta.ts`) is the standard
  way to set the per-page toolbar title and optional logo. Always pass a translated
  string as `title`.

### VI. Type Safety & Schema Validation

All data crossing system boundaries MUST be validated with Zod
schemas. TypeScript strict mode is the baseline.

- Every .NET backend response MUST have a corresponding Zod
  schema in `lib/ordrat-api/schemas.ts`.
- Forms MUST use React Hook Form + Zod (`@hookform/resolvers`).
- API client calls MUST go through `ordratFetch()` in
  `lib/api-client.ts`, which handles Bearer tokens and 401
  retry logic.
- TanStack Query MUST be used for server-state management
  (caching, refetching, optimistic updates).

## Technology Stack & Constraints

**Locked stack** — changes to these require a constitution
amendment:

| Layer | Technology | Version Lock |
|---|---|---|
| Framework | Next.js (App Router) | 16.x |
| UI | React | 19.x |
| Styling | Tailwind CSS | 4.x |
| Component system | ReUI + Metronic 9 | 9.4.x |
| Auth | NextAuth (next-auth) | v4 |
| Forms | React Hook Form + Zod | RHF 7.x, Zod 4.x |
| Data fetching | TanStack Query | 5.x |
| Tables | TanStack Table | 8.x |
| Charts | ApexCharts | 4.x |
| Language | TypeScript | 5.x |

**Constraints**:

- No Axios — use native `fetch` via `ordratFetch()`.
- No Yup — use Zod for all validation.
- No client-side auth redirects — use `proxy.ts`.
- No reCAPTCHA integration.
- `NEXT_PUBLIC_` prefix required for any env var used
  client-side.

## Development Workflow

### Build & Verify

```bash
npm run dev          # Start dev server
npm run build        # Production build (includes TS type check)
npm run lint         # ESLint
npx tsc --noEmit     # TypeScript type check only
```

### Feature Development

Every new feature MUST go through the Speckit workflow before
implementation:

1. `/speckit.specify` — create feature spec and branch
2. `/speckit.clarify` — resolve ambiguities (optional)
3. `/speckit.plan` — generate implementation plan
4. `/speckit.tasks` — generate task list
5. `/speckit.implement` — execute tasks
6. `npm run build` — verify zero errors before merge

### Key File Locations

| File | Purpose |
|---|---|
| `proxy.ts` | Route protection + role-based access |
| `app/api/auth/[...nextauth]/auth-options.ts` | NextAuth config |
| `lib/ordrat-api/auth.ts` | Login + token refresh functions |
| `lib/ordrat-api/schemas.ts` | Zod schemas for .NET responses |
| `lib/api-client.ts` | `ordratFetch()` wrapper |
| `types/next-auth.d.ts` | Extended NextAuth types |

### Branch & Merge Strategy

- Feature branches: `NNN-feature-name` (e.g., `001-auth-flow`)
- Merge to `main` with `--no-ff`
- `specs/` folder stays in `main` as living documentation
- Delete feature branches after merge

## Governance

This constitution is the authoritative source of project
principles. It supersedes conflicting guidance in any other
document except explicit user override during a conversation.

- **Amendments**: Any change to Core Principles or Technology
  Stack requires updating this file, incrementing the version,
  and running the consistency propagation checklist.
- **Versioning**: MAJOR for principle removals/redefinitions,
  MINOR for new principles or material expansions, PATCH for
  clarifications and typo fixes.
- **Compliance**: All feature specs (`/speckit.plan`) MUST
  include a Constitution Check gate. Violations MUST be
  justified in the Complexity Tracking table.
- **Runtime guidance**: `CLAUDE.md` at the repo root serves as
  the runtime development guidance file and MUST stay aligned
  with this constitution.

**Version**: 1.2.0 | **Ratified**: 2026-03-23 | **Last Amended**: 2026-03-25
