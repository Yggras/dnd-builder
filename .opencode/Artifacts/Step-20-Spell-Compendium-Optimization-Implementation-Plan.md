# Step 20 Spell Compendium Optimization Implementation Plan

## Objective
Improve the spell compendium with three targeted optimizations:

- Show spell upcasting / higher-level casting text on spell detail screens.
- Add a Class filter to the Spells category browse screen.
- Add a Damage Type filter to the Spells category browse screen, using only spells that deal or inflict damage.

## Confirmed Decisions
- This step may change importer code and generated content.
- This step may change spell detail runtime rendering.
- This step may change compendium category filter types and UI behavior.
- Do not change SQLite schema or migrations.
- Do not change builder behavior.
- Do not add spellcasting rule automation.
- Do not include damage resistance/immunity support in the Damage Type filter.
- Damage Type filter should use only 5eTools `damageInflict` values.

## Current State Summary

### Already Present
- Spell records are normalized in `scripts/5etools-importer/normalize.mjs` via `normalizeSpells()`.
- Spell details render `renderPayload.entries` through `SpellDetailView` and `RenderBlockList`.
- Spell category browse already supports filters for:
  - level
  - school
  - role
  - ritual
  - concentration
  - edition
  - source
- Spell metadata already includes:
  - `level`
  - `school`
  - `classIds`
  - `subclassIds`
  - `duration`
  - `range`
  - `components`
  - `ritual`
  - `concentration`
  - `roleTags`
  - `entriesText`
- Spell detail pages already resolve class/subclass names for the `Available To` section.

### Problems
- Raw 5eTools spell records include `entriesHigherLevel`, but the importer does not currently preserve them.
- Generated spell detail payloads omit higher-level casting text, so upcasting text is missing on detail screens.
- Spell category browse has no filter by spell class.
- Spell category browse has no filter by spell damage type.
- Raw 5eTools spell records include `damageInflict`, but generated spell metadata does not currently expose it for filtering.

## Implementation Strategy

### 1. Preserve Higher-Level Spell Entries
Update `normalizeSpells()` so generated spell records retain higher-level casting entries.

Recommended generated fields:
- `renderPayload.entriesHigherLevel`: raw `record.entriesHigherLevel ?? []`
- `metadata.higherLevelText`: `extractText(record.entriesHigherLevel ?? [])`

Also update spell `searchText` to include higher-level text so upcasting terms can be found through search.

Expected result:
- `Healing Word|XPHB` includes `Using a Higher-Level Spell Slot` text in generated content.

### 2. Render Higher-Level Entries On Spell Details
Update `SpellDetailView` to render higher-level entries when available.

Recommended behavior:
- Keep the existing `Details` section for base spell entries.
- Add an `At Higher Levels` or source-derived section after Details.
- Prefer rendering raw `renderPayload.entriesHigherLevel` through `buildRenderBlocksFromEntries()` and `RenderBlockList`.
- If rendering produces no blocks, fall back to `metadata.higherLevelText` as readable text.

This keeps inline dice/reference rendering consistent with other detail content.

### 3. Add Spell Class Filter Metadata
Update spell normalization to include stable, human-readable class names for filtering.

Recommended generated field:
- `metadata.classNames`: sorted unique class names derived from resolved `classIds`

Rationale:
- `classIds` are source-specific IDs such as `bard|xphb`.
- The browse filter should expose labels such as `Bard`, `Cleric`, `Druid`.
- Filtering by class name avoids source-specific UI labels while preserving existing `classIds` for detail resolution and builder logic.

### 4. Add Spell Damage Type Filter Metadata
Update spell normalization to include damage types from 5eTools `damageInflict`.

Recommended generated field:
- `metadata.damageTypes`: sorted unique values from `record.damageInflict ?? []`

Scope boundary:
- Do not include `damageResist`, `damageImmune`, or similar defensive metadata.
- Do not infer damage types from prose unless `damageInflict` is absent. Keep this filter source-owned and deterministic.

### 5. Extend Filter Types
Update compendium filter types and defaults.

Expected additions:
- `spellClasses: string[]`
- `spellDamageTypes: string[]`

Update default filters in `catalog.ts`.

### 6. Extend Spell Browse Filter UI
Update `useCompendiumCategoryBrowse()` for the `spells` category.

Add filter sections:
- `Class`
- `Damage Type`

Recommended ordering:
- Level
- Class
- Damage Type
- School
- Role
- Ritual
- Concentration
- Edition
- Source

Add support for:
- active chips
- chip clearing
- toggling multi-select values
- filtering entries by the new metadata

### 7. Optional Row Metadata Improvement
Consider adding damage type labels to spell result row metadata only if it remains concise.

Default recommendation:
- Do not change row metadata in this step unless smoke checks show the filter is hard to understand.
- The filter chips should provide enough visible feedback.

### 8. Regenerate Content
Run:
- `npm run generate:5etools`

Expected generated impact:
- spell chunks change beyond timestamp updates
- compendium spell chunks change
- content version changes

### 9. Verify
Run:
- `npm run typecheck`

Manual smoke checks:
- Open `Healing Word|XPHB`; confirm higher-level text is visible.
- Open another spell with `entriesHigherLevel`, such as `Aid|XPHB` or `Armor of Agathys|XPHB`; confirm higher-level text renders.
- Spell class filter works for `Bard`, `Cleric`, and `Druid`.
- Spell damage type filter works for `Fire`, `Radiant`, and `Necrotic` where matching spells exist.
- Non-damaging spells do not appear when a damage type filter is active unless they have matching `damageInflict` metadata.
- Existing spell filters still work.

## Code Areas To Change When Approved

### Importer Normalization
- `scripts/5etools-importer/normalize.mjs`

Expected impact:
- preserve `entriesHigherLevel`
- add higher-level text metadata
- add class-name filter metadata
- add `damageInflict`-backed damage type metadata

### Spell Detail Runtime
- `src/features/compendium/components/SpellDetailView.tsx`

Expected impact:
- render higher-level spell entries after base Details

### Compendium Filters
- `src/features/compendium/types/index.ts`
- `src/features/compendium/utils/catalog.ts`
- `src/features/compendium/hooks/useCompendiumCategoryBrowse.ts`

Expected impact:
- add spell class and spell damage type filter state
- add filter sections/chips/toggling/clear behavior
- apply new spell filters

### Generated Content
- `generated/5etools/**`
- `src/shared/content/generated/5etoolsRegistry.ts` only if registry output changes

Expected impact:
- spell records and compendium spell entries include new metadata/render payload fields

## Risks And Mitigations

### Risk 1: Higher-Level Entries Include Render Shapes Not Fully Supported
Mitigation:
- Use existing defensive `RenderBlockList` path.
- Preserve raw entries and fall back to extracted text if needed.

### Risk 2: Class Filter Labels Become Source-Specific Or Duplicated
Mitigation:
- Use class names, not class IDs.
- Sort and dedupe labels.

### Risk 3: Damage Type Filter Accidentally Includes Defensive Spells
Mitigation:
- Use only `damageInflict`.
- Do not include `damageResist`, `damageImmune`, or prose inference.

### Risk 4: Generated Diff Is Large
Mitigation:
- Regenerate once after implementation is complete.
- Inspect representative spell records before finalizing.

## Exit Criteria
Step 20 is complete when:
- generated spell records preserve higher-level casting entries
- spell detail pages render higher-level casting text
- spell browse supports Class filtering
- spell browse supports Damage Type filtering from `damageInflict` only
- existing spell filters continue to work
- no schema, migration, or builder changes are made
- `npm run generate:5etools` succeeds
- `npm run typecheck` succeeds
