# Step 17 Inline Compendium Reference Navigation Execution Steps

## Goal
Execute the first-pass inline reference navigation feature so supported references in compendium detail text can be tapped to open existing compendium entries while unsupported references remain safe and non-clickable.

## Execution Rules
- Do not change the importer in this step.
- Do not regenerate generated 5etools content in this step.
- Do not change SQLite schema or migrations.
- Do not add new content tables.
- Do not add new compendium categories.
- Use stack push navigation for inline taps.
- Keep unresolved references non-clickable.
- Do not show errors/toasts for unresolved references.
- Avoid per-token database queries.
- Preserve existing detail page layouts.

## Step-By-Step Execution Sequence

### 1. Reconfirm Existing Reference Tags
- Inspect representative rendered entries for spell, item, feat, and optional feature refs.
- Confirm common payload formats such as `Name|Source|Display`.
- Confirm unsupported tags that should remain non-clickable.

Output:
- short notes on first-pass supported and unsupported tag shapes.

### 2. Extend Inline Token Types
- Add optional reference metadata to reference tokens.
- Keep existing token kinds unchanged.
- Ensure existing rendering still compiles when no reference metadata is present.

Output:
- parser can carry navigation-relevant reference data.

### 3. Parse Supported Tags Into References
- Map `spell` tags to `spell` references.
- Map `item` tags to `item` references.
- Map `feat` tags to `feat` references.
- Map `optfeature` tags to `optionalfeature` references.
- Keep existing styled display text for all reference tags.

Output:
- supported inline tags produce reference-aware tokens.

### 4. Preserve Unsupported Tag Cleanup
- Confirm unsupported tags still keep readable labels.
- Confirm unsupported tags do not receive clickable target metadata.
- Confirm dice, emphasis, strong, and normal text behavior is unchanged.

Output:
- no raw syntax regression from parser changes.

### 5. Add Reference Candidate Collection
- Add a helper to collect supported reference candidates from render blocks.
- Deduplicate candidates by entity type, name, and source.
- Include current entry source as fallback context where useful.

Output:
- each detail page can batch resolve its inline references.

### 6. Add Reference Resolver
- Resolve supported candidates to existing compendium entries.
- Prefer explicit source from the tag.
- Fall back to current entry source if no tag source exists.
- Prefer primary/2024 records only when this does not create ambiguity.
- Treat ambiguous or missing targets as unresolved.

Output:
- stable map from inline reference keys to compendium entry IDs.

### 7. Add Minimal Data Access If Needed
- Check whether existing repository/service APIs can resolve references efficiently.
- If not, add the smallest method needed for batched lookup by entity type/name/source.
- Keep APIs local to compendium/content service boundaries.

Output:
- no per-token database queries are required.

### 8. Wire RenderBlockList Reference Context
- Pass resolved reference targets into `RenderBlockList`.
- Pass target lookup or callback down to `RichTextLine`.
- Keep callers simple and avoid duplicating resolution code in every detail view.

Output:
- rich text rendering has access to resolved targets.

### 9. Render Clickable Inline Text
- Update `RichTextLine` so resolved reference tokens are pressable.
- Use `router.push` for navigation.
- Use accessibility role `link`.
- Add subtle pressed feedback.
- Keep unresolved reference styling unchanged.

Output:
- supported refs can be tapped inline.

### 10. Wire Detail Views
- Wire reference resolution into detail views that render body blocks.
- Include expanded class/subclass feature details through the same rendering path.
- Avoid changing detail layouts beyond enabling inline links.

Output:
- inline links work across all rendered detail content.

### 11. Verify Chained Navigation
- Start on a class or spell detail page.
- Tap a supported reference.
- Tap another supported reference from the next page.
- Back through each page.

Output:
- stack history behaves as expected.

### 12. Verify TypeScript
- Run `npm run typecheck`.
- Fix introduced type errors.

Output:
- typecheck passes.

### 13. Review Scope And Diff
- Confirm no generated content changed.
- Confirm no importer files changed.
- Confirm no schema or migration files changed.
- Confirm no new content categories were added.

Output:
- implementation remains inside Step 17 boundaries.

## Task List
1. Inspect representative inline reference tag shapes.
2. Extend inline token types with reference metadata.
3. Parse supported tags into reference-aware tokens.
4. Preserve unsupported tag cleanup behavior.
5. Add reference candidate collection helper.
6. Add reference resolver.
7. Add minimal data access if needed.
8. Wire reference context through render blocks.
9. Render resolved references as clickable inline text.
10. Wire all detail views that render blocks.
11. Verify chained navigation manually.
12. Run `npm run typecheck`.
13. Review final scope and diff.

## Verification Details

### Required Command
- `npm run typecheck`

### Required Functional Checks
- Spell refs navigate to spell detail when resolved.
- Item refs navigate to item detail when resolved.
- Feat refs navigate to feat detail when resolved.
- Optional feature refs navigate to optional feature detail when resolved.
- Chained navigation supports back-to-previous-detail behavior.
- Unresolved refs remain non-clickable.
- Unsupported refs remain non-clickable and do not error.

### Required Scope Checks
- No importer changes.
- No generated content changes.
- No schema or migration changes.
- No new compendium categories.

## Risks During Execution

### Risk 1: Reference Matching Is Ambiguous
Mitigation:
- do not navigate unless one target is confidently resolved

### Risk 2: Performance Regresses From Many References
Mitigation:
- batch candidate resolution per detail page

### Risk 3: Inline Pressables Affect Layout
Mitigation:
- use nested text press handling and preserve line wrapping

### Risk 4: Expanded Feature Details Miss Links
Mitigation:
- ensure `FeatureProgressionList` uses the same `RenderBlockList` reference context path

## Exit Criteria
Step 17 is complete when:
- supported existing-content references are tappable
- navigation uses stack push and chains correctly
- unsupported/unresolved references remain safe
- typecheck passes
- no importer, generated-content, schema, migration, or category changes were made
