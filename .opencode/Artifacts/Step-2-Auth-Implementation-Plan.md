# Step 2 Auth Implementation Plan

## Objective
Implement private login-only authentication for the mobile app using Supabase Auth with email and password. This feature must support manually provisioned users only, with no registration flow exposed in the app.

The outcome of this step is a working sign-in and sign-out experience backed by Supabase session management, aligned with the project's route guards and existing auth scaffold.

## Confirmed Decisions
- Auth provider: Supabase Auth.
- Login method: email and password.
- Account provisioning: users are created manually in the Supabase dashboard.
- Email confirmation policy: use Supabase auto-confirm so manually created users do not need a registration or confirmation flow.
- Registration policy: no sign-up flow in the app.
- Password reset policy: out of scope for this step.
- Session policy: persist sessions locally and restore them on app launch.

## Product Boundary

### Included In Step 2
- Email/password sign-in screen behavior.
- Login-only auth repository and service methods.
- Supabase-backed sign-in and sign-out flows.
- Session bootstrap and persisted session restoration.
- Auth route behavior for signed-in and signed-out users.
- Clear user-facing feedback for invalid credentials and auth failures.
- Documentation of required Supabase dashboard settings for private access.

### Explicitly Excluded From Step 2
- User registration.
- Password reset.
- Invite acceptance.
- User profile editing.
- Role or campaign membership loading beyond authenticated session state.
- Custom access-control logic outside of current route guarding.

## Feature Goals
- Only manually created Supabase users can access the app.
- The app presents a login form, not a registration form.
- A valid signed-in session redirects the user into the authenticated app area.
- A signed-out user cannot remain inside authenticated routes.
- Auth errors are mapped to simple user-safe messages.
- The implementation stays narrow and does not leak into campaign or onboarding work.

## Supabase Configuration Requirements
The implementation assumes the following Supabase dashboard setup:

- Email provider enabled.
- Email/password authentication enabled.
- Auto-confirm enabled or equivalent confirmed-user behavior for manually created users.
- Public self-signup disabled.
- Users created manually in the dashboard with email and password.

These settings are required so the client can remain strictly login-only.

## Architectural Approach

### Auth Flow
Use Supabase email/password login with the existing persisted session model.

Flow:
1. User enters email and password.
2. Client submits credentials to Supabase Auth.
3. On success, Supabase returns a session.
4. Auth provider updates app session state.
5. Auth route guard redirects the user into the app shell.

### Session Management
Retain the current approach:
- bootstrap session on app load
- subscribe to auth state changes
- persist session locally with AsyncStorage

This avoids introducing any custom token storage logic.

### Error Handling
Auth failures should be mapped into a small set of UI-safe outcomes:
- invalid credentials
- unconfirmed or unavailable account
- network or service failure
- unexpected auth error

The UI should not expose raw Supabase error strings directly.

## Code Areas To Change

### 1. Auth Contracts
Update the auth contracts to represent login-only credentials.

Expected changes:
- `SignInInput` should include `email` and `password`.
- `AuthRepository` should expose a password sign-in method rather than magic-link login.
- `AuthService` should expose the same login-only method.

### 2. Supabase Auth Adapter
Replace the current OTP login call with Supabase email/password sign-in.

Responsibilities:
- call Supabase sign-in with email and password
- return auth state through the existing session hooks
- preserve sign-out behavior

### 3. Auth Provider
Keep the provider structure intact, but align its exposed method names and loading state with the password login flow.

### 4. Sign-In Screen
Convert the current sign-in screen from magic-link messaging to a true login form.

Requirements:
- email input
- password input
- basic client-side validation
- submit action
- loading state
- user-safe failure feedback
- no sign-up CTA
- no password reset CTA

### 5. Shared Route Boundaries
Preserve the existing route guard behavior and verify it against the completed auth flow:
- signed-out users redirect to auth routes
- signed-in users redirect away from auth routes

## UX Requirements
- The sign-in screen should clearly communicate that this is a private app login.
- Copy should not imply that new users can create accounts themselves.
- Failure states should be concise and actionable.
- Success should rely primarily on navigation state rather than extra confirmation text.

## Verification Plan

### Functional Checks
- Existing manually created user can sign in.
- Invalid password is rejected with a user-safe message.
- Unknown or unauthorized user cannot create an account through the app.
- Sign-out clears session state and returns to the auth route.
- App relaunch restores a valid session.

### Route Checks
- Deep link or direct navigation into `/(app)` while signed out is blocked.
- Visiting auth routes while signed in redirects back into the app.

### Technical Checks
- TypeScript compiles cleanly.
- No magic-link-specific code paths remain in the auth flow.
- No sign-up or password-reset UI is accidentally introduced.

## Risks And Tradeoffs
- Manual user provisioning is simple and controlled, but it creates admin overhead.
- Disabling self-signup is required; otherwise the client-only login restriction is incomplete.
- Password auth is simpler than magic-link auth for a private app, but it introduces password handling in the UI.

## Exit Criteria
Step 2 is complete when all of the following are true:
- the app supports login-only email/password auth through Supabase
- manually created users can sign in successfully
- public self-signup is not supported by the client flow
- signed-in and signed-out route behavior works correctly
- sign-out works correctly
- session persistence works across app restarts
- baseline verification passes
