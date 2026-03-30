# Feature Specification: PWA Offline Resilience

**Feature Branch**: `004-pwa-offline-resilience`
**Created**: 2026-03-28
**Status**: Draft
**Input**: User description: "pwa perfectly implemented with no redirect to sign in again because the shops and the users will be using that dashboard for 12+ hours without network but in the last of the day they will open the wifi to save everything they have done so we can't redirect them to the login that's so bad and i want to make sure that the cache offline button that i have implemented is caching all the pages for the user before the network go down so it saves all the pages without opening them and i want a progressbar in the middle of the header like the current but progress for every request so the user knows how many requests he have done and if the user changes something then click save i want the sonner and the save to work not loading forever and when the network everything is fired the most important things is to never redirect him to auth if the network fails and he's offline i want him to keep working until the network returns with a perfect progressbar with the requests count so he knows how many works he has done"

---

## Context

Shop operators and staff use the Ordrat dashboard for 12+ hours per day in environments with unreliable connectivity. They work entirely offline, accumulating changes throughout the day, then reconnect at day's end to push everything to the server. The current system redirects users to the sign-in page when the session cannot be verified while offline — this destroys their work session and forces a login that cannot succeed without network. This feature eliminates that failure mode and delivers a complete offline-first experience.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Uninterrupted Session During Network Outage (Priority: P1)

A shop operator opens the dashboard at 8 AM and the internet goes down at 9 AM. They must continue working — browsing pages, viewing cached data, making edits — until 8 PM when they reconnect. At no point should the app redirect them to the sign-in page or show an error that blocks their workflow.

**Why this priority**: This is the most critical failure today. A forced sign-in while offline destroys the entire work session and any unsaved state. Without fixing this, the entire offline story breaks.

**Independent Test**: Can be tested by disabling the network immediately after logging in and navigating the dashboard for several minutes. Passes if no auth redirect occurs and pages remain accessible.

**Acceptance Scenarios**:

1. **Given** the user is logged in and the network goes offline, **When** they navigate between dashboard pages, **Then** pages load from cache with no redirect to sign-in.
2. **Given** the user's session token would normally expire or fail to refresh while offline, **When** any page or background process attempts to validate the session, **Then** the existing session is preserved and no redirect occurs.
3. **Given** the user is offline for 12+ hours, **When** they attempt to access any previously visited dashboard page, **Then** the page loads from cache and remains fully functional.
4. **Given** the user was offline and then regains network access, **When** the connection is restored, **Then** the session is silently re-validated without requiring a new sign-in.

---

### User Story 2 — Pre-Cache All Dashboard Pages Before Going Offline (Priority: P2)

Before a planned network outage (or as a precaution), an operator clicks the existing "Cache Offline" button. This triggers a background process that pre-fetches and caches every dashboard page and its data — without the user having to manually navigate to each one.

**Why this priority**: Without pre-caching, users can only access pages they happened to visit before losing connectivity. Pre-caching guarantees full access to all pages regardless of browsing history.

**Independent Test**: Can be tested by clicking the cache button with network available, then disabling network, then navigating to a page that was never visited. Passes if the page loads correctly from cache.

**Acceptance Scenarios**:

1. **Given** the user clicks the "Cache Offline" button while connected, **When** the caching process starts, **Then** a visible progress indicator shows how many pages have been cached out of the total.
2. **Given** the caching process is running, **When** each page and its data is successfully cached, **Then** the progress indicator advances to reflect the completed page.
3. **Given** caching completes, **When** the user goes offline and visits any dashboard page (including ones never opened), **Then** the page loads successfully from cache.
4. **Given** caching is in progress, **When** the user navigates away or the network drops, **Then** the caching process handles interruption gracefully and reports its last known state.

---

### User Story 3 — Offline Save Queue with Pending Request Counter (Priority: P3)

When a user edits data (e.g., updates a product price, marks an order as complete) and presses Save while offline, the change is queued immediately. The save action does not hang or spin forever. A counter in the header shows the number of pending operations, so the user knows how much unsaved work is accumulated.

**Why this priority**: Without this, the save button either hangs indefinitely (UX failure) or silently discards the change (data loss). The counter gives operators confidence that their work is recorded and waiting.

**Independent Test**: Can be tested by going offline, making 3 separate edits and saving each one, then checking that the pending counter shows 3 and none of the save buttons hang.

**Acceptance Scenarios**:

1. **Given** the user is offline and edits a record and presses Save, **When** the save is submitted, **Then** the form/button immediately confirms the action (no infinite spinner) and a toast notification indicates the change is queued.
2. **Given** one or more saves are pending in the offline queue, **When** the user views the header, **Then** a counter shows the exact number of pending operations.
3. **Given** pending operations are queued, **When** the user continues making additional saves while offline, **Then** the counter increments for each new queued operation.
4. **Given** the counter shows pending operations, **When** the user hovers or taps the counter, **Then** a summary of queued actions is shown (what was changed, how many items).

---

### User Story 4 — Automatic Sync on Reconnect (Priority: P4)

When the network is restored, all queued offline mutations are automatically sent to the server in the background, without requiring any user action. The header counter decrements as operations complete, and a final notification confirms that all pending changes have been saved.

**Why this priority**: The entire offline queue is worthless if users have to manually trigger the sync. Auto-sync closes the loop and delivers the promise of offline-first.

**Independent Test**: Can be tested by queuing 3 offline changes, then re-enabling the network. Passes if all 3 operations complete automatically and the counter reaches zero.

**Acceptance Scenarios**:

1. **Given** the user has pending offline operations and the network is restored, **When** connectivity returns, **Then** all queued operations are automatically sent to the server without user interaction.
2. **Given** sync is in progress, **When** each operation completes successfully, **Then** the pending counter decrements by one and a brief confirmation is shown.
3. **Given** all pending operations have been synced, **When** sync completes, **Then** the counter disappears and a toast notification confirms all changes were saved.
4. **Given** a queued operation fails during sync (e.g., server rejects it), **When** the failure occurs, **Then** the user is notified with a specific error and the failed item remains in the queue for retry.
5. **Given** sync fails for some operations, **When** the user reviews the queue, **Then** they can retry failed items individually.

---

### Edge Cases

- What happens if the session token expires while offline and the user reconnects after the token TTL? The app must attempt silent refresh using the refresh token without forcing a sign-in page.
- What happens if the device has very limited storage and cannot cache all pages? The caching process must report success/partial-success counts and not crash silently.
- What happens if two conflicting edits are queued (same record edited twice offline)? The most recent edit wins; the older duplicate is discarded before sync.
- What happens if the app is closed mid-offline session and reopened? The queue and session must survive a full browser/app restart.
- What happens if the server rejects a queued operation with a validation error after sync? The error must be surfaced to the user clearly so they can correct and re-submit.
- What happens to the pending counter when there are zero operations? The counter element is hidden entirely — it must not show "0".
- What happens if the user clicks "Cache Offline" multiple times? Subsequent clicks trigger a cache refresh, not duplicate cache entries.

---

## Clarifications

### Session 2026-03-28

- Q: When online, how should save operations work vs. when offline? → A: Online saves go directly to server (normal API call, instant success/fail). Offline detection happens *before* the fetch — if offline, skip the API call entirely and queue immediately with a toast confirmation. No loading spinner for offline saves.
- Q: If an online save fails (server error or timeout while online), should it be queued or shown as an error? → A: Show error toast immediately ("Save failed — try again"). Do not queue. User retries manually. Auto-queueing only applies to confirmed-offline scenarios.
- Q: What should the header indicator show? → A: Pending offline queue count at rest (e.g., "5 pending") + animated progress bar during active sync showing X of Y completed. Hidden entirely when the queue is empty.
- Q: For online saves, should the UI be optimistic (show success immediately) or pessimistic (spinner until server confirms)? → A: Pessimistic — show loading spinner on Save button until server responds. Success or error toast on completion. Builds trust in a business dashboard context.
- Q: If the refresh token expires during an extended offline session, what happens on reconnect? → A: Never redirect while offline regardless of token age. On reconnect, attempt silent refresh first. Only redirect to sign-in if the refresh token is confirmed expired (requires network to verify) — redirect is acceptable at that point since the user has connectivity to re-auth.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST preserve the user's authenticated session across network outages without redirecting to the sign-in page, regardless of how long the device has been offline or whether the access token has expired.
- **FR-002**: While offline, the system MUST never trigger a logout or auth redirect for any reason. On reconnect, the system MUST attempt silent token refresh first. A redirect to sign-in is only permitted if the network is available AND the refresh token is confirmed expired.
- **FR-003**: The "Cache Offline" button MUST trigger background pre-caching of all dashboard pages and their data without requiring the user to visit each page.
- **FR-004**: The pre-caching process MUST display a progress indicator showing pages cached vs. total pages during the caching operation.
- **FR-005**: Before every save/mutation, the system MUST check network availability. If online, the request fires immediately as a normal API call with a loading indicator that resolves on success or error. If offline, the system MUST skip the API call entirely, queue the operation locally, and immediately confirm the action to the user (no loading spinner, no indefinite wait).
- **FR-006**: The header MUST display a pending operation counter showing how many saves are queued and awaiting network sync. While sync is in progress, the counter MUST transition to an animated progress bar showing "X of Y synced."
- **FR-007**: The pending counter and progress bar MUST be hidden entirely when the offline queue is empty.
- **FR-008**: When network connectivity is restored, the system MUST automatically begin syncing all queued offline operations to the server.
- **FR-009**: The sync progress bar MUST advance as each operation completes, and revert to the idle pending count if sync is paused (e.g., network drops mid-sync).
- **FR-010**: Upon completing all sync operations, the system MUST display a confirmation toast notification.
- **FR-011**: If any sync operation fails during reconnect sync, the system MUST notify the user and retain the failed operation in the queue for retry. Online save failures (while connected) MUST show an error toast immediately and NOT be added to the offline queue.
- **FR-012**: The offline queue MUST persist across page refreshes and app restarts.
- **FR-013**: The system MUST silently attempt session refresh when connectivity is restored, without navigating the user away.
- **FR-014**: The pre-cache process MUST handle storage limits gracefully by reporting how many pages were successfully cached before storage was exhausted.

### Key Entities

- **Offline Queue**: A persistent collection of pending save operations, each containing the request details, timestamp, retry count, and status (pending / failed).
- **Session Cache**: A locally persisted copy of the user's auth credentials sufficient to maintain app state through a network outage.
- **Page Cache**: A snapshot of all dashboard pages and their API data captured during the pre-cache operation.
- **Sync State**: The current status of offline-to-online sync including total pending, completed, and failed counts.
- **Pending Counter / Sync Progress Bar**: A header-level visual element. At rest: shows count of pending offline operations. During active sync: transitions to an animated progress bar showing "X of Y synced." Hidden entirely when the queue is empty.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users working offline for 12 hours experience zero forced sign-in redirects caused by network unavailability.
- **SC-002**: After clicking "Cache Offline," 100% of dashboard pages are accessible offline without requiring a prior manual visit to each page.
- **SC-003**: Save actions while offline respond within 500ms with a visual confirmation — no loading spinner persists beyond that point.
- **SC-004**: The pending operation counter accurately reflects the queue depth at all times, with no more than 1 second lag after a new save is queued.
- **SC-005**: When network is restored, all queued operations begin syncing within 5 seconds of connectivity detection, without any user action.
- **SC-006**: Zero data loss — every offline save that was queued is either successfully synced or surfaced to the user as a recoverable error.
- **SC-007**: The offline queue survives a full browser restart with all pending operations intact and ready to sync when connectivity returns.
- **SC-008**: Lighthouse PWA audit score remains at 100 after all changes are deployed.

---

## Assumptions

- The app already has a service worker and a "Cache Offline" button partially implemented — this feature extends and completes that existing work.
- The backend API supports idempotent save operations (or uses IDs that allow duplicate detection to prevent double-submission on retry).
- The user's session includes a refresh token that remains valid for at least 24 hours — sufficient to cover one full offline work day.
- The total number of dashboard pages to pre-cache is finite and discoverable via the sidebar navigation configuration.
- The offline queue is stored in persistent browser storage — not in memory only — so it survives restarts.
- Conflict resolution policy is "last write wins" for the same entity edited multiple times while offline.
- All mutation operations (save, update, delete) are eligible for offline queueing; read-only data is served from the page cache.
