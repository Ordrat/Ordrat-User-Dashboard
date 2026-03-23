# Contract: Ordrat .NET Backend Auth API

**Consumer**: Ordrat Dashboard (Next.js frontend)
**Provider**: Ordrat .NET Backend
**Base URL**: `process.env.BACKEND_API_URL` (e.g., `https://testapi.ordrat.com`)
**Date**: 2026-03-18

---

## POST /api/Auth/Login

Authenticates a seller or admin with email and password.

### Request

```
POST {BACKEND_API_URL}/api/Auth/Login
Content-Type: application/json
```

```json
{
  "email": "seller@example.com",
  "password": "their-password"
}
```

### Success Response — 200 OK

```json
{
  "accessToken": "<jwt-string>",
  "refreshToken": "<refresh-token-string>",
  "shopId": "shop-uuid",
  "id": "seller-uuid",
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "seller@example.com",
  "roles": ["sellerDashboard-orders", "OrderDetails", "..."],
  "branches": [
    {
      "id": "branch-uuid",
      "nameEn": "Main Branch",
      "nameAr": "الفرع الرئيسي",
      "isMain": true
    }
  ],
  "userType": "seller",
  "subdomain": "jane-shop"
}
```

**Special case — incomplete shop setup**:
`shopId` will be an empty string `""`. Dashboard MUST redirect to
`https://ordrat.com/seller-setup?sellerId=<id>` instead of creating a session.

### Error Responses

| Status | Meaning | Frontend Action |
|---|---|---|
| 400 | Validation error (malformed request) | Show generic error |
| 401 | Invalid credentials | Show "Invalid email or password" |
| 404 | Account not found | Show "Invalid email or password" (don't distinguish) |
| 500 | Server error | Show "Service unavailable, please try again" |
| Network error | Backend unreachable | Show "Service unavailable, please try again" |

---

## POST /api/Auth/RefreshAccessToken

Refreshes an expired access token using a valid refresh token.

### Request

```
POST {BACKEND_API_URL}/api/Auth/RefreshAccessToken
Content-Type: application/json
refreshToken: <refresh-token-string>
```

**Important**: `refreshToken` is sent as an **HTTP header**, not in the request body.
The body can be empty.

### Success Response — 200 OK

Same shape as the Login response — returns new `accessToken`, `refreshToken`,
and updated user data.

```json
{
  "accessToken": "<new-jwt-string>",
  "refreshToken": "<new-refresh-token-string>",
  "shopId": "shop-uuid",
  "id": "seller-uuid",
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "seller@example.com",
  "roles": ["sellerDashboard-orders", "..."],
  "branches": [...],
  "userType": "seller",
  "subdomain": "jane-shop"
}
```

### Error Responses

| Status | Meaning | Frontend Action |
|---|---|---|
| 401 | Refresh token expired or invalid | Clear session → redirect to `/signin` |
| 500 | Server error | Allow current request through (fail-open); clear session on repeated failure |
| Network error | Backend unreachable | Fail-open; do not clear session |

---

## Notes for Consumers

1. **Access token lifetime**: Not explicitly documented by the backend. Assume
   short-lived (minutes to hours). Dashboard MUST not assume any specific TTL.
   Store login time and use a conservative 60-second refresh buffer.

2. **Token format**: Both tokens are opaque strings from the frontend's
   perspective. Do not parse or decode them.

3. **Roles list**: The backend may return roles the frontend does not recognize.
   Silently discard unknown roles. Never throw an error for unrecognized roles.

4. **Breaking changes**: If the backend changes token format or adds required
   fields, this contract document MUST be updated before implementation changes.
