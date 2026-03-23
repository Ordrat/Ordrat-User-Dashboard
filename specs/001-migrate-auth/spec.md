# Feature Specification: Migrate Authentication System

**Feature Branch**: `001-migrate-auth`
**Created**: 2026-03-18
**Status**: Draft
**Input**: Migrate the auth system from the old Ordrat Dashboard (Galal-Elsayed/Ordrat-Old-Dashboard) into this new dashboard. The backend is a .NET service — not a full-stack app. There is no Prisma; auth state is managed purely through the .NET API endpoints.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign In with Email & Password (Priority: P1)

A seller or admin opens the dashboard login page, enters their credentials, and gains access to their dashboard. On success, the system stores their session and redirects them to the main dashboard view. If credentials are wrong, a clear error message is shown.

**Why this priority**: Without working login, no other dashboard feature is accessible. This is the entry point to the entire application.

**Independent Test**: Can be fully tested by submitting valid credentials and verifying the user lands on the dashboard, then submitting invalid credentials and verifying the error state — no other feature needed.

**Acceptance Scenarios**:

1. **Given** a seller is on the sign-in page, **When** they submit valid email and password, **Then** they are redirected to the dashboard home and their session is active.
2. **Given** a seller is on the sign-in page, **When** they submit incorrect credentials, **Then** they remain on the sign-in page and see an error message describing the failure.
3. **Given** a seller whose shop setup is incomplete (no shop linked), **When** they successfully sign in, **Then** they are redirected to the onboarding/seller-setup flow rather than the dashboard.
4. **Given** a seller submits the form with empty fields, **When** the form is submitted, **Then** inline validation errors appear before any network call is made.

---

### User Story 2 - Automatic Session Persistence & Token Refresh (Priority: P1)

A signed-in user reloads the page or navigates between dashboard routes. The system silently refreshes their access token in the background, keeping them signed in without interruption. If the session is truly expired and cannot be renewed, the user is redirected to sign-in.

**Why this priority**: Without transparent token refresh, users would be logged out every time their short-lived access token expires, making the dashboard unusable.

**Independent Test**: Sign in, wait for the access token to expire (or simulate it), then navigate to any protected route — user should stay signed in without a manual login prompt.

**Acceptance Scenarios**:

1. **Given** a signed-in user whose access token has expired, **When** they navigate to any protected page, **Then** the token is refreshed transparently and the page loads normally.
2. **Given** a signed-in user whose refresh token has also expired, **When** they navigate to any protected page, **Then** all session data is cleared and they are redirected to sign-in.
3. **Given** a signed-in user, **When** a dashboard API call returns "unauthorized", **Then** the system automatically retries the call with a refreshed token before showing any error to the user.

---

### User Story 3 - Route Protection & Role-Based Access (Priority: P2)

Unauthenticated users who try to access any protected dashboard route are redirected to sign-in. Authenticated users who lack the required permissions for a specific route are redirected to an "unauthorized" page rather than seeing a broken view.

**Why this priority**: Security gate that prevents unauthorized access to business data. Builds on P1 (session must work first).

**Independent Test**: Open a protected route without being signed in → redirected to sign-in. Sign in as a user without the required role for a specific route → redirected to unauthorized.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor, **When** they navigate to any protected dashboard route, **Then** they are redirected to the sign-in page.
2. **Given** an authenticated user without permission for a specific section, **When** they navigate to that section's URL directly, **Then** they are redirected to an "unauthorized" page rather than seeing broken content.
3. **Given** an authenticated user with full permissions, **When** they navigate to any route they are permitted to access, **Then** the route loads normally without any redirect.

---

### User Story 4 - Sign Out (Priority: P3)

A signed-in user signs out of the dashboard. All session data (tokens, user info, roles) is cleared from the browser and they are redirected to the sign-in page.

**Why this priority**: Basic security hygiene; lower priority than core sign-in/session because users can close the browser as a workaround.

**Independent Test**: Sign in, trigger sign-out, verify all stored session data is gone and the user lands on sign-in.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they sign out, **Then** all session data is cleared and they land on the sign-in page.
2. **Given** a user who signed out, **When** they press the browser back button, **Then** they cannot return to any protected page (redirected to sign-in instead).

---

### Edge Cases

- What happens when the backend auth service is unreachable during login? → User sees a generic "service unavailable" error; no partial session state is saved.
- What happens when token refresh fails mid-session due to a network error? → The request proceeds optimistically (fail-open); a hard auth failure clears the session and redirects to sign-in.
- What happens when a user signs in on one tab and the session expires on another? → The second tab detects the expired state on next navigation and redirects to sign-in.
- What happens when the sign-in response is missing the shop ID? → User is redirected to the seller onboarding flow to complete their account setup before accessing the dashboard.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow sellers and admins to sign in using email and password.
- **FR-002**: The system MUST validate sign-in form inputs (non-empty email, valid format, non-empty password) before submitting to the backend.
- **FR-003**: The system MUST store the user's session (tokens, roles, shop info) upon successful sign-in so subsequent page loads do not require re-authentication.
- **FR-004**: The system MUST automatically refresh the session token before it expires, without user interaction.
- **FR-005**: The system MUST redirect unauthenticated users attempting to access protected routes to the sign-in page.
- **FR-006**: The system MUST redirect authenticated users who lack permission for a specific route to an "unauthorized" page.
- **FR-007**: The system MUST clear all session data and redirect to sign-in when the refresh token is expired or invalid.
- **FR-008**: The system MUST provide a sign-out action that clears all session data and redirects to sign-in.
- **FR-009**: The system MUST show clear, user-readable error messages when sign-in fails (wrong credentials, account not found, service unavailable).
- **FR-010**: Users whose shop setup is incomplete after sign-in MUST be redirected to the seller onboarding flow, not the dashboard.

### Key Entities

- **Session**: Represents the authenticated user's active state — includes access token, refresh token, shop identity, user roles, and branch information. Has a finite lifetime requiring periodic renewal.
- **User**: A seller or admin who owns a shop. Identified by email; associated with one shop, one or more branches, a user type, and a set of permission roles.
- **Role**: A permission string that grants access to specific dashboard sections or actions. Users hold a filtered list of roles received from the backend.
- **Shop**: The seller's store entity. Required for dashboard access; absent shop ID triggers onboarding redirect.
- **Branch**: A physical or logical sub-unit of a shop. Users have a main branch plus optional additional branches.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A returning user with a valid session can reach any permitted dashboard page within 2 seconds of navigation, with no manual sign-in required.
- **SC-002**: An unauthenticated user is redirected to the sign-in page within 500ms of navigating to any protected route.
- **SC-003**: 100% of sign-in form validation errors (empty fields, invalid email format) are surfaced to the user before any network request is made.
- **SC-004**: Token refresh is fully transparent — zero sign-in interruptions occur for users whose sessions are still renewable.
- **SC-005**: Sign-out completes in under 1 second and leaves zero residual session data accessible in the browser.
- **SC-006**: Users without the required role for a route are blocked at the route level — zero cases where restricted content is briefly visible before redirect.

## Assumptions

- The .NET backend auth API is already deployed and its endpoints are stable.
- The backend base URL is provided via environment variable; it will not be hardcoded.
- The new dashboard supports internationalization (Arabic/English) in its routing, so auth pages and redirects must be language-aware.
- No social/OAuth login (Google, etc.) is in scope for this migration — email/password only.
- The role system and permission strings are owned by the backend; the frontend only filters and stores what it receives.
- "Remember me" functionality is out of scope unless found to be required by the existing backend response contract.
