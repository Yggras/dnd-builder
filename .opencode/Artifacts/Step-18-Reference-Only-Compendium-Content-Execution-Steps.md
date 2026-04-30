# Step 18 Reference Only Compendium Content Execution Steps

## Goal
Execute the reference-only content import so conditions, actions, and variant rules become generated compendium entries and can be targeted by inline reference navigation.

## Execution Rules
- This step may change importer code and generated content.
- Do not change SQLite schema or migrations unless a blocker is discovered and explicitly approved.
- Do not add builder automation behavior.
- Do not add homebrew/user import behavior.
- Do not import monsters, NPCs, vehicles, rewards, boons, hazards, objects, diseases, or deities.
- Keep conditions/actions/variant rules reference-only.
- Prefer generic detail rendering first.
- Run generator and typecheck before completion.

## Step-By-Step Execution Sequence

### 1. Inspect Source Data Availability
- Inspect 5etools source repository paths for conditions/statuses.
- Inspect source paths for actions.
- Inspect source paths for variant rules.
- Confirm record arrays and entry shapes.

Output:
- exact source file paths and raw collection keys.

### 2. Define Supported Reference Types
- Add `condition`, `action`, and `variantrule` as reference-only content types.
- Confirm naming matches inline tags where possible.
- Decide display labels for each type.

Output:
- stable type names for generated records and runtime matching.

### 3. Extend Importer Config
- Add source file paths to `SOURCE_FILES`.
- Keep paths curated and explicit.

Output:
- importer can fetch required reference-only source files.

### 4. Extend Raw Source Loading
- Load conditions/status source file.
- Load actions source file.
- Load variant rules source file.
- Return raw collections from `loadRawSources`.

Output:
- raw reference-only records available to normalization.

### 5. Add Normalizers
- Add condition normalizer.
- Add action normalizer.
- Add variant rule normalizer.
- Reuse base record behavior where possible.
- Preserve `renderPayload.entries`.
- Add `metadata.entriesText`.

Output:
- normalized reference-only content entities.

### 6. Include New Types In Compendium Entries
- Pass normalized conditions/actions/variant rules into `normalizeCompendiumEntries`.
- Ensure IDs and entity types remain stable.

Output:
- generated compendium entries include new reference-only types.

### 7. Extend Validation
- Validate unique condition IDs.
- Validate unique action IDs.
- Validate unique variant rule IDs.
- Validate generated compendium entry IDs remain unique.

Output:
- duplicate generated IDs fail early.

### 8. Extend Generated Writer
- Add chunks for conditions.
- Add chunks for actions.
- Add chunks for variant rules.
- Add compendium chunks for these entry types.
- Ensure registry generation includes new chunks.

Output:
- generated files are written and registered.

### 9. Extend Runtime Types
- Extend `ContentEntityType` with `condition`, `action`, and `variantrule`.
- Update any type-constrained category/order maps that require these types.

Output:
- TypeScript accepts new generated content types.

### 10. Ensure Bootstrap Compatibility
- Confirm local content bootstrap seeds new generated chunks through existing generic paths.
- Fix any type or switch exhaustiveness issues.

Output:
- generated records can seed locally without schema changes.

### 11. Expand Inline Resolver
- Add `condition` tag resolution.
- Add `action` tag resolution.
- Add `variantrule` tag resolution.
- Keep unresolved refs non-clickable.

Output:
- newly imported reference-only entries are tappable from inline text.

### 12. Regenerate Content
- Run `npm run generate:5etools`.
- Confirm generation succeeds.
- Confirm manifest content version changes.
- Confirm new generated chunks exist.

Output:
- checked-in generated content includes reference-only entries.

### 13. Inspect Representative Generated Output
- Inspect one condition record.
- Inspect one action record.
- Inspect one variant rule record.
- Confirm body entries render payload exists.

Output:
- confidence that generic detail rendering has usable data.

### 14. Verify TypeScript
- Run `npm run typecheck`.
- Fix introduced type errors.

Output:
- typecheck passes.

### 15. Manual Smoke Checks
- Open a condition detail entry.
- Open an action detail entry.
- Open a variant rule detail entry.
- Tap inline condition/action/variant rule references from existing detail content.
- Confirm unsupported refs remain non-clickable.

Output:
- reference-only content is readable and navigable.

### 16. Review Scope And Diff
- Confirm no schema or migration files changed.
- Confirm no builder automation files changed unless incidental type imports required it.
- Confirm no excluded content types were imported.
- Confirm generated diff is expected.

Output:
- implementation remains inside Step 18 boundaries.

## Task List
1. Inspect source data paths and raw shapes.
2. Define supported reference-only type names.
3. Extend importer config.
4. Extend raw source loading.
5. Add normalizers.
6. Include new types in compendium entries.
7. Extend generated ID validation.
8. Extend generated writer chunks.
9. Extend runtime content entity types.
10. Confirm bootstrap compatibility.
11. Expand inline resolver to new types.
12. Run `npm run generate:5etools`.
13. Inspect representative generated output.
14. Run `npm run typecheck`.
15. Perform manual smoke checks.
16. Review final scope and diff.

## Verification Details

### Required Commands
- `npm run generate:5etools`
- `npm run typecheck`

### Required Generated Checks
- conditions generated chunk exists
- actions generated chunk exists
- variant rules generated chunk exists
- compendium chunks exist for each new type
- content index count/version updates
- registry imports new chunks

### Required Runtime Checks
- condition detail opens and renders readable content
- action detail opens and renders readable content
- variant rule detail opens and renders readable content
- inline condition/action/variant-rule refs navigate when resolved
- unresolved refs remain safe and non-clickable

## Risks During Execution

### Risk 1: Source File Names Differ
Mitigation:
- inspect source repository before coding assumptions

### Risk 2: Raw Variant Rules Are Too Broad
Mitigation:
- import only clear variant rule records from curated source file
- defer tables and unrelated rules data

### Risk 3: Generic Detail View Is Insufficient
Mitigation:
- use renderer fallback first
- add type-specific view later only if manual checks show poor readability

### Risk 4: New Type Names Affect Existing Filters
Mitigation:
- avoid top-level browse category changes in this step
- keep search/detail support generic

## Exit Criteria
Step 18 is complete when:
- condition/action/variant-rule records are generated and searchable/detail-addressable
- generic detail pages render them readably
- inline navigation supports them when resolved
- no excluded content types or builder automation were added
- generator succeeds
- typecheck passes
