# Step 19a Background Fluff Descriptions Execution Steps

## Goal
Execute the correction for background Overview content so background detail pages display descriptive text from 5eTools background fluff records instead of mechanical entries or generated summaries.

## Execution Rules
- This step may change importer code and generated content.
- Do not change SQLite schema or migrations.
- Do not change builder behavior.
- Do not add fluff image rendering.
- Do not add a new compendium category.
- Do not reintroduce a separate Starting Equipment section.
- Keep starting equipment inside Details.
- Keep feat and item links in Details working through the shared inline renderer.

## Step-By-Step Execution Sequence

### 1. Inspect Fluff Source Shape
- Confirm `data/fluff-backgrounds.json` exists in the 5eTools source repository.
- Confirm top-level raw key is `backgroundFluff`.
- Confirm records include `name`, `source`, and `entries`.
- Confirm `Acolyte|XPHB` contains the expected temple-service description.

Output:
- exact source path and raw key are confirmed.

### 2. Extend Importer Config
- Add `backgroundFluff: 'data/fluff-backgrounds.json'` to `SOURCE_FILES` in `scripts/5etools-importer/config.mjs`.
- Keep source loading explicit and curated.

Output:
- importer config knows where to fetch background fluff.

### 3. Extend Raw Source Loading
- Fetch `SOURCE_FILES.backgroundFluff` in `loadRawSources()`.
- Return the loaded fluff file in the raw source object.

Output:
- raw background fluff is available to generator orchestration.

### 4. Resolve Background Fluff Records
- Resolve `rawSources.backgroundFluff.backgroundFluff ?? []` using existing collection resolution behavior.
- Use the same copy key style as backgrounds when appropriate.
- Keep resolved fluff separate from mechanical background records.

Output:
- resolved fluff records are ready for normalization.

### 5. Pass Fluff Into Background Normalization
- Update `normalizeBackgrounds` call site to pass resolved background fluff.
- Update `normalizeBackgrounds` signature to accept optional fluff records.

Output:
- background normalization has access to description records.

### 6. Merge Fluff Into Normalized Backgrounds
- Build a lookup from fluff records by normalized `name + source`.
- For each background, find its matching fluff record.
- Extract readable description text from `fluff.entries`.
- Preserve raw fluff entries separately from mechanical entries.

Recommended output fields:
- `metadata.descriptionText`
- `renderPayload.descriptionEntries`

Output:
- normalized background records carry descriptive fluff data when available.

### 7. Preserve Existing Background Mechanics
- Confirm `renderPayload.entries` remains the mechanical/details entries.
- Confirm `metadata.entriesText` remains mechanical/details text.
- Confirm `metadata.equipmentSummary`, `featIds`, and builder-relevant fields remain unchanged.

Output:
- builder and Details behavior are not unintentionally altered.

### 8. Update Background Overview Rendering
- Update `BackgroundDetailView` to read Overview from `renderPayload.descriptionEntries` first.
- Use `buildRenderBlocksFromEntries()` for raw description entries.
- Fall back to `metadata.descriptionText` only if description entries produce no blocks.
- Remove fallback to `entry.summary`.
- Omit Overview when no fluff-backed description exists.

Output:
- Overview displays actual background description text only.

### 9. Preserve Step 19 Detail Behavior
- Confirm duplicate Starting Equipment section remains absent.
- Confirm Details still renders `buildRenderBlocks(entry)`.
- Confirm `detailBlocks.ts` still preserves inline tags for object-style list items.

Output:
- Step 19 improvements remain intact.

### 10. Regenerate Content
- Run `npm run generate:5etools`.
- Confirm generation succeeds.
- Confirm content version changes because background records now include description content.
- Confirm generated background chunks contain `descriptionText` and `descriptionEntries` where expected.

Output:
- generated content includes background descriptions.

### 11. Inspect Representative Generated Output
- Inspect `Acolyte|XPHB` in generated backgrounds.
- Confirm `metadata.descriptionText` includes the temple-service description.
- Confirm `renderPayload.descriptionEntries` contains the raw fluff entries.
- Inspect `Acolyte|PHB` and one non-Acolyte 2024 background such as `Artisan|XPHB`.

Output:
- representative records prove fluff merge works.

### 12. Verify TypeScript
- Run `npm run typecheck`.
- Fix any introduced type errors.

Output:
- typecheck passes.

### 13. Manual Smoke Checks
- Open `Acolyte|XPHB` background detail.
- Confirm Overview shows the temple-service descriptive text.
- Confirm Overview does not show Ability Scores / Feat / Equipment mechanical summary.
- Open `Acolyte|PHB` background detail.
- Confirm Overview shows PHB descriptive fluff rather than `Feature: Shelter of the Faithful` text.
- Open `Artisan|XPHB` or another modern background.
- Confirm Overview shows actual fluff text.
- Confirm Details still includes mechanics and equipment.
- Confirm Details feat/item links still navigate when resolved.

Output:
- runtime behavior matches the corrected user expectation.

### 14. Review Scope And Diff
- Confirm importer changes are limited to background fluff support.
- Confirm generated changes are expected.
- Confirm no schema or migration files changed.
- Confirm no builder files changed.
- Confirm no fluff image UI was added.

Output:
- implementation remains inside Step 19a boundaries.

## Task List
1. Inspect background fluff source shape.
2. Add background fluff source config.
3. Fetch background fluff in generator raw source loading.
4. Resolve background fluff records.
5. Pass fluff records into background normalization.
6. Merge fluff entries/text into normalized background records.
7. Preserve existing background mechanics/detail metadata.
8. Update background Overview runtime to use fluff-backed fields only.
9. Preserve Step 19 Details and link behavior.
10. Run `npm run generate:5etools`.
11. Inspect representative generated records.
12. Run `npm run typecheck`.
13. Smoke-check background detail pages.
14. Review final scope and diff.

## Verification Details

### Required Commands
- `npm run generate:5etools`
- `npm run typecheck`

### Required Generated Checks
- `Acolyte|XPHB` generated background has fluff-backed description text.
- `Acolyte|PHB` generated background has fluff-backed description text.
- A modern non-Acolyte background has fluff-backed description text when source fluff exists.
- Mechanical `renderPayload.entries` remains present.
- `contentVersion` updates after generated content changes.

### Required Runtime Checks
- Overview displays descriptive fluff, not mechanical summary.
- Details still displays mechanical rows.
- Starting Equipment remains only in Details.
- Feat/item links in Details remain tappable when resolved.
- Backgrounds without fluff omit Overview safely.

## Risks During Execution

### Risk 1: Fluff Records Include Nested Entry Shapes
Mitigation:
- Preserve raw `entries` for renderer use.
- Store extracted `descriptionText` as fallback.

### Risk 2: Missing Fluff For Some Backgrounds
Mitigation:
- Omit Overview if no matching fluff exists.
- Do not fall back to mechanical `entry.summary`.

### Risk 3: Copy Resolution Produces Unexpected Duplicates
Mitigation:
- Use existing `resolveCollection` behavior.
- Keep normalization matching strict by background name/source.
- Existing duplicate ID validation should still fail early if generated IDs collide.

### Risk 4: Generated Diff Is Large
Mitigation:
- Regenerate only once after implementation is complete.
- Inspect representative output rather than every generated file manually.

## Exit Criteria
Step 19a is complete when:
- background fluff is imported from `data/fluff-backgrounds.json`
- generated backgrounds carry descriptive fluff fields
- Background Overview uses fluff-backed fields only
- mechanical Details remain unchanged in purpose
- duplicate Starting Equipment section remains removed
- Details feat/item links remain supported
- no schema, migration, builder, or fluff image UI changes are included
- generator succeeds
- typecheck passes
