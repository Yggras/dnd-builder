# Step 15a Class and Subclass Feature Detail Hardening Execution Steps

## Goal
Execute a focused hardening pass for class and subclass expandable feature details so generated detail matching is deterministic, importer mistakes are visible, and expanded feature text remains readable.

## Execution Rules
- Do not begin implementation until explicitly approved.
- This step may change importer code and generated content once implementation starts.
- Do not change SQLite schema or migrations.
- Do not add new content tables.
- Do not add a top-level feature compendium category.
- Do not implement clickable inline references.
- Do not change builder automation behavior.
- Keep feature details nested in class/subclass metadata.
- Keep UI changes minimal and limited to preserving current expandable-row behavior.
- Run generator and typecheck before completion.

## Step-By-Step Execution Sequence

### 1. Reconfirm Current Feature Detail Shapes
- Inspect representative generated class metadata with `classFeatureDetails`.
- Inspect representative generated subclass metadata with `subclassFeatureDetails`.
- Confirm current detail records contain `name`, `level`, `sourceCode`, `page`, and `entries`.
- Confirm current records do not expose stable `ref` values.

Output:
- short implementation notes identifying the exact current generated shape.

### 2. Define Feature Detail Ref Contract
- Choose a deterministic `ref` value for class feature details.
- Choose a deterministic `ref` value for subclass feature details.
- Prefer matching the original progression UID shape where practical.
- Keep refs source-aware and level-aware.

Output:
- stable generated `ref` contract for feature detail matching.

### 3. Add Ref Construction To Importer Normalization
- Update class feature detail normalization to include `ref`.
- Update subclass feature detail normalization to include `ref`.
- Reuse existing feature parsing and lookup logic where possible.
- Avoid introducing a separate feature entity model.

Output:
- normalized feature detail records can be matched directly to progression refs.

### 4. Add Duplicate Ref Validation
- Validate duplicate refs within each class's `classFeatureDetails`.
- Validate duplicate refs within each subclass's `subclassFeatureDetails`.
- Ignore null or missing detail slots when validating partial coverage.
- Throw generation errors for duplicates.

Output:
- ambiguous feature detail matching fails early.

### 5. Add Unmatched Ref Diagnostics
- Count class progression refs with no matched detail.
- Count subclass progression refs with no matched detail.
- Surface diagnostics without failing generation by default.
- Keep diagnostics concise enough for generator output.

Output:
- unmatched coverage is visible for follow-up without blocking useful generated data.

### 6. Harden Runtime Feature Detail Type
- Extend the local feature detail runtime shape with optional `ref`.
- Keep existing `entries` and `sourceCode` support.
- Treat malformed detail records as absent.

Output:
- runtime helper code understands generated refs defensively.

### 7. Match Runtime Rows By Ref
- Parse progression refs from class feature rows.
- Parse progression refs from subclass feature rows.
- Find matching detail records by `ref` first.
- Keep a minimal index fallback only if needed.
- Preserve static rows when no detail exists.

Output:
- feature rows attach details deterministically.

### 8. Preserve Expandable Row Behavior
- Confirm `FeatureProgressionList` still expands only rows with details.
- Confirm rows without details have no misleading affordance.
- Avoid changing visual design unless required for correctness.

Output:
- current UX remains stable after matching changes.

### 9. Identify Raw Tag Leak Cases
- Search representative generated class chunks for unsupported tags in feature detail entries.
- Prioritize tags observed in class/subclass details.
- Include at least `5etools`, `itemMastery`, `creature`, and nested `note` cases if present.

Output:
- concrete tag list for inline parser hardening.

### 10. Harden Inline Text Parsing
- Add readable label handling for observed unsupported tags.
- Ensure unsupported tags fall back to useful display text instead of raw syntax.
- Preserve existing behavior for spell, item, feat, condition, action, dice, emphasis, and strong tags.
- Handle nested note-style tags well enough to avoid visible raw tag syntax in normal cases.

Output:
- expanded feature content avoids common raw tag leaks.

### 11. Regenerate Content
- Run `npm run generate:5etools`.
- Confirm generation completes successfully.
- Confirm generated manifest content version changes.
- Confirm generated registry remains valid.

Output:
- checked-in generated content includes feature detail refs.

### 12. Inspect Representative Generated Output
- Inspect Fighter class chunk.
- Inspect Wizard or Cleric class chunk.
- Inspect one XPHB subclass entry.
- Inspect one supplement subclass entry.
- Confirm feature details include `ref` and readable `entries`.

Output:
- confidence that generated metadata is usable by runtime UI.

### 13. Verify Runtime Matching Inputs
- Inspect representative generated class feature refs and detail refs.
- Inspect representative generated subclass feature refs and detail refs.
- Confirm runtime parser can match them exactly.

Output:
- ref matching is source-aware and level-aware.

### 14. Run TypeScript Verification
- Run `npm run typecheck`.
- Fix any type errors introduced by runtime or importer changes.

Output:
- typecheck passes.

### 15. Manual Smoke Checks
- Open Fighter class details.
- Open Wizard or Cleric class details.
- Open Warlock class details.
- Open Artificer class details.
- Expand representative class features.
- Open one XPHB subclass detail.
- Open one legacy PHB subclass detail if available.
- Open one supplement subclass detail.
- Expand representative subclass features.

Output:
- class and subclass feature rows expand correctly and render readable text.

### 16. Review Scope And Diff
- Confirm no SQLite schema files changed.
- Confirm no migration files changed.
- Confirm no new content tables were added.
- Confirm no top-level feature category was added.
- Confirm generated diff is expected from one intentional regeneration.

Output:
- implementation remains inside Step 15a boundaries.

## Task List
1. Inspect current generated feature detail shape.
2. Define stable feature detail ref contract.
3. Add generated refs to class feature details.
4. Add generated refs to subclass feature details.
5. Add duplicate-ref validation.
6. Add unmatched-ref diagnostics.
7. Extend runtime feature detail type with optional refs.
8. Match runtime feature rows by ref.
9. Preserve non-detail and expandable row behavior.
10. Identify unsupported raw tag leak cases.
11. Harden inline tag parsing for observed cases.
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
- `generated/5etools/content-index.json` has a changed `contentVersion`.
- Representative class chunks include `metadata.classFeatureDetails[].ref`.
- Representative subclass records include `metadata.subclassFeatureDetails[].ref`.
- Duplicate feature detail refs fail generation.
- Unmatched ref diagnostics are visible or otherwise documented.

### Required Runtime Checks
- Class feature rows with details still show an expand affordance.
- Subclass feature rows with details still show an expand affordance.
- Rows without details remain static and readable.
- Expanded class feature details render through `RenderBlockList`.
- Expanded subclass feature details render through `RenderBlockList`.
- Raw tags such as `{@5etools ...}`, `{@itemMastery ...}`, and `{@creature ...}` do not appear in normal expanded content.
- Existing supported tags such as spells, items, feats, conditions, actions, dice, emphasis, and strong text still render readably.

## Risks During Execution

### Risk 1: Feature Ref Mismatch
Mitigation:
- keep ref generation close to original progression UID strings
- inspect representative class and subclass pairs before broad changes

### Risk 2: Duplicate Refs In Legitimate Data
Mitigation:
- scope duplicate checks per owning class or subclass
- include source and level in refs

### Risk 3: Diagnostics Become Too Noisy
Mitigation:
- emit counts and limited examples rather than every unmatched ref
- fail only on duplicate refs

### Risk 4: Inline Parser Over-Strips Text
Mitigation:
- preserve first readable payload segment for unknown tags
- keep existing parser behavior for known tags

### Risk 5: Generated Diff Is Large
Mitigation:
- regenerate once after implementation is complete
- verify representative chunks and manifest instead of manually reviewing every generated file

## Exit Criteria
Step 15a is complete when:
- generated feature details include stable refs
- runtime matching uses refs before any fallback
- duplicate refs are validated
- unmatched progression refs are visible for follow-up
- expanded feature details avoid common raw tag leaks
- class and subclass expandable rows behave as before
- no schema, migration, table, builder automation, or category scope creep occurred
- `npm run generate:5etools` succeeds
- `npm run typecheck` succeeds
