# Step 1 Scaffolding Implementation Plan

## Objective
Create the project scaffold for the D&D party app without implementing product features yet. The outcome of this step is a stable, reviewable foundation for a full-stack mobile application using Expo, Supabase, and local SQLite.

This step intentionally excludes feature-complete flows such as character creation, campaign invites, compendium search, or sync replay behavior beyond interface and structure setup.

## Confirmed Decisions
- Stack: Expo + React Native + TypeScript for the client, Supabase for backend services.
- Service type: full-stack mobile app backed by managed backend services.
- Database: PostgreSQL in Supabase plus SQLite on device.
- Integration style: typed client with React Query over Supabase-backed service boundaries.
- Real-time method: Supabase Realtime.
- Auth: Supabase Auth with magic-link sign-in.
- Permissions: DM is read-only over player characters in v1.
- Rules baseline: 2024-first with legacy 2014 content allowed and labeled.

## Architectural Decisions For Scaffolding

### Project Structure
Feature-first.

Reason: the app domains are already well defined and map cleanly to feature modules: `auth`, `campaigns`, `characters`, `builder`, `status`, `dm-dashboard`, `compendium`, and `sync`.

### API Client Approach
Typed client plus React Query.

Reason: the client needs clear server-state handling, optimistic updates, caching, and later offline coordination, while keeping transport details outside screens.

### Auth Strategy
Supabase session auth using email and password for manually created users.

Reason: it matches the private login-only access model while still using managed auth infrastructure.

### Real-Time Strategy
Supabase Realtime subscriptions.

Reason: shared campaign state and live DM visibility require near-real-time updates without building a custom WebSocket layer in the first milestone.

### Error Handling Strategy
Typed domain errors with centralized error mapping.

Reason: sync, validation, permission, and connectivity failures need predictable user-safe handling across shared infrastructure and features.

## Scope Boundary

### Included In Step 1
- Project initialization and package setup.
- Expo Router app shell.
- Shared provider composition.
- Environment/config loading and validation.
- Supabase client bootstrap.
- SQLite bootstrap and local schema creation strategy.
- Shared error model.
- Feature-first folder structure.
- Placeholder domain contracts and repository/service boundaries.
- Minimal navigable placeholder screens for core app sections.

### Explicitly Excluded From Step 1
- Full campaign creation and invite workflows.
- Full character builder implementation.
- Full compendium ingestion/search implementation.
- Complete offline sync engine behavior.
- Snapshot generation implementation.
- Production polish, analytics, and observability depth beyond scaffold hooks.

## Deliverables

### 1. Mobile App Foundation
Create the Expo app scaffold with:
- Expo Router entry setup.
- Root layout.
- authenticated and unauthenticated route groups.
- baseline app theme and screen shell.
- core providers for query, auth/session, and shared app context.

### 2. Shared Infrastructure
Create shared infrastructure modules for:
- runtime config and environment access.
- Supabase client creation.
- SQLite initialization.
- query client configuration.
- error types and mapping utilities.
- basic logging abstraction.
- reusable UI primitives for loading, empty, and error states.

### 3. Domain Contracts
Define TypeScript contracts for core entities:
- `Campaign`
- `CampaignMember`
- `Character`
- `CharacterBuild`
- `CharacterStatus`
- `CharacterSnapshot`
- `CompendiumEntry`
- `PendingMutation`

These are contracts only in step 1, not full logic implementations.

### 4. Repository And Service Boundaries
Define interfaces or module boundaries for:
- `AuthRepository`
- `CampaignRepository`
- `CharacterRepository`
- `StatusRepository`
- `CompendiumRepository`
- `SyncRepository`

Define service-level modules that depend on repositories rather than directly on screens or transport details.

### 5. Feature-First Folder Structure
Create initial feature folders with a consistent internal layout for:
- `screens`
- `hooks`
- `services`
- `repositories`
- `adapters`
- `types`

Not every feature needs every file populated in step 1, but the structure should exist and be consistent.

## Proposed Folder Structure

```text
app/
  _layout.tsx
  index.tsx
  (auth)/
    _layout.tsx
    sign-in.tsx
  (app)/
    _layout.tsx
    index.tsx
    campaigns/
    characters/
    compendium/
    dm/

src/
  features/
    auth/
      screens/
      hooks/
      services/
      repositories/
      adapters/
      types/
    campaigns/
      screens/
      hooks/
      services/
      repositories/
      adapters/
      types/
    characters/
      screens/
      hooks/
      services/
      repositories/
      adapters/
      types/
    builder/
      screens/
      hooks/
      services/
      types/
    status/
      screens/
      hooks/
      services/
      repositories/
      adapters/
      types/
    dm-dashboard/
      screens/
      hooks/
      services/
      repositories/
      adapters/
      types/
    compendium/
      screens/
      hooks/
      services/
      repositories/
      adapters/
      types/
    sync/
      services/
      repositories/
      adapters/
      types/
  shared/
    config/
    db/
    supabase/
    query/
    errors/
    logging/
    ui/
    utils/
    types/
    constants/
```

## Layering Rules

### Screens
- Compose UI.
- Read params and navigation state.
- Call hooks.
- Do not perform direct storage/network work.

### Hooks
- Expose screen-friendly state and actions.
- Wrap React Query and feature services.
- Keep UI consumption simple.

### Services
- Hold feature use cases and orchestration.
- Depend on repositories and shared utilities.
- Avoid React and navigation dependencies.

### Repositories
- Define data access contracts.
- Hide whether data comes from SQLite, Supabase, or memory.

### Adapters
- Concrete implementations for local and remote data access.
- Map infrastructure models to domain contracts.

### Shared
- Contain cross-feature infrastructure and primitives only.
- Avoid feature-specific business rules.

## Shared Modules To Scaffold

### Config
Files to plan:
- `src/shared/config/env.ts`
- `src/shared/config/runtime.ts`

Responsibilities:
- read environment values once.
- validate required values at startup.
- expose typed configuration to the app.

### Supabase
Files to plan:
- `src/shared/supabase/client.ts`
- `src/shared/supabase/auth.ts`
- `src/shared/supabase/realtime.ts`

Responsibilities:
- initialize a single app-owned client.
- centralize auth/session wiring.
- centralize realtime subscription helpers.

### Local Database
Files to plan:
- `src/shared/db/sqlite.ts`
- `src/shared/db/migrations/`

Responsibilities:
- initialize local persistence.
- create baseline tables for cached entities and pending mutations.
- provide a single local database access path.

### Query Layer
Files to plan:
- `src/shared/query/client.ts`
- `src/shared/query/keys.ts`

Responsibilities:
- create the shared React Query client.
- standardize query keys and cache conventions.

### Errors
Files to plan:
- `src/shared/errors/app-error.ts`
- `src/shared/errors/error-codes.ts`
- `src/shared/errors/map-error.ts`

Responsibilities:
- define app-safe error categories.
- normalize infrastructure errors into domain-safe forms.

### UI Primitives
Files to plan:
- `src/shared/ui/screen.tsx`
- `src/shared/ui/loading-state.tsx`
- `src/shared/ui/error-state.tsx`
- `src/shared/ui/empty-state.tsx`

Responsibilities:
- provide a consistent shell for placeholder screens and future features.

## Local Persistence Plan
Step 1 should establish the schema direction for:
- `campaigns`
- `campaign_members`
- `characters`
- `character_builds`
- `character_statuses`
- `character_snapshots`
- `compendium_entries`
- `pending_mutations`
- `sync_metadata`

This step should only create the structural baseline and initialization path, not the full sync engine.

## Navigation Plan
Use route groups:
- `(auth)` for session entry.
- `(app)` for signed-in flows.

Initial top-level destinations to scaffold:
- home
- campaigns
- characters
- compendium
- dm dashboard

Whether the final UX becomes tab-first or campaign-first can remain flexible as long as the route structure does not block either direction.

## Acceptance Criteria
- The project can install dependencies cleanly.
- The Expo app boots into a minimal shell.
- The route groups and base screens exist.
- Shared providers are wired in the root layout.
- Environment config fails fast if required values are missing.
- Supabase bootstrap is centralized.
- SQLite bootstrap is centralized.
- Feature-first folders exist and are consistent.
- Core domain contracts exist for the main entities.
- Screens do not directly depend on storage/network details.

## Remaining Uncertainties
These do not block step 1, but should stay visible:

1. Supabase server logic boundary
- Unclear how much logic will eventually live in SQL/functions versus app-owned server code.

2. Local database abstraction depth
- Unclear whether the project should use raw SQLite access, a lightweight typed wrapper, or a fuller abstraction.

3. Final primary navigation pattern
- The app may end up tabs-first or campaign-first depending on later UX choices.

4. Snapshot generation ownership
- Unclear whether snapshot generation should live in triggers, functions, or another application layer.

5. Test harness timing
- Unclear whether scaffold-level test setup should be done in step 1 or alongside the first vertical slice.

## Recommendation
Proceed with step 1 as a pure foundation pass. Favor the smallest scaffold that establishes clean boundaries, app bootstrapping, and future-safe feature organization without implementing product behavior prematurely.
