# Step 19a Background Fluff Descriptions Implementation Plan

## Objective
Correct the Step 19 background overview behavior so the background detail screen displays actual descriptive background text from 5eTools fluff data, not mechanical entries or generated summaries.

Example target behavior:
- `Acolyte|XPHB` should show: `You devoted yourself to service in a temple...`
- Mechanical rows such as Ability Scores, Feat, Skill Proficiencies, Tool Proficiency, and Equipment should remain in Details.

## Confirmed Decisions
- This step may change importer code and generated content.
- This step should not change SQLite schema or migrations.
- This step should not change builder behavior.
- This step should preserve Step 19's Details behavior:
  - no separate Starting Equipment section
  - starting equipment remains inside Details
  - feat and item links in Details remain tappable when resolved
- Description text should come from 5eTools background fluff records, not from mechanical background entries.
- Images from fluff records are out of scope unless explicitly requested later.

## Current State Summary

### Already Present
- Step 19 added an `Overview` section in `BackgroundDetailView`.
- Step 19 removed the duplicate Starting Equipment section.
- Step 19 preserved raw inline tags for object-style list items in `detailBlocks.ts`, enabling feat/item references in Details.
- Background generated records currently use `renderPayload.entries` for mechanical/detail content.
- Background generated metadata currently includes `entriesText`, `equipmentSummary`, `featIds`, and source mechanics.

### Problem
- The current Step 19 overview derives text from `renderPayload.entries` or `entry.summary`.
- For many 2024 backgrounds, `renderPayload.entries` contains only a mechanical list.
- The actual descriptive background text is in 5eTools fluff source data:
  - source file: `data/fluff-backgrounds.json`
  - raw key: `backgroundFluff`
- Because the importer does not currently load or normalize background fluff, generated background records do not contain the desired description text.

## Implementation Strategy

### 1. Extend Importer Source Config
Add the curated background fluff source file to `SOURCE_FILES`:
- `backgroundFluff: 'data/fluff-backgrounds.json'`

Keep this explicit. Do not broadly import every fluff file.

### 2. Load Background Fluff Source
Update `scripts/generate-5etools.mjs` to fetch the new source file in `loadRawSources()`.

Expected raw shape:
- top-level key: `backgroundFluff`
- each record has `name`, `source`, and `entries`
- records may also contain images, which should be ignored for this step

Use existing copy-resolution behavior if needed, matching the importer pattern for raw 5eTools records.

### 3. Normalize Background Descriptions
Update `normalizeBackgrounds` to accept background fluff records.

Recommended matching:
- Match fluff to background by normalized `(name, source)`.
- Keep source-specific matching strict first.
- Do not silently use a different-source fluff record unless a clear copy/alias resolution path already provides that record.

Recommended generated fields:
- `metadata.descriptionText`: extracted readable text from fluff entries
- `renderPayload.descriptionEntries`: raw fluff `entries` preserved for the shared renderer

Preserve existing fields:
- `renderPayload.entries`: mechanical/detail entries
- `metadata.entriesText`: mechanical/detail searchable text
- `metadata.equipmentSummary`
- `metadata.featIds`
- all builder-relevant background metadata

### 4. Update Background Detail Overview
Change `BackgroundDetailView` so the Overview section reads only from fluff-backed fields.

Preferred order:
- `entry.renderPayload.descriptionEntries` rendered through `buildRenderBlocksFromEntries()`
- fallback to `metadata.descriptionText` as a paragraph
- omit Overview if neither exists

Avoid falling back to `entry.summary` for Overview because that summary is often mechanical.

### 5. Keep Details Behavior From Step 19
Do not revert Step 19 changes.

Keep:
- no duplicate Starting Equipment section
- Details rendering for background mechanics and equipment
- object-list item inline tag preservation in `detailBlocks.ts`

### 6. Regenerate Content
Run:
- `npm run generate:5etools`

Expected generated impact:
- backgrounds chunk changes beyond timestamp updates because description metadata/render payload is added
- compendium backgrounds chunk changes because render payload/metadata propagate to compendium entries
- content version should change because generated record content changes

### 7. Verify
Run:
- `npm run typecheck`

Manual smoke checks:
- `Acolyte|XPHB` Overview shows the temple-service descriptive text.
- `Acolyte|PHB` Overview shows PHB fluff, not the Shelter of the Faithful feature text.
- A 2024 background with only mechanical `entries`, such as `Artisan|XPHB`, shows actual fluff text.
- Details still shows mechanical rows.
- Details still includes Equipment and feat/item links.

## Code Areas To Change When Approved

### Importer Config
- `scripts/5etools-importer/config.mjs`

Expected impact:
- add `data/fluff-backgrounds.json` as a curated source file

### Importer Orchestration
- `scripts/generate-5etools.mjs`

Expected impact:
- fetch background fluff data
- resolve raw `backgroundFluff` collection
- pass resolved fluff records to `normalizeBackgrounds`

### Importer Normalization
- `scripts/5etools-importer/normalize.mjs`

Expected impact:
- index background fluff by background identity
- add description metadata/render payload fields to normalized background records

### Background Detail Runtime
- `src/features/compendium/components/BackgroundDetailView.tsx`

Expected impact:
- Overview reads from fluff-backed description fields only
- remove Step 19 fallback to mechanical `entry.summary`

### Generated Content
- `generated/5etools/**`
- `src/shared/content/generated/5etoolsRegistry.ts` only if registry output changes

Expected impact:
- generated backgrounds and compendium background entries include description fields

## Risks And Mitigations

### Risk 1: Fluff Matching Misses Copied Or Variant Backgrounds
Mitigation:
- Use existing resolved/copy-expanded collections where possible.
- Keep missing descriptions non-fatal; omit Overview when no strict match exists.

### Risk 2: Generated Diff Is Larger Than Step 19
Mitigation:
- This step intentionally changes generated content.
- Regenerate once after importer changes are complete.
- Inspect representative records before finalizing.

### Risk 3: Mechanical Summary Reappears As Description
Mitigation:
- Do not use `entry.summary` as an Overview fallback.
- Only use explicit fluff-backed fields.

### Risk 4: Fluff Entries Include Unsupported Render Shapes
Mitigation:
- Preserve raw `entries` and rely on existing defensive `RenderBlockList` behavior.
- Fall back to extracted `descriptionText` if block rendering is empty.

## Exit Criteria
Step 19a is complete when:
- background fluff source data is imported
- generated background records include descriptive fluff text when available
- Background Overview displays fluff-backed text only
- mechanical details remain in Details
- duplicate Starting Equipment section remains removed
- feat and item links in Details still work when resolved
- no schema, migration, or builder changes are made
- `npm run generate:5etools` succeeds
- `npm run typecheck` succeeds
