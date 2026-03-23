# Implementation Plan: Migrate Authentication System

**Branch**: `001-migrate-auth` | **Date**: 2026-03-18 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/001-migrate-auth/spec.md`

## Summary

Replace the demo-only NextAuth credentials provider with a real integration
against the Ordrat .NET backend (`/api/Auth/Login`, `/api/Auth/RefreshAccessToken`).
Add server-side middleware for route protection and role-based access. Keep
NextAuth as the session layer (per constitution) while storing .NET tokens inside
the NextAuth JWT for transparent refresh. Minimal changes to the existing sign-in
page UI.

## Technical Context

**Language/Version**: TypeScript / Node.js 20+ (Next.js 15.3 runtime)
**Primary Dependencies**: next-auth v4, axios, zod, react-hook-form
**Storage**: NextAuth JWT (HTTP-only cookie) — no database writes for auth;
  token state lives in the encrypted JWT cookie
**Testing**: `npm run lint` + `npm run build` (type check); manual validation
  via quickstart.md
**Target Platform**: Next.js 15.3 App Router, edge middleware (Vercel / Node)
**Project Type**: Web application (frontend-only; auth backend is .NET)
**Performance Goals**: Route protection decision < 50ms (edge middleware);
  login round-trip under 2s (per SC-001/SC-002)
**Constraints**: No secrets in client bundles; strict TypeScript; backend URL
  server-only env var
**Scale/Scope**: Auth affects every page; ~8 files to create/modify

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Component-First Design | ✅ Pass | Sign-in page already follows ReUI/Tailwind patterns; no new shared components needed — page-level component only |
| II. Type Safety (NON-NEGOTIABLE) | ✅ Pass | All backend responses validated with Zod; NextAuth JWT and Session types extended in `types/next-auth.d.ts`; strict mode maintained |
| III. Server/Client Boundary Discipline | ✅ Pass | `BACKEND_API_URL` is server-only env var; auth calls happen inside NextAuth `authorize()` (server-side); middleware uses `getToken()` server-side; `"use client"` retained only for the sign-in form (event handlers required) |
| IV. Data Layer Integrity | ✅ N/A | Auth for this feature delegates entirely to the .NET backend; no Prisma operations needed for login/session. Existing Prisma schema for user management is untouched. |
| V. Observability & Quality Gates | ✅ Pass | Structured error messages on sign-in failure; loading state on form submit; lint + build must pass before PR |

**No violations. Phase 0 research can proceed.**

*Post-design re-check (Phase 1):*
All design decisions (see research.md) preserve the above gate status. The
custom role-filtering logic in `config/roles.ts` is pure TypeScript with no
runtime side-effects — no additional constitution concerns.

## Project Structure

### Documentation (this feature)

```text
specs/001-migrate-auth/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── backend-auth-api.md  # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── (auth)/
│   └── signin/
│       └── page.tsx           # MODIFY: remove demo content + Google button
└── api/
    └── auth/
        └── [...nextauth]/
            └── auth-options.ts  # MODIFY: replace demo credentials with .NET API

lib/
├── ordrat-api/
│   ├── auth.ts                # CREATE: loginWithCredentials(), refreshAccessToken()
│   └── schemas.ts             # CREATE: Zod schemas for backend auth responses
└── api-client.ts              # CREATE: Axios instance with auth interceptors

config/
└── roles.ts                   # CREATE: KNOWN_ROLES, ROUTE_ROLES, helpers

types/
└── next-auth.d.ts             # CREATE: Extend JWT + Session types

proxy.ts                       # CREATE: Server-side route protection + role guard (Next.js 15+)

.env.local                     # MODIFY: Add BACKEND_API_URL
```

**Structure Decision**: Single Next.js application with flat `lib/` for
utilities. Auth logic is split across Next.js conventions:
- `app/api/auth/[...nextauth]/` for the NextAuth handler
- `lib/ordrat-api/` for raw API functions (pure async functions, no framework)
- `middleware.ts` for edge route protection
- `config/roles.ts` for role definitions (shared between middleware and client)

## Complexity Tracking

> No constitution violations requiring justification.
