# Step 23 Weapon Item Facts Range Properties and Mastery Links Execution Steps

## Preconditions
- Use `npm`, not `pnpm` or `yarn`.
- Do not change SQLite schema or migrations.
- Do not change character builder behavior.
- Do not add a new compendium category.
- Keep range, properties, and mastery in the top `Item Facts` section.

## Execution Checklist

### 1. Inspect Current Data And Rendering
- [x] Review raw `data/items-base.json` fields for representative XPHB weapons.
- [x] Confirm `itemProperty` and `itemMastery` definitions are available in already imported item source data.
- [x] Review `normalizeItems()` in `scripts/5etools-importer/normalize.mjs`.
- [x] Review `buildItemFacts()` in `src/features/compendium/utils/detailFacts.ts`.
- [x] Review `DetailFactGrid` rendering.
- [x] Review `inlineText.ts` and `inlineReferences.ts` handling for `itemproperty` and `itemmastery` tags.

### 2. Add Item Rule Normalization
- [x] Add normalization helper for `itemProperty` records.
- [x] Add normalization helper for `itemMastery` records.
- [x] Convert item properties into reference-only `variantrule` records.
- [x] Convert item masteries into reference-only `variantrule` records.
- [x] Include property abbreviation/source metadata.
- [x] Preserve entries and page/source data.
- [x] Dedupe generated item rules against existing variant rules by id.

### 3. Wire Item Rule Inputs Through Generation
- [x] Read `rawSources.itemsBase.itemProperty` in `scripts/generate-5etools.mjs`.
- [x] Read `rawSources.itemsBase.itemMastery` in `scripts/generate-5etools.mjs`.
- [x] Pass those definitions into variant rule normalization or a new item-rule normalization function.
- [x] Ensure generated item property/mastery rules are included in `variantRules` entity groups.
- [x] Ensure generated compendium entries are created for the new rules.

### 4. Preserve Weapon Item Metadata
- [x] Update `normalizeItems()` to include `metadata.range`.
- [x] Update `normalizeItems()` to include `metadata.mastery`.
- [x] Preserve raw property refs as today, but prepare for readable formatting.
- [x] Include range text in item `searchText`.
- [x] Include readable property names in item `searchText` where practical.
- [x] Include mastery names in item `searchText`.

### 5. Add Shared Item Reference Formatting Helpers
- [x] Parse property refs such as `F|XPHB`, `L|XPHB`, and `2H|XPHB`.
- [x] Parse mastery refs such as `Nick|XPHB`.
- [x] Resolve property abbreviations to display names using imported property definitions or a shared fallback map.
- [x] Build rich inline tokens for fact grid values.
- [x] Keep fallback display readable even if a source-specific definition is missing.

### 6. Make Item Property And Mastery Tags Navigable
- [x] Update `InlineReferenceEntityType` if needed.
- [x] Map `itemproperty` to `variantrule` navigation.
- [x] Map `itemmastery` to `variantrule` navigation.
- [x] Update display override parsing so the third pipe segment can be displayed.
- [x] Confirm `{@itemProperty L|XPHB|Light}` displays `Light`.
- [x] Confirm `{@itemMastery Nick|XPHB}` displays `Nick`.

### 7. Upgrade Detail Fact Grid For Rich Values
- [x] Extend `DetailFact` to support optional inline tokens.
- [x] Update `DetailFactGrid` to render plain facts exactly as before.
- [x] Render rich fact values with `RichTextLine`.
- [x] Resolve fact-grid inline references using existing inline reference utilities.
- [x] Preserve current styling as much as possible.

### 8. Add Weapon Facts
- [x] Format weapon range as `20/60 ft.`.
- [x] Add `Range` fact when `metadata.range` exists.
- [x] Render `Properties` as readable clickable values.
- [x] Render `Weapon Mastery` as readable clickable values.
- [x] Preserve existing `Damage`, `Weapon`, `Armor`, `AC`, `Attunement`, `Source`, and `Edition` facts.

### 9. Extend Audit
- [x] Add checks for generated item mastery rule entries.
- [x] Add checks for generated representative item property rule entries.
- [x] Add checks for `Dagger [XPHB]` range/properties/mastery metadata.
- [x] Add checks for `Longbow [XPHB]` range/properties/mastery metadata.
- [x] Add checks for `Greatsword [XPHB]` properties/mastery metadata.
- [x] Keep existing supported category count checks passing.
- [x] Keep class/subclass reachability checks passing.
- [x] Keep edition classification checks passing.

### 10. Regenerate Content
- [x] Run `npm run generate:5etools`.
- [x] Confirm generation succeeds.
- [x] Note any existing diagnostics, such as unmatched subclass feature details.
- [x] Inspect generated item records for representative weapons.
- [x] Inspect generated variant rule records for representative properties/masteries.

### 11. Verify
- [x] Run `npm run audit:5etools`.
- [x] Run `npm run typecheck`.
- [x] Address failures if any.

### 12. Review Final Diff Scope
- [x] Confirm no SQLite schema files changed.
- [x] Confirm no migration files changed.
- [x] Confirm no builder behavior files changed unless only type fallout required it.
- [x] Confirm generated content changes are expected.
- [x] Summarize representative outcomes for `Dagger`, `Longbow`, and `Greatsword`.

## Expected Commands
```bash
npm run generate:5etools
npm run audit:5etools
npm run typecheck
```

## Expected Final Outcome
- `Dagger [XPHB]` shows `Range: 20/60 ft.`, linked `Finesse`, `Light`, `Thrown`, and linked `Nick`.
- `Longbow [XPHB]` shows `Range: 150/600 ft.`, linked `Ammunition`, `Heavy`, `Two-Handed`, and linked `Slow`.
- `Greatsword [XPHB]` shows linked `Heavy`, `Two-Handed`, and linked `Graze`.
- Property and mastery links open direct rule detail pages.
- Audit and typecheck pass.
