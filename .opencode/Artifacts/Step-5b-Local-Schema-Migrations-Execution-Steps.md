# Step 5b Local Schema Migrations Execution Steps

## Goal
Execute the permanent local SQLite migration phase in a controlled sequence so existing installs can upgrade to the current runtime schema safely before bundled content seeding runs.

## Execution Rules
- Do not rely on one-off column patches as the long-term solution.
- Keep local schema version tracking separate from bundled content version tracking.
- Run migrations before content seeding.
- Prefer deterministic table rebuilds over repeated reactive fixes for `compendium_entries`.
- Keep migration logic transactional wherever practical.

## Step-By-Step Execution Sequence

### 1. Confirm The Local Migration Contract
- Confirm local schema versioning is independent from content bundle versioning.
- Confirm migrations must complete before seeding.
- Confirm `compendium_entries` is the first table that requires a canonical migration path.

Output:
- stable migration contract for local SQLite evolution.

### 2. Add Local Schema Version Metadata
- Define the latest supported local schema version.
- Add read and write helpers for `local_schema_version`.
- Initialize the version correctly on fresh installs.

Output:
- explicit local schema version tracking.

### 3. Create The Migration Registry
- Add ordered migration definitions.
- Add runner logic that executes migrations from current version to latest version.
- Ensure each completed migration updates local schema version state.

Output:
- reusable migration execution framework.

### 4. Integrate Migrations Into SQLite Bootstrap
- Run migrations after baseline table creation.
- Ensure this happens before any bundled content seed check.
- Keep bootstrap failures explicit and observable.

Output:
- deterministic bootstrap order for schema upgrades.

### 5. Implement Canonical `compendium_entries` Migration
- Rebuild or recreate `compendium_entries` to the exact current schema.
- Recreate any required indexes.
- Do not depend on the old table already having modern columns.

Output:
- old installs can reach the required compendium schema safely.

### 6. Reduce Or Remove Ad Hoc Compatibility Logic
- Remove one-off migration behavior that is now covered by the migration system.
- Keep only minimal transitional compatibility logic if absolutely necessary.

Output:
- one clear path for local schema evolution.

### 7. Verify Upgrade Behavior On Existing Installs
- Start the app against an older local database.
- Confirm migration runs before seeding.
- Confirm content seeding succeeds after migration.

Output:
- existing-install upgrade path verified.

### 8. Verify Fresh Install Behavior
- Start the app with no existing local database.
- Confirm baseline schema and local schema version initialize correctly.
- Confirm seeding still works on first run.

Output:
- fresh-install bootstrap behavior verified.

### 9. Verify Repeat Startup Behavior
- Relaunch after successful migration and seeding.
- Confirm migrations do not rerun unnecessarily.
- Confirm normal seed-skip behavior still works.

Output:
- stable repeat-launch behavior verified.

### 10. Run Technical Verification
- Run TypeScript typecheck.
- Confirm bootstrap remains clean and maintainable.
- Ensure future migration additions have an obvious place to live.

Output:
- validated Step 5b migration baseline.

## Task List
1. Confirm the local migration contract.
2. Add local schema version helpers.
3. Create the migration registry and runner.
4. Integrate migrations into SQLite bootstrap.
5. Implement canonical `compendium_entries` migration.
6. Reduce or remove ad hoc compatibility patches.
7. Verify upgrade behavior on existing installs.
8. Verify fresh-install behavior.
9. Verify repeat-launch behavior.
10. Run typecheck and final technical verification.

## Risks During Execution

### Risk 1: Schema Version And Content Version Become Coupled
Mitigation:
- keep separate metadata keys and separate responsibilities.

### Risk 2: Migration Logic Assumes Too Much About Old Table Shapes
Mitigation:
- rebuild `compendium_entries` to the canonical shape instead of assuming specific intermediate versions.

### Risk 3: Bootstrap Order Regresses
Mitigation:
- enforce the sequence: create baseline tables, migrate schema, then seed content.

### Risk 4: Old Cached Compendium Rows Are Lost During Migration
Mitigation:
- accept this tradeoff because bundled content seeding restores the table immediately after migration.

## Exit Criteria
Step 5b is complete when:
- local schema versioning is implemented
- migrations run before content seeding
- `compendium_entries` reaches the canonical schema on old installs
- existing installs stop failing on missing column errors
- repeat launches do not rerun completed migrations unnecessarily
- typecheck and runtime verification pass
