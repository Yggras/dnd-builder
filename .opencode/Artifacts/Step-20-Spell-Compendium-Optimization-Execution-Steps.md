# Step 20 Spell Compendium Optimization Execution Steps

## Goal
Execute the spell compendium optimizations so spell detail pages include upcasting text, and spell browsing supports Class and damage-inflicting Damage Type filters.

## Execution Rules
- This step may change importer code and generated content.
- Do not change SQLite schema or migrations.
- Do not change character builder behavior.
- Do not add spellcasting automation.
- Do not infer damage types from prose.
- Do not include resistance/immunity/protection spells in the Damage Type filter unless the spell also has matching `damageInflict`.
- Preserve existing spell browse filters and sorting behavior.

## Step-By-Step Execution Sequence

### 1. Reconfirm Raw Spell Source Fields
- Inspect raw 5eTools spell data for `entriesHigherLevel`.
- Confirm `Healing Word|XPHB` has `entriesHigherLevel` with `Using a Higher-Level Spell Slot`.
- Inspect raw damage fields and confirm `damageInflict` is present for damage-dealing spells.
- Confirm class applicability is already resolvable through existing spell source lookup / `classIds` flow.

Output:
- exact raw fields for upcasting and damage filtering are confirmed.

### 2. Preserve Higher-Level Entries In Normalization
- Update `normalizeSpells()` in `scripts/5etools-importer/normalize.mjs`.
- Preserve raw `record.entriesHigherLevel ?? []` in `renderPayload.entriesHigherLevel` when present.
- Extract readable text into `metadata.higherLevelText`.

Output:
- normalized spells carry higher-level casting render data and text fallback.

### 3. Include Higher-Level Text In Search
- Append `higherLevelText` to generated spell `searchText`.
- Keep `metadata.entriesText` as base spell detail text unless a clear reason exists to expand it.

Output:
- upcasting terms can be found by spell search without conflating base detail metadata.

### 4. Add Spell Class Filter Metadata
- Use normalized `classIds` from existing applicability metadata.
- Derive class names from the normalized `classes` context passed to `normalizeSpells()`.
- Store sorted unique class names in `metadata.classNames`.

Output:
- generated spells expose class labels suitable for filtering.

### 5. Add Spell Damage Type Metadata
- Read `record.damageInflict ?? []`.
- Store sorted unique values in `metadata.damageTypes`.
- Do not use `damageResist`, `damageImmune`, or prose matching.

Output:
- generated spells expose damage-inflicting type metadata only.

### 6. Update Spell Detail Rendering
- Update `SpellDetailView.tsx`.
- Build higher-level render blocks from `entry.renderPayload.entriesHigherLevel` when available.
- Fall back to `metadata.higherLevelText` only if raw entries produce no render blocks.
- Render higher-level content after base Details.
- Use existing `RenderBlockList` for inline dice/reference support.

Output:
- Healing Word and other upcastable spells show higher-level text on detail pages.

### 7. Extend Filter Types And Defaults
- Update `CompendiumFilters` in `src/features/compendium/types/index.ts`.
- Add:
  - `spellClasses: string[]`
  - `spellDamageTypes: string[]`
- Update `createDefaultCompendiumFilters()` defaults in `catalog.ts`.

Output:
- filter state supports new spell filters.

### 8. Add Spell Filter Sections
- Update spell branch in `buildFilterSections()`.
- Add Class options from `metadata.classNames`.
- Add Damage Type options from `metadata.damageTypes`.
- Use existing damage type label formatting where possible.

Recommended section order:
- Level
- Class
- Damage Type
- School
- Role
- Ritual
- Concentration
- Edition
- Source

Output:
- filter sheet exposes Class and Damage Type filters for spells.

### 9. Add Active Chips And Clearing
- Update `buildActiveChips()` for spell class and spell damage type chips.
- Update `removeChip()` for `spellClasses` and `spellDamageTypes`.

Output:
- selected spell class/damage filters are visible and removable.

### 10. Add Toggle Handling
- Update `toggleMultiFilter()` for `spellClasses` and `spellDamageTypes`.
- Keep existing filter behavior intact.

Output:
- users can toggle new filter options.

### 11. Apply New Spell Filters
- Update `applyFilters()` spell branch.
- Match `filters.spellClasses` against `metadata.classNames`.
- Match `filters.spellDamageTypes` against `metadata.damageTypes`.
- Require at least one overlap for multi-select filters.

Output:
- spell category results respect new filters.

### 12. Regenerate Content
- Run `npm run generate:5etools`.
- Confirm generation succeeds.
- Confirm content version changes.
- Confirm generated Healing Word spell includes `entriesHigherLevel`.
- Confirm generated damage spells include `metadata.damageTypes`.
- Confirm generated spells include `metadata.classNames`.

Output:
- checked-in generated spell content supports new runtime behavior.

### 13. Inspect Representative Generated Output
- Inspect `Healing Word|XPHB`.
- Inspect a fire damage spell.
- Inspect a radiant damage spell.
- Inspect a non-damaging spell and confirm `damageTypes` is empty or absent as implemented.

Output:
- representative records confirm correct normalization.

### 14. Verify TypeScript
- Run `npm run typecheck`.
- Fix any introduced type errors.

Output:
- typecheck passes.

### 15. Manual Smoke Checks
- Open `Healing Word|XPHB` detail and confirm upcasting text is visible.
- Open another upcastable spell such as `Aid|XPHB` or `Armor of Agathys|XPHB`.
- Use spell Class filter with `Bard`, `Cleric`, and `Druid`.
- Use Damage Type filter with `Fire`, `Radiant`, and `Necrotic`.
- Confirm non-damaging spells disappear when a damage type filter is active.
- Confirm existing level/school/role/ritual/concentration filters still work.

Output:
- user-facing spell optimizations are verified.

### 16. Review Scope And Diff
- Confirm no schema or migration files changed.
- Confirm no builder files changed.
- Confirm generated diff is expected.
- Confirm damage type filtering uses `damageInflict` only.

Output:
- implementation remains inside Step 20 boundaries.

## Task List
1. Reconfirm raw spell source fields.
2. Preserve higher-level entries in spell normalization.
3. Include higher-level text in search.
4. Add spell class filter metadata.
5. Add spell damage type metadata from `damageInflict` only.
6. Render higher-level entries on spell details.
7. Extend filter types and defaults.
8. Add spell Class and Damage Type filter sections.
9. Add active chips and clearing for new filters.
10. Add toggle handling for new filters.
11. Apply new spell filters.
12. Run `npm run generate:5etools`.
13. Inspect representative generated output.
14. Run `npm run typecheck`.
15. Smoke-check spell details and filters.
16. Review final scope and diff.

## Verification Details

### Required Commands
- `npm run generate:5etools`
- `npm run typecheck`

### Required Generated Checks
- `Healing Word|XPHB` has generated higher-level casting entries.
- At least one damage spell has generated `metadata.damageTypes`.
- At least one non-damaging spell does not incorrectly appear under a damage type.
- Generated spell records include class filter labels.
- `contentVersion` updates after generated content changes.

### Required Runtime Checks
- Higher-level casting text renders on spell detail pages.
- Spell Class filter works.
- Spell Damage Type filter works using only damage-inflicting spells.
- Existing spell filters still work.
- Unsupported or ambiguous inline references remain safe.

## Risks During Execution

### Risk 1: Higher-Level Text Duplicates Base Details
Mitigation:
- Keep higher-level entries in a separate section after Details.
- Do not merge into `renderPayload.entries` unless necessary.

### Risk 2: Damage Type Metadata Is Missing On Some Damage Spells
Mitigation:
- Use source-owned `damageInflict` only for this step.
- Defer prose inference to a later explicit task if needed.

### Risk 3: Class Filter Has Duplicate Labels From Multiple Sources
Mitigation:
- Store sorted unique class names.
- Filter by names rather than IDs.

### Risk 4: Generated Diff Is Large
Mitigation:
- Regenerate once after implementation is complete.
- Inspect representative output instead of every generated file manually.

## Exit Criteria
Step 20 is complete when:
- spell upcasting text from `entriesHigherLevel` is generated and rendered
- Spells browse has a working Class filter
- Spells browse has a working Damage Type filter based only on `damageInflict`
- existing spell filters remain functional
- no schema, migration, builder, or automation changes are included
- generator succeeds
- typecheck passes
