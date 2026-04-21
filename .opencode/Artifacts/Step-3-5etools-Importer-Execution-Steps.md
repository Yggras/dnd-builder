# Step 3 5etools Importer Execution Steps

## Goal
Execute the 5etools importer phase in a controlled sequence so the repository ends with stable, checked-in generated content artifacts for native offline use, without jumping ahead into runtime builder or compendium UI work.

## Execution Rules
- Do not implement builder screens in this step.
- Do not implement compendium screens in this step.
- Do not let runtime app code consume raw 5etools structures.
- Prefer deterministic generated output over clever one-off transforms.
- Validate generated data after each major importer milestone.
- Keep entity normalization isolated rather than collapsing all rules into one monolithic importer file.

## Step-By-Step Execution Sequence

### 1. Lock The Output Contracts
- Finalize normalized shapes for species, classes, subclasses, feats, optional features, spells, items, choice grants, and compendium entries.
- Finalize which fields are builder-facing versus compendium-facing.
- Finalize visibility fields needed for 2024-first builder filtering.

Output:
- stable normalized entity contracts for implementation.

### 2. Lock Canonical ID Rules
- Define canonical ID formats for every imported entity type.
- Define how cross-entity references will be stored.
- Define how aliasing, reprints, and provenance are tracked.

Output:
- stable reference contract across all generated entities.

### 3. Create The Importer Module Structure
- Create the importer entrypoint.
- Create source loader modules.
- Create resolver modules.
- Create shared normalization utilities.
- Create entity-specific normalizer modules.
- Create chunk writer, manifest writer, and validation modules.

Output:
- importer file structure ready for isolated implementation.

### 4. Implement Raw Source Loading
- Load `races.json`.
- Load `class/index.json` and all referenced class files.
- Load `feats.json`.
- Load `optionalfeatures.json`.
- Load `spells/index.json` and all referenced spell files.
- Load `items-base.json`.
- Load `items.json`.

Output:
- importer can read the agreed raw 5etools inputs.

### 5. Implement Generic 5etools Resolution
- Resolve `_copy` behavior.
- Resolve `_mod` behavior.
- Resolve `_versions` behavior.
- Resolve `reprintedAs` relationships as needed for precedence and provenance.
- Normalize raw UID-style references into a reusable helper layer.

Output:
- raw records are transformed into a stable pre-normalization form.

### 6. Implement Shared Text And Reference Processing
- Convert tagged 5etools text into app-safe text.
- Extract render-safe structured payloads where needed.
- Normalize source labels and edition markers.
- Build helpers for parsing spell, feat, optional-feature, and subclass references.

Output:
- shared utilities ready for all entity normalizers.

### 7. Implement 2024-First Visibility Rules
- Define builder-visible criteria.
- Define imported-but-hidden criteria.
- Define fallback behavior when a 2024 equivalent does not exist.
- Ensure full corpus preservation remains possible for compendium generation.

Output:
- source precedence and builder visibility behavior encoded in the importer.

### 8. Implement Species Normalization
- Normalize species identity and source metadata.
- Handle lineage/version/reprint cases.
- Generate builder-facing rule payloads and compendium-facing text payloads.

Output:
- normalized species chunk input ready.

### 9. Implement Class And Subclass Normalization
- Normalize class records.
- Normalize subclass records and attach them to parent classes.
- Preserve class progression metadata and selection-related fields.
- Capture source material required for later grant derivation.

Output:
- normalized class and subclass records ready.

### 10. Implement Feat Normalization
- Normalize general feats.
- Normalize 2024 fighting styles from `feats.json`.
- Preserve categories, repeatability, prerequisites, and granted behavior.

Output:
- normalized feats ready, including fighting styles.

### 11. Implement Optional Feature Normalization
- Normalize optional features with emphasis on `EI` eldritch invocations.
- Preserve feature type, prerequisites, repeatability, and granted behavior.
- Normalize invocation dependencies on spells or other optional features.

Output:
- normalized optional features ready, including invocations.

### 12. Implement Spell Normalization
- Normalize spell identity and source metadata.
- Preserve class-list relevance and searchable text.
- Ensure spell references from feats, species, and invocations can resolve against canonical IDs.

Output:
- normalized spells ready.

### 13. Implement Item Normalization
- Normalize mundane equipment first.
- Normalize broader item coverage for the full corpus.
- Preserve builder-relevant equipment fields and compendium-facing details.

Output:
- normalized items ready.

### 14. Implement Choice Grant Normalization
- Convert `featProgression` into normalized grants.
- Convert `optionalfeatureProgression` into normalized grants.
- Support grants from classes, subclasses, feats, and optional features.
- Ensure fighting-style and invocation selection paths are represented correctly.

Output:
- normalized grants ready for runtime builder querying.

### 15. Implement Compendium Entry Generation
- Convert normalized entities into searchable compendium entries.
- Preserve summaries, search text, source labels, and render payloads.
- Keep compendium entries separate from builder-critical entities.

Output:
- normalized compendium content ready.

### 16. Implement Chunk Writing
- Write chunk files under:
  - `generated/5etools/species/`
  - `generated/5etools/classes/`
  - `generated/5etools/feats/`
  - `generated/5etools/optional-features/`
  - `generated/5etools/spells/`
  - `generated/5etools/items/`
  - `generated/5etools/grants/`
  - `generated/5etools/compendium/`
- Keep ordering stable to minimize diff churn.

Output:
- deterministic generated chunk files.

### 17. Implement Manifest Writing
- Write `generated/5etools/content-index.json`.
- Include schema version, content version, chunk inventory, and entity counts.

Output:
- generated manifest aligned to the chunk output.

### 18. Implement Validation Passes
- Detect duplicate canonical IDs.
- Detect unresolved references.
- Detect malformed normalized records.
- Detect malformed chunk files.
- Detect manifest inconsistencies.

Output:
- importer fails loudly on invalid generated output.

### 19. Run The Importer And Inspect Output
- Generate all Step 3 artifacts.
- Inspect directory structure, representative chunks, and manifest contents.
- Verify that chunk boundaries match the agreed layout.

Output:
- checked-in generated artifacts ready for later runtime integration.

### 20. Verify Step 3 Completion Criteria
- Confirm all target entities were generated.
- Confirm fighting styles come from feats and are grant-driven.
- Confirm invocations come from optional features and are grant-driven.
- Confirm 2024-first builder visibility is working.
- Confirm no runtime code needs raw 5etools semantics.

Output:
- validated importer baseline for subsequent runtime seeding work.

## Task List
1. Finalize normalized entity shapes.
2. Finalize canonical ID rules and reference shapes.
3. Create the importer file/module skeleton.
4. Implement raw source loaders for all agreed 5etools inputs.
5. Implement `_copy`, `_mod`, `_versions`, and reprint resolution.
6. Implement shared text/tag and reference parsing utilities.
7. Implement 2024-first source precedence and visibility rules.
8. Implement species normalization.
9. Implement class and subclass normalization.
10. Implement feat normalization, including fighting styles.
11. Implement optional-feature normalization, including invocations.
12. Implement spell normalization.
13. Implement item normalization.
14. Implement choice-grant normalization.
15. Implement compendium-entry generation.
16. Implement deterministic chunk writing.
17. Implement manifest writing.
18. Implement validation passes for IDs, refs, and chunk integrity.
19. Generate and inspect output artifacts.
20. Check in generated files after verification.

## Risks During Execution

### Risk 1: Canonical IDs Are Too Weak
Mitigation:
- finalize ID policy before normalization starts and validate uniqueness across the full corpus.

### Risk 2: 5etools Structural Rules Leak Into Runtime
Mitigation:
- resolve inheritance, tagged text, and UID semantics entirely in the importer layer.

### Risk 3: 2024-First Rules Are Applied Inconsistently
Mitigation:
- implement explicit visibility and precedence helpers rather than ad hoc per-entity filtering.

### Risk 4: Fighting Styles And Invocations Are Modeled In The Wrong Systems
Mitigation:
- keep fighting styles feat-based and invocation options optional-feature-based from the start.

### Risk 5: Generated Output Becomes Too Monolithic
Mitigation:
- keep the agreed chunk boundaries and stable ordering rather than emitting a single large seed file.

## Exit Criteria
Step 3 is complete when:
- all target normalized entities are generated
- chunked seed files exist under the entity-type-first layout
- `content-index.json` exists and is accurate
- fighting styles are represented from feats correctly
- eldritch invocations are represented from optional features correctly
- grants represent builder selection unlocks correctly
- full corpus import works while builder visibility remains 2024-first
- generated output is deterministic and validation passes
