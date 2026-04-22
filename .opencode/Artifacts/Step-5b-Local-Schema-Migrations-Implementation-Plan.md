# Step 5b Local Schema Migrations Implementation Plan

## Objective
Implement a permanent local SQLite schema migration system so existing app installs can evolve safely as the runtime schema changes, without breaking bootstrap or content seeding.

The immediate outcome of this step is a deterministic migration path for `compendium_entries` and any future local schema updates, replacing the current ad hoc compatibility patching approach.

This step intentionally focuses on local database structure and migration flow. It does not add new user-facing features.

## Confirmed Decisions
- Local schema versioning must be tracked separately from bundled content versioning.
- Migrations must run before bundled content seeding.
- Existing installs must be supported without requiring manual app-data deletion.
- `compendium_entries` should be normalized to the current canonical schema through a real migration rather than one-off column patches.
- Since compendium data is reseeded from bundled content, preserving old local compendium rows is not required for the migration to succeed.

## Product Boundary

### Included In Step 5b
- Add local schema version tracking.
- Add a migration registry and ordered migration execution.
- Run migrations during app bootstrap before content seeding.
- Replace partial `compendium_entries` compatibility patching with a permanent migration path.
- Ensure old installs can reach the current schema and seed successfully.

### Explicitly Excluded From Step 5b
- New compendium UI features.
- New builder or DM dashboard features.
- Remote database migrations.
- Changes to bundled content generation logic beyond what is required for local runtime compatibility.

## Feature Goals
- Existing installs no longer fail when local table schemas are older than the current runtime expectations.
- Bootstrap can evolve local DB shape predictably as the app changes.
- The migration system becomes the single place for future local schema upgrades.
- Content seeding can assume the latest schema is already in place.

## Architectural Approach

### Local Versioning Strategy
Track a dedicated local schema version in the local database metadata.

Reason:
- schema structure and content bundle version solve different problems
- local schema changes can happen without changing bundled content and vice versa
- upgrade logic stays explicit and auditable

Recommended metadata keys:
- `local_schema_version`
- `bundled_content_version` remains unchanged for seeding

### Migration Execution Strategy
Run local migrations immediately after opening the database and creating any missing baseline tables, but before the content seed check runs.

Flow:
1. Open SQLite database.
2. Create any missing baseline tables and indexes.
3. Read current local schema version.
4. Run ordered migrations up to the latest version.
5. Persist the new local schema version.
6. Proceed to bundled content seeding.

### `compendium_entries` Migration Strategy
Use a canonical table rebuild or drop-and-recreate approach for `compendium_entries` rather than adding columns one at a time forever.

Reason:
- guarantees current schema shape exactly
- avoids repeated startup failures on the next missing column
- keeps future schema evolution simpler

Because compendium data is reseeded from bundled content, the migration can prioritize structural correctness over preserving old cached rows.

## Code Areas To Change

### 1. Local Schema Version Helpers
Add helpers to:
- read current local schema version
- write updated local schema version
- expose latest supported schema version

Responsibilities:
- keep version metadata explicit
- avoid coupling schema version to content version

### 2. Migration Registry
Add a registry for ordered local migrations.

Responsibilities:
- define migration IDs and execution order
- ensure each migration runs exactly once
- allow later steps to append new local migrations safely

### 3. Bootstrap Integration
Update SQLite bootstrap so migration execution happens before any runtime content seed work.

Responsibilities:
- ensure bootstrap order is deterministic
- fail early and clearly if migration cannot complete

### 4. `compendium_entries` Canonical Migration
Replace the partial compatibility logic for `compendium_entries` with a real migration.

Recommended canonical columns:
- `id`
- `entry_type`
- `entity_id`
- `name`
- `slug`
- `source_code`
- `source_name`
- `rules_edition`
- `is_legacy`
- `is_primary_2024`
- `is_selectable_in_builder`
- `summary`
- `text`
- `search_text`
- `scope`
- `metadata`
- `render_payload`
- `updated_at`

Recommended approach:
- create canonical table shape
- swap to canonical table in a transaction
- recreate indexes
- rely on bundled seed to repopulate data after migration

## Migration Scope For This Step

### Required Migration Coverage
This step must at minimum cover:
- current baseline schema version initialization
- migration to the latest schema version
- guaranteed canonical `compendium_entries` shape

### Future-Proofing Goal
The structure created in this step should be reusable for future local migrations involving:
- content tables
- cached feature tables
- metadata and sync support tables

## Verification Plan

### Upgrade Checks
- an existing install with an older `compendium_entries` table now boots successfully
- migrations run before content seeding
- migrated installs can seed content without schema mismatch failures

### Fresh Install Checks
- a fresh install still boots successfully
- schema version is initialized correctly on first run

### Stability Checks
- repeat launches do not rerun completed migrations unnecessarily
- typecheck passes
- content seed skip behavior still works after migration completes

## Risks And Tradeoffs
- A rebuild-style migration is more work than ad hoc `ALTER TABLE` patches, but it is more reliable long term.
- Dropping and recreating `compendium_entries` means local cached compendium rows are discarded during migration, but that is acceptable because the bundled seed fully restores them.
- Mixing schema-version concerns with content-version concerns would simplify some code in the short term, but would make the system harder to reason about later.

## Exit Criteria
Step 5b is complete when all of the following are true:
- local schema versioning exists
- ordered local migrations exist and run during bootstrap
- `compendium_entries` is guaranteed to reach the canonical schema on old installs
- content seeding runs successfully after migration
- repeat launches do not redo completed migrations unnecessarily
- TypeScript and runtime verification pass
