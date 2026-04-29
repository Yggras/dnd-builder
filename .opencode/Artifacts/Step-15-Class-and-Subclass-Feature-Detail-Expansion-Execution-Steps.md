# Step 15 Class and Subclass Feature Detail Expansion Execution Steps

## Goal
Execute the feature-detail expansion so class and subclass feature progression rows can be expanded to show real rules text imported from 5etools class source files.

## Execution Rules
- This step is allowed to change the importer and generated content.
- Do not change SQLite schema or migrations.
- Do not add new content tables.
- Do not add a top-level feature compendium category.
- Do not implement clickable inline references.
- Do not change builder automation behavior.
- Keep feature details nested in class/subclass metadata for this step.
- Use the existing Step 13 renderer for expanded content.
- Run generator and typecheck before completion.

## Step-By-Step Execution Sequence

### 1. Inspect Raw Class File Feature Collections
- Confirm class files expose `classFeature` arrays.
- Confirm class files expose `subclassFeature` arrays.
- Inspect representative raw feature records from XPHB, PHB, and supplements.
- Note available fields for name, class name/source, subclass name/source, level, entries, and source.

Output:
- implementation notes for raw feature record shapes.

### 2. Extend Raw Source Flattening
- Update generator source flattening to collect raw class feature records from loaded class files.
- Update generator source flattening to collect raw subclass feature records from loaded class files.
- Keep existing class/subclass flattening intact.

Output:
- `rawClassFeatures` and `rawSubclassFeatures` are available to normalization.

### 3. Resolve Feature Collections If Needed
- Determine whether raw feature records need `_copy` resolution.
- Apply existing `resolveCollection` if feature records use compatible copy semantics.
- If copy resolution is unsafe, document and handle only direct records in first pass.

Output:
- stable feature inputs for normalization.

### 4. Extend Class Normalizer Signature
- Update `normalizeClasses` to accept raw class feature records and raw subclass feature records.
- Keep returned shape as `{ classes, subclasses }`.
- Avoid changing callers beyond generator orchestration.

Output:
- normalizer can attach feature details while preserving existing output shape.

### 5. Implement Feature Reference Builders
- Build refs for raw class feature records matching progression reference shape where possible.
- Build refs for raw subclass feature records matching progression reference shape where possible.
- Keep refs deterministic and source-aware.

Output:
- feature detail records can be matched to progression rows.

### 6. Normalize Class Feature Details
- Convert raw class feature records into normalized feature detail objects.
- Include name, level, source metadata, summary, text, and render payload.
- Preserve enough source/version metadata for debugging.

Output:
- normalized class feature detail map keyed by ref.

### 7. Normalize Subclass Feature Details
- Convert raw subclass feature records into normalized feature detail objects.
- Include name, level, source metadata, summary, text, and render payload.
- Preserve class/subclass linkage metadata where useful.

Output:
- normalized subclass feature detail map keyed by ref.

### 8. Attach Class Feature Details To Classes
- For each normalized class, inspect `metadata.classFeatures`.
- Match each progression ref to normalized feature details.
- Attach matched records under `metadata.classFeatureDetails`.
- Keep unmatched progression refs unchanged.

Output:
- generated class metadata contains feature detail payloads where available.

### 9. Attach Subclass Feature Details To Subclasses
- For each normalized subclass, inspect `metadata.subclassFeatures`.
- Match each progression ref to normalized subclass feature details.
- Attach matched records under `metadata.subclassFeatureDetails`.
- Keep unmatched progression refs unchanged.

Output:
- generated subclass metadata contains feature detail payloads where available.

### 10. Strengthen Importer Validation Lightly
- Validate duplicate feature detail refs within class feature details.
- Validate duplicate feature detail refs within subclass feature details.
- Do not fail generation solely because some progression refs remain unmatched unless the mismatch is clearly systemic.

Output:
- obvious detail-map mistakes fail early without blocking partial source coverage.

### 11. Regenerate Content
- Run `npm run generate:5etools`.
- Confirm generation completes.
- Confirm generated manifest content version changes.
- Confirm generated registry updates.

Output:
- checked-in generated content includes class/subclass feature details.

### 12. Inspect Representative Generated Output
- Inspect one generated class chunk such as fighter.
- Inspect one generated subclass entry from class chunks or compendium subclass data.
- Confirm `classFeatureDetails` and `subclassFeatureDetails` exist where expected.
- Confirm feature details include render payload entries.

Output:
- confidence that generated metadata is usable by runtime UI.

### 13. Extend Runtime Feature Row Shape
- Extend `FeatureProgressionRow` with optional detail payload.
- Preserve existing name, level, source, and subclass unlock fields.
- Keep rows without details supported.

Output:
- runtime progression rows can carry expanded detail data.

### 14. Match Runtime Rows To Feature Details
- Update class feature row builder to attach `metadata.classFeatureDetails` records.
- Update subclass feature row builder to attach `metadata.subclassFeatureDetails` records.
- Match by feature ref or fallback name/level/source only if necessary.

Output:
- rows know whether expandable details exist.

### 15. Update FeatureProgressionList To Expand Rows
- Make rows with details pressable.
- Add expand/collapse state inside the component.
- Show a subtle expand affordance.
- Render expanded details with `RenderBlockList`.
- Preserve subclass unlock styling.

Output:
- progression rows expand in both class and subclass pages.

### 16. Preserve Non-Detail Rows
- Ensure rows without detail remain non-expandable or clearly static.
- Avoid showing misleading placeholder panels.

Output:
- unmatched rows remain stable and readable.

### 17. Verify Class Pages
- Open Fighter.
- Open Wizard or Cleric.
- Open Warlock.
- Open Artificer.
- Expand representative features.

Output:
- class features expand and display readable details.

### 18. Verify Subclass Pages
- Open at least one XPHB subclass.
- Open at least one PHB/legacy subclass.
- Open at least one supplement subclass.
- Expand representative subclass features.

Output:
- subclass features expand and display readable details.

### 19. Run TypeScript Verification
- Run `npm run typecheck`.
- Fix type errors.

Output:
- typecheck passes.

### 20. Review Scope And Diff
- Confirm no SQLite schema or migration files changed.
- Confirm no new content tables were added.
- Confirm changes are limited to importer, generated content, runtime class/subclass detail UI, and artifact docs.

Output:
- implementation remains within Step 15 boundaries.

## Task List
1. Inspect raw class/subclass feature records.
2. Extend generator flattening for feature collections.
3. Resolve feature collections if needed.
4. Extend `normalizeClasses` inputs.
5. Implement feature reference builders.
6. Normalize class feature details.
7. Normalize subclass feature details.
8. Attach feature details to class metadata.
9. Attach feature details to subclass metadata.
10. Add light validation for duplicate detail refs.
11. Run `npm run generate:5etools`.
12. Inspect representative generated output.
13. Extend runtime feature row shape.
14. Attach feature details to runtime progression rows.
15. Make `FeatureProgressionList` expandable.
16. Preserve static behavior for rows without details.
17. Manually verify class pages.
18. Manually verify subclass pages.
19. Run `npm run typecheck`.
20. Review final scope and diff.

## Verification Details

### Required Commands
- `npm run generate:5etools`
- `npm run typecheck`

### Required Generated Checks
- `generated/5etools/content-index.json` has a changed `contentVersion`.
- Representative class chunks include `metadata.classFeatureDetails`.
- Representative subclass records include `metadata.subclassFeatureDetails`.
- Feature detail records include readable `text` and render payload entries.

### Required Runtime Checks
- Class feature rows with details show an expand affordance.
- Expanded class feature details render paragraphs/lists/tables through the shared renderer.
- Subclass feature rows with details show an expand affordance.
- Expanded subclass feature details render through the shared renderer.
- Rows without details remain readable and do not show broken placeholders.
- Raw tags such as `{@spell ...}` do not appear in expanded content in normal cases.

## Risks During Execution

### Risk 1: Feature Refs Do Not Match Perfectly
Mitigation:
- build refs from the same raw field parts used by progression references
- inspect representative mismatches before adding broad fallback matching

### Risk 2: Feature Content Greatly Increases Generated Size
Mitigation:
- accept the increase for this feature because expanded details require body text
- measure/observe generated diff size after regeneration
- defer chunk/schema optimization until there is concrete pressure

### Risk 3: Runtime Expand State Gets Complex
Mitigation:
- keep expand state local to `FeatureProgressionList`
- use row keys based on level/name/source
- avoid global state or persisted expansion state

### Risk 4: Complex Feature Tables Render Poorly
Mitigation:
- rely on Step 13 basic table fallback behavior
- prioritize readable fallback over perfect layout

### Risk 5: Importer Scope Creep
Mitigation:
- only import feature details needed by class/subclass progression
- do not create general feature compendium entries in this step

## Exit Criteria
Step 15 is complete when:
- generated class metadata includes matched class feature details
- generated subclass metadata includes matched subclass feature details
- class progression rows expand to show real feature text where available
- subclass progression rows expand to show real feature text where available
- expanded details use the shared renderer
- rows without details remain stable
- no schema or migration changes were made
- `npm run generate:5etools` succeeds
- `npm run typecheck` succeeds
