# Step 4 Content Seeding Execution Steps

## Goal
Execute the runtime content integration phase in a controlled sequence so the native app can seed and query the generated 5etools bundle locally through SQLite, without jumping ahead into builder UI or compendium UI implementation.

## Execution Rules
- Do not implement builder screens in this step.
- Do not implement compendium screens in this step.
- Do not bypass SQLite by reading generated JSON directly from feature code.
- Keep seed logic manifest-driven and version-aware.
- Keep seeding idempotent and transactional.
- Verify the runtime content path before layering UI on top.

## Step-By-Step Execution Sequence

### 1. Confirm Runtime Content Contract
- Confirm `generated/5etools/content-index.json` is the runtime entrypoint.
- Confirm chunk files are the only seed input.
- Confirm SQLite is the runtime source of truth after seeding.

Output:
- stable runtime contract for content integration.

### 2. Extend SQLite Schema
- Add local tables for normalized content entities.
- Add local tables for grants and compendium entries.
- Add local metadata table for content-version tracking.

Output:
- local database schema ready for generated content seeding.

### 3. Add Seed Metadata Handling
- Add read and write helpers for seeded content version.
- Add detection logic for first run, stale version, and current version.
- Ensure incomplete seeds do not falsely mark success.

Output:
- reliable version-aware seeding checks.

### 4. Implement Generated Content Reader
- Read the manifest.
- Read chunk files in deterministic order.
- Expose a seed input stream or equivalent structure to the importer.

Output:
- runtime layer can consume checked-in generated content safely.

### 5. Implement SQLite Seed Importer
- Import chunk records into the appropriate tables.
- Use transactions and batching.
- Insert or replace records safely.
- Only mark the content version after successful completion.

Output:
- one reliable runtime seeding path.

### 6. Integrate Seeding Into App Bootstrap
- Run content-version checks during app bootstrap.
- Trigger seeding only when needed.
- Keep bootstrap failure handling explicit and user-safe.

Output:
- native app startup includes content readiness.

### 7. Implement Content Repositories
- Add SQLite-backed repository methods for:
  - species
  - classes
  - subclasses
  - feats
  - optional features
  - spells
  - items
  - grants
  - compendium entries

Output:
- local content access layer ready for services.

### 8. Implement Content Services
- Add service methods for builder-oriented queries.
- Add service methods for compendium-oriented queries.
- Keep services screen-friendly and storage-agnostic.

Output:
- reusable runtime content orchestration layer.

### 9. Verify Seed Behavior
- Test first-run seeding.
- Test repeat startup without reseeding.
- Test version-triggered reseeding.
- Confirm metadata updates correctly.

Output:
- seeding behavior verified.

### 10. Verify Builder-Critical Query Results
- Confirm selectable species reflect 2024-first policy.
- Confirm artificer resolves to EFA.
- Confirm fighting styles resolve from feat data.
- Confirm eldritch invocations resolve from optional-feature data.
- Confirm grants return expected level-based selections.

Output:
- core runtime content queries verified.

### 11. Run Technical Verification
- Run TypeScript typecheck.
- Run any practical bootstrap and runtime checks available.
- Ensure repository imports are clean and storage boundaries remain intact.

Output:
- validated Step 4 runtime integration baseline.

## Task List
1. Extend local SQLite schema for content tables and metadata.
2. Add seed-version read and write helpers.
3. Add a generated-content manifest reader.
4. Add chunk readers for runtime seed input.
5. Implement transactional SQLite content seeding.
6. Integrate seeding into app bootstrap.
7. Implement SQLite-backed content repositories.
8. Implement builder and compendium content services.
9. Verify idempotent seeding behavior.
10. Verify 2024-first builder-critical query results.
11. Run typecheck and runtime verification.

## Risks During Execution

### Risk 1: Seeding Takes Too Long On First Launch
Mitigation:
- seed by manifest chunk in transactions and avoid unnecessary reseeds.

### Risk 2: Version Metadata Marks Success Too Early
Mitigation:
- write the seeded content version only after all chunk imports complete successfully.

### Risk 3: Table Design Becomes Too Generic
Mitigation:
- keep tables queryable for the concrete builder use cases rather than over-abstracting.

### Risk 4: Feature Code Starts Reading JSON Directly
Mitigation:
- enforce repository access through SQLite only.

### Risk 5: Bootstrap Becomes Brittle
Mitigation:
- keep seed checks and seed execution isolated from unrelated startup logic.

## Exit Criteria
Step 4 is complete when:
- generated content can be seeded into SQLite
- local content version metadata is tracked correctly
- first launch seeds content successfully
- later launches skip reseeding when unchanged
- repositories and services can query builder-critical entities
- 2024-first content behavior is verified in runtime queries
- typecheck and runtime verification pass
