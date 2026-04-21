# Step 1 Scaffolding Execution Steps

## Goal
Execute the scaffolding phase in a controlled sequence so the repository ends with a bootable mobile app foundation, clear domain boundaries, and no accidental feature overreach.

## Execution Rules
- Do not implement feature-complete user flows in this phase.
- Do not collapse feature boundaries for speed.
- Prefer the smallest working scaffold in each step.
- Keep transport, storage, and UI concerns separated from the start.
- Validate the scaffold after each major milestone instead of waiting until the end.

## Step-By-Step Execution Sequence

### 1. Initialize The Project Shell
- Create the Expo TypeScript application scaffold in the repo root.
- Configure Expo Router as the app entry.
- Establish baseline config files such as TypeScript config and package scripts.
- Verify the project installs and starts.

Output:
- bootable Expo project with routing support.

### 2. Add Core Dependencies
Install and lock the initial dependency set for:
- routing
- Supabase client access
- React Query
- SQLite access
- form and validation support
- basic mobile UI support libraries required by the chosen app shell

Output:
- dependency baseline aligned with the architecture.

### 3. Create The Feature-First Folder Structure
- Create `app/` route groups.
- Create `src/features/` modules for each core domain.
- Create `src/shared/` infrastructure folders.
- Add placeholder files where needed so the structure is explicit and reviewable.

Output:
- repository layout that matches the intended architecture.

### 4. Wire Shared Providers At The Root
- Add the root app layout.
- Compose global providers for query, auth/session bootstrap, and other shared app concerns.
- Ensure the app can render a placeholder screen through the provider tree.

Output:
- stable root composition point for the app.

### 5. Implement Typed Runtime Configuration
- Add environment access and validation files.
- Define required runtime variables for Supabase and app environment settings.
- Make startup fail clearly when required values are missing.

Output:
- centralized, typed config that removes scattered environment usage.

### 6. Bootstrap Supabase Integration
- Create a shared Supabase client module.
- Add session bootstrap helpers and placeholders for auth state handling.
- Define where realtime subscription helpers will live.

Output:
- one clear infrastructure path for backend access.

### 7. Bootstrap Local SQLite
- Add shared SQLite initialization.
- Create the initial local schema setup or migration entry point.
- Define the baseline tables for cached data and pending mutations.

Output:
- one clear infrastructure path for offline persistence.

### 8. Add Shared Error Handling And Logging Baselines
- Define shared typed error classes or equivalents.
- Add error code constants and mapping helpers.
- Add a minimal logging abstraction appropriate for the app environment.

Output:
- predictable infrastructure error handling path.

### 9. Add Shared Query Conventions
- Create the shared React Query client.
- Establish query key conventions.
- Create placeholders for mutation/retry policies that will support later offline work.

Output:
- consistent server-state foundation.

### 10. Define Core Domain Contracts
- Add core entity types for campaigns, characters, status, snapshots, compendium entries, and pending mutations.
- Keep them minimal and aligned with the product specification.
- Avoid speculative fields that are not justified by the docs.

Output:
- domain contracts ready for repositories and services.

### 11. Define Repository And Service Boundaries
- Create repository interfaces or modules for each core domain.
- Create service modules that consume repositories.
- Keep these as boundaries and placeholders where implementation would be premature.

Output:
- clean layering before behavior is added.

### 12. Create Placeholder Routes And Screens
- Add minimal screens for auth, home, campaigns, characters, compendium, and DM dashboard.
- Use shared UI primitives for loading, empty, and error placeholders where appropriate.
- Ensure navigation structure reflects the intended product areas.

Output:
- reviewable app navigation shell.

### 13. Verify The Scaffold
- Install dependencies.
- run the app bootstrap/build checks that are appropriate for Expo.
- confirm the app renders and routes load.
- confirm required config validation behaves as expected.
- confirm shared modules import cleanly and TypeScript compiles.

Output:
- validated step 1 scaffold.

## Suggested Dependency Baseline
The exact package list can be finalized during execution, but the initial set should likely cover:
- Expo Router
- React Query
- Supabase JS client
- SQLite package for Expo
- Zod
- React Hook Form
- safe area and screen support dependencies required by Expo Router

Optional additions can be deferred if not required for the shell to boot.

## Review Checklist Before Executing Step 1
- The scope is still scaffold-only.
- The folder structure is acceptable.
- The route grouping approach is acceptable.
- The shared infrastructure modules are acceptable.
- The domain contract list is acceptable.
- No unresolved uncertainty blocks project initialization.

## Risks During Execution

### Risk 1: Overbuilding Early
Mitigation:
- stop at boundaries and placeholders when real behavior would require product decisions from later phases.

### Risk 2: Choosing Too Much Infrastructure Too Soon
Mitigation:
- only install and wire dependencies needed for app boot, routing, config, data bootstrap, and shared state.

### Risk 3: Mixing UI And Data Concerns
Mitigation:
- keep screens thin and route all future data access through hooks, services, and repositories.

### Risk 4: Local Storage Design Drift
Mitigation:
- define the local schema direction now, but keep sync logic minimal until the first vertical slice.

## Exit Criteria
Step 1 is complete when all of the following are true:
- the app boots successfully.
- the feature-first structure exists.
- shared providers and config are wired.
- Supabase bootstrap exists.
- SQLite bootstrap exists.
- core domain contracts exist.
- repository/service boundaries exist.
- placeholder routes for main product surfaces exist.
- no feature-complete workflows were implemented accidentally.

## After Approval
Once these two artifacts are approved, the next action should be to execute the scaffold in the exact order above and verify after each milestone rather than batching all changes blindly.
