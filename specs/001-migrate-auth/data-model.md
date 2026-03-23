# Data Model: Migrate Authentication System

**Feature**: 001-migrate-auth
**Date**: 2026-03-18

---

## TypeScript Interfaces

### Backend API Contracts (Inbound)

```typescript
// POST /api/Auth/Login — request body
interface LoginRequest {
  email: string;
  password: string;
}

// POST /api/Auth/Login — success response
interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  shopId: string;          // Empty string = incomplete seller setup
  id: string;              // sellerId
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];         // Raw permission strings from backend
  branches: Branch[];
  userType: string;
  subdomain: string;
}

// POST /api/Auth/RefreshAccessToken — success response
// (request sends refreshToken as a Header, not body)
interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  shopId: string;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  branches: Branch[];
  userType: string;
  subdomain: string;
}

interface Branch {
  id: string;
  nameEn?: string;
  nameAr?: string;
  isMain?: boolean;
  [key: string]: unknown; // backend may add fields; store as-is
}
```

### Zod Validation Schema (External Boundary)

```typescript
// Validates the backend login response before we trust and store it
import { z } from 'zod';

const BranchSchema = z.object({
  id: z.string(),
  nameEn: z.string().optional(),
  nameAr: z.string().optional(),
  isMain: z.boolean().optional(),
}).passthrough();

const LoginResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  shopId: z.string(),
  id: z.string().min(1),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  roles: z.array(z.string()),
  branches: z.array(BranchSchema),
  userType: z.string(),
  subdomain: z.string(),
});

export type LoginResponseType = z.infer<typeof LoginResponseSchema>;
```

### NextAuth JWT Token Extension

```typescript
// Extends next-auth JWT type — declared in types/next-auth.d.ts
declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: number;  // Unix ms timestamp
    shopId: string;
    sellerId: string;
    name: string;
    email: string;
    roles: string[];
    branches: Branch[];
    mainBranchId: string | null;
    userType: string;
    subdomain: string;
    error?: 'RefreshAccessTokenError';
  }
}
```

### NextAuth Session Extension

```typescript
// Extends next-auth Session type — declared in types/next-auth.d.ts
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;          // sellerId
      name: string;
      email: string;
      shopId: string;
      roles: string[];
      branches: Branch[];
      mainBranchId: string | null;
      userType: string;
      subdomain: string;
    };
    accessToken: string;
    error?: 'RefreshAccessTokenError';
  }
}
```

---

## State Transitions

### Session Lifecycle

```
[No Session]
    │
    │  User submits valid credentials
    ▼
[Active Session]  ──── accessToken expires ──►  [Refreshing]
    │                                                │
    │                                                │ refresh OK
    │                                                ▼
    │                                           [Active Session] (new tokens)
    │
    │  refreshToken expires / invalid
    ▼
[Expired Session]  ──► clear all tokens ──►  [No Session]  ──► redirect /signin
    │
    │  User signs out
    ▼
[No Session]  ──► redirect /signin
```

### Incomplete Shop State

```
[Login Response with empty shopId]
    │
    ▼
[No Session created]  +  redirect to https://ordrat.com/seller-setup?sellerId=<id>
```

---

## Role System

```typescript
// Known permission strings — only these are stored; others discarded
export const KNOWN_ROLES = [
  'sellerDashboard-orders',
  'OrderDetails',
  'CreateBranch',
  'sellerDashboard-store',
  'sellerDashboard-products',
  'sellerDashboard-customers',
  'sellerDashboard-reports',
  'sellerDashboard-settings',
  // ... full list populated from old repo's dataMap during implementation
] as const;

export type KnownRole = typeof KNOWN_ROLES[number];

// Route → required roles mapping (any match grants access)
export const ROUTE_ROLES: Record<string, string[]> = {
  '/store-admin': ['sellerDashboard-store'],
  '/store-client': ['sellerDashboard-orders'],
  '/user-management': ['sellerDashboard-settings'],
  // ... expand during implementation from old repo's routeRoles
};
```

---

## Files to Create / Modify

| File | Action | Purpose |
|---|---|---|
| `app/api/auth/[...nextauth]/auth-options.ts` | Modify | Replace demo user with .NET API call |
| `types/next-auth.d.ts` | Create | Extend NextAuth JWT + Session types |
| `lib/ordrat-api/auth.ts` | Create | `loginWithCredentials()`, `refreshAccessToken()` |
| `lib/ordrat-api/schemas.ts` | Create | Zod schemas for backend responses |
| `lib/api-client.ts` | Create | Axios instance with auth interceptors |
| `config/roles.ts` | Create | KNOWN_ROLES, ROUTE_ROLES, role utils |
| `proxy.ts` | Create | Server-side route protection + role check (Next.js 15+ convention) |
| `app/(auth)/signin/page.tsx` | Modify | Remove demo content + Google button |
| `.env.local` | Modify | Add BACKEND_API_URL |
