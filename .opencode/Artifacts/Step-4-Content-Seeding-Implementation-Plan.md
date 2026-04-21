# Step 4 Content Seeding Implementation Plan

## Objective
Integrate the generated 5etools content bundle into the native app runtime by seeding normalized content into local SQLite and exposing repository and service access for builder and compendium use.

The outcome of this step is a local content runtime that can read the generated `generated/5etools/` bundle, persist it to SQLite, track content version state, and answer core queries for character creation and compendium browsing without network access.

This step intentionally stops at runtime content integration. It does not yet implement the builder UI or compendium UI surfaces.

## Confirmed Decisions
- Content source: checked-in generated files under `generated/5etools/`.
- Runtime target: native only.
- Rules policy: 2024-first builder visibility.
- Import strategy: build-time generated bundle, runtime local seeding.
- Builder scope to support soon after seeding:
  - species
  - classes and subclasses
  - feats
  - fighting styles
  - eldritch invocations
  - spells
  - items

## Product Boundary

### Included In Step 4
- SQLite schema additions for normalized local content.
- Content-version and seed-state tracking.
- Native bootstrap integration for content seeding.
- Seed import from generated chunk files.
- Repository and service boundaries for local content queries.
- Initial query methods for builder and compendium consumption.
- Verification that seeding is idempotent and version-aware.

### Explicitly Excluded From Step 4
- Builder screen implementation.
- Compendium screen implementation.
- Full search UI.
- Character creation flow UI.
- Advanced runtime rules engine behavior.
- Sync of content to Supabase.

## Feature Goals
- The app seeds generated content locally on native startup when needed.
- The app skips reseeding when the content version is already current.
- The local DB becomes the single runtime source of truth for imported rules content.
- Builder-oriented queries return 2024-first results from seeded local data.
- Compendium content is locally queryable for later UI use.

## Architectural Approach

### Runtime Content Flow
Use the generated manifest and chunk files as the runtime seed source.

Flow:
1. App bootstrap opens SQLite.
2. App checks current seeded content version.
3. If the bundled version is newer or missing, seed the generated chunk files.
4. Update seed metadata after successful import.
5. Runtime repositories query SQLite, not JSON files directly.

### Seeding Strategy
Use manifest-driven, chunk-based seeding.

Reason:
- keeps runtime aligned with the build output contract
- allows batching and easier debugging
- supports future partial reseed or migration handling

### Runtime Access Strategy
Expose repository methods over SQLite-backed content tables.

Reason:
- keeps screens and services independent from storage details
- preserves the existing repository and service architecture
- allows query behavior to evolve without touching UI code

## Code Areas To Change

### 1. SQLite Schema
Extend the local schema to support normalized content entities and seed metadata.

Expected additions:
- content table(s) for normalized entities
- content table(s) for grants
- content table(s) for compendium entries
- metadata table for seeded content version and timestamps

The exact table split can be:
- one table per entity type
- or a smaller number of tables with typed payloads

The preferred approach is the smallest structure that still supports practical querying.

### 2. SQLite Bootstrap
Update local database bootstrap so schema creation includes the new content tables and metadata tables.

Responsibilities:
- create the new schema on first run
- remain compatible with existing bootstrap flow
- prepare the database for seed import

### 3. Seed Metadata Tracking
Add runtime tracking for:
- current seeded content version
- last seeded timestamp
- optional schema version linkage

Responsibilities:
- detect whether seeding is required
- prevent redundant reseeding
- support future migration logic cleanly

### 4. Generated Content Reader
Add a runtime-safe reader for the checked-in generated bundle.

Responsibilities:
- read the manifest
- read chunk files referenced by the manifest
- feed chunks into the seeding pipeline in deterministic order

### 5. Seed Importer
Implement the runtime content importer for SQLite.

Responsibilities:
- load chunk payloads
- insert or replace records safely
- batch writes in transactions
- mark seed state complete only after success

### 6. Content Repositories
Implement SQLite-backed repositories for local content.

Minimum repository responsibilities:
- list species
- list classes
- list subclasses for a class
- list feats by category and visibility
- list optional features by feature type and visibility
- list spells
- list items
- list grants by source entity
- query compendium entries

### 7. Content Services
Add service-level orchestration for builder and compendium use cases.

Responsibilities:
- compose repository queries into screen-friendly methods
- apply builder-specific visibility and filtering rules
- keep screen consumption simple

## Query Scope For This Step

### Builder-Oriented Queries
The first repository and service layer should support:
- all selectable species
- all selectable classes
- subclasses for a selected class
- fighting styles for a class or subclass grant
- eldritch invocations for warlock progression
- feats by category
- spells by class, source, and level where practical
- items for equipment selection

### Compendium-Oriented Queries
The first repository and service layer should support:
- list or query compendium entries by type
- list or query compendium entries by source
- basic text search or search-ready query boundary

Search implementation can remain simple in this step if the UI is not yet consuming it.

## Verification Plan

### Seed Checks
- first app launch seeds the local DB
- later launches skip reseeding when content version matches
- changing bundled content version triggers reseeding

### Data Checks
- seeded species include 2024-first canonical records
- artificer is seeded as the EFA 2024 version
- fighting styles are queryable from feat data
- eldritch invocations are queryable from optional-feature data
- grants are queryable and linked to classes and subclasses correctly

### Technical Checks
- TypeScript compiles cleanly
- bootstrap remains stable
- seeding is transaction-safe
- no screen reads generated JSON directly

## Risks And Tradeoffs
- Seeding a large content bundle on first launch may increase bootstrap time.
- Table design that is too generic may make later queries awkward.
- Table design that is too granular may increase implementation complexity too early.
- Seed failure handling must avoid leaving version metadata in a false-success state.

## Exit Criteria
Step 4 is complete when all of the following are true:
- SQLite schema supports normalized seeded content
- content version metadata is tracked locally
- native bootstrap seeds generated content when required
- repeated startup does not reseed unnecessarily
- repositories and services can query seeded content for builder-critical entities
- artificer, fighting styles, invocations, and species queries reflect the expected 2024-first behavior
- TypeScript and runtime verification pass
