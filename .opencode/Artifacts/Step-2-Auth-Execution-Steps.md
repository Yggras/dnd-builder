# Step 2 Auth Execution Steps

## Goal
Implement the private login-only authentication flow using Supabase email/password auth for manually provisioned users, without expanding into registration or onboarding work.

## Execution Rules
- Do not add any sign-up flow.
- Do not add password reset in this step.
- Keep the implementation inside the existing auth boundaries.
- Reuse the current session bootstrap and route guard architecture.
- Keep user-facing error handling simple and explicit.
- Verify route behavior and session persistence before calling the feature complete.

## Step-By-Step Execution Sequence

### 1. Confirm Supabase Auth Assumptions
- Confirm the app will use email/password auth.
- Confirm users are created manually in Supabase.
- Confirm self-signup is disabled in Supabase.
- Confirm auto-confirm is enabled or manual users are otherwise confirmed.

Output:
- stable auth assumptions for implementation.

### 2. Update Auth Contracts
- Replace magic-link-oriented contracts with password-login contracts.
- Update any auth input types to include password.
- Rename service and repository methods to reflect the new flow.

Output:
- auth interfaces aligned to login-only password auth.

### 3. Update Supabase Auth Adapter
- Replace OTP sign-in with email/password sign-in.
- Keep session read, auth-state subscription, and sign-out behavior intact.
- Ensure the adapter does not allow implicit account creation.

Output:
- Supabase adapter aligned to private login-only auth.

### 4. Update Auth Provider Surface
- Align provider-exposed auth actions with the new password login method.
- Preserve loading and session bootstrap behavior.

Output:
- app-wide auth context exposes the correct login action.

### 5. Rework The Sign-In Screen
- Add password input.
- Update validation and submit behavior.
- Remove magic-link copy and feedback.
- Keep the screen explicitly login-only.

Output:
- working login form for private users.

### 6. Verify Route Behavior
- Confirm signed-out users are redirected to auth routes.
- Confirm signed-in users are redirected away from auth routes.
- Confirm sign-out returns the app to the signed-out state.

Output:
- route guards verified against the completed auth flow.

### 7. Validate Error Handling
- Verify invalid credentials produce a clean message.
- Verify auth failures do not surface raw infrastructure details.
- Verify loading behavior is stable during login attempts.

Output:
- user-safe auth error handling.

### 8. Run Feature Verification
- Run TypeScript typecheck.
- Test login with a known manually created user.
- Test login rejection with invalid credentials.
- Test session restoration after app reload.
- Test sign-out.

Output:
- validated auth feature baseline.

## Task List
1. Replace magic-link auth contracts with email/password login contracts.
2. Update the Supabase auth adapter to use password sign-in.
3. Align the auth provider API with the new login method.
4. Convert the sign-in screen into a private login form.
5. Map auth failures to user-safe UI messages.
6. Verify signed-in and signed-out route redirects.
7. Run typecheck and manual auth verification.

## Risks During Execution

### Risk 1: Self-Signup Still Enabled In Supabase
Mitigation:
- verify dashboard auth settings before implementation is considered complete.

### Risk 2: Error Messages Become Too Infrastructure-Specific
Mitigation:
- map Supabase auth failures to a narrow set of UI-safe messages.

### Risk 3: Route Guards Drift From Session State
Mitigation:
- explicitly verify both auth and app route groups after login and sign-out.

### Risk 4: Scope Creep Into Onboarding Or Membership
Mitigation:
- stop at authenticated session behavior only.

## Exit Criteria
Step 2 is complete when:
- login works for manually created Supabase users
- no registration path exists in the app
- no password reset path exists in the app
- sessions persist correctly
- sign-out works correctly
- route guarding behaves correctly
- verification passes
