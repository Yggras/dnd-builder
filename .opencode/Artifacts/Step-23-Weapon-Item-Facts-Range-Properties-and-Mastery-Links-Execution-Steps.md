# Step 23 Weapon Item Facts Range Properties and Mastery Links Execution Steps

## Preconditions
- Use `npm`, not `pnpm` or `yarn`.
- Do not change SQLite schema or migrations.
- Do not change character builder behavior.
- Do not add a new compendium category.
- Keep range, properties, and mastery in the top `Item Facts` section.

## Execution Checklist

### 1. Inspect Current Data And Rendering
- [ ] Review raw `data/items-base.json` fields for representative XPHB weapons.
- [ ] Confirm `itemProperty` and `itemMastery` definitions are available in already imported item source data.
- [ ] Review `normalizeItems()` in `scripts/5etools-importer/normalize.mjs`.
- [ ] Review `buildItemFacts()` in `src/features/compendium/utils/detailFacts.ts`.
- [ ] Review `DetailFactGrid` rendering.
- [ ] Review `inlineText.ts` and `inlineReferences.ts` handling for `itemproperty` and `itemmastery` tags.

### 2. Add Item Rule Normalization
- [ ] Add normalization helper for `itemProperty` records.
- [ ] Add normalization helper for `itemMastery` records.
- [ ] Convert item properties into reference-only `variantrule` records.
- [ ] Convert item masteries into reference-only `variantrule` records.
- [ ] Include property abbreviation/source metadata.
- [ ] Preserve entries and page/source data.
- [ ] Dedupe generated item rules against existing variant rules by id.

### 3. Wire Item Rule Inputs Through Generation
- [ ] Read `rawSources.itemsBase.itemProperty` in `scripts/generate-5etools.mjs`.
- [ ] Read `rawSources.itemsBase.itemMastery` in `scripts/generate-5etools.mjs`.
- [ ] Pass those definitions into variant rule normalization or a new item-rule normalization function.
- [ ] Ensure generated item property/mastery rules are included in `variantRules` entity groups.
- [ ] Ensure generated compendium entries are created for the new rules.

### 4. Preserve Weapon Item Metadata
- [ ] Update `normalizeItems()` to include `metadata.range`.
- [ ] Update `normalizeItems()` to include `metadata.mastery`.
- [ ] Preserve raw property refs as today, but prepare for readable formatting.
- [ ] Include range text in item `searchText`.
- [ ] Include readable property names in item `searchText` where practical.
- [ ] Include mastery names in item `searchText`.

### 5. Add Shared Item Reference Formatting Helpers
- [ ] Parse property refs such as `F|XPHB`, `L|XPHB`, and `2H|XPHB`.
- [ ] Parse mastery refs such as `Nick|XPHB`.
- [ ] Resolve property abbreviations to display names using imported property definitions or a shared fallback map.
- [ ] Build rich inline tokens for fact grid values.
- [ ] Keep fallback display readable even if a source-specific definition is missing.

### 6. Make Item Property And Mastery Tags Navigable
- [ ] Update `InlineReferenceEntityType` if needed.
- [ ] Map `itemproperty` to `variantrule` navigation.
- [ ] Map `itemmastery` to `variantrule` navigation.
- [ ] Update display override parsing so the third pipe segment can be displayed.
- [ ] Confirm `{@itemProperty L|XPHB|Light}` displays `Light`.
- [ ] Confirm `{@itemMastery Nick|XPHB}` displays `Nick`.

### 7. Upgrade Detail Fact Grid For Rich Values
- [ ] Extend `DetailFact` to support optional inline tokens.
- [ ] Update `DetailFactGrid` to render plain facts exactly as before.
- [ ] Render rich fact values with `RichTextLine`.
- [ ] Resolve fact-grid inline references using existing inline reference utilities.
- [ ] Preserve current styling as much as possible.

### 8. Add Weapon Facts
- [ ] Format weapon range as `20/60 ft.`.
- [ ] Add `Range` fact when `metadata.range` exists.
- [ ] Render `Properties` as readable clickable values.
- [ ] Render `Weapon Mastery` as readable clickable values.
- [ ] Preserve existing `Damage`, `Weapon`, `Armor`, `AC`, `Attunement`, `Source`, and `Edition` facts.

### 9. Extend Audit
- [ ] Add checks for generated item mastery rule entries.
- [ ] Add checks for generated representative item property rule entries.
- [ ] Add checks for `Dagger [XPHB]` range/properties/mastery metadata.
- [ ] Add checks for `Longbow [XPHB]` range/properties/mastery metadata.
- [ ] Add checks for `Greatsword [XPHB]` properties/mastery metadata.
- [ ] Keep existing supported category count checks passing.
- [ ] Keep class/subclass reachability checks passing.
- [ ] Keep edition classification checks passing.

### 10. Regenerate Content
- [ ] Run `npm run generate:5etools`.
- [ ] Confirm generation succeeds.
- [ ] Note any existing diagnostics, such as unmatched subclass feature details.
- [ ] Inspect generated item records for representative weapons.
- [ ] Inspect generated variant rule records for representative properties/masteries.

### 11. Verify
- [ ] Run `npm run audit:5etools`.
- [ ] Run `npm run typecheck`.
- [ ] Address failures if any.

### 12. Review Final Diff Scope
- [ ] Confirm no SQLite schema files changed.
- [ ] Confirm no migration files changed.
- [ ] Confirm no builder behavior files changed unless only type fallout required it.
- [ ] Confirm generated content changes are expected.
- [ ] Summarize representative outcomes for `Dagger`, `Longbow`, and `Greatsword`.

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
