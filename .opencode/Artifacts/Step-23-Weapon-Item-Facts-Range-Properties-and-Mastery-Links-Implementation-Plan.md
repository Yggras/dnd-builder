# Step 23 Weapon Item Facts Range Properties and Mastery Links Implementation Plan

## Objective
Improve weapon item detail screens by showing complete, readable, and clickable weapon mechanics in the top `Item Facts` section.

This step addresses three missing or weak weapon facts:

- weapon range is not shown
- 2024 weapon mastery is not shown
- weapon properties are displayed from cryptic 5eTools abbreviations such as `F|XPHB`, `L|XPHB`, and `2H|XPHB`

The final detail screen should show readable facts such as:

- `Range: 20/60 ft.`
- `Properties: Finesse, Light, Thrown`
- `Weapon Mastery: Nick`

Property and mastery names should be tappable links to their corresponding rule detail pages.

## Confirmed Decisions
- Put range, weapon properties, and weapon mastery in the existing top `Item Facts` section.
- Make weapon properties readable and clickable.
- Make weapon mastery readable and clickable.
- Generate direct rule pages for individual item properties and item masteries.
- Use `variantrule` entries for generated property/mastery rule pages to avoid schema changes.
- Do not add new compendium categories.
- Do not change SQLite schema or migrations.
- Do not change builder behavior.

## Current State Summary

### Raw 5eTools Data
Raw XPHB weapon records in `data/items-base.json` already include the required fields.

Examples:

- `Dagger [XPHB]`
  - `range: "20/60"`
  - `property: ["F|XPHB", "L|XPHB", "T|XPHB"]`
  - `mastery: ["Nick|XPHB"]`
- `Longbow [XPHB]`
  - `range: "150/600"`
  - `property: ["A|XPHB", "H|XPHB", "2H|XPHB"]`
  - `mastery: ["Slow|XPHB"]`
- `Greatsword [XPHB]`
  - `property: ["H|XPHB", "2H|XPHB"]`
  - `mastery: ["Graze|XPHB"]`

`data/items-base.json` also contains definitions for:

- `itemProperty`: rules for properties such as Ammunition, Finesse, Light, Thrown, Two-Handed, Versatile
- `itemMastery`: rules for masteries such as Cleave, Graze, Nick, Push, Sap, Slow, Topple, Vex

### App State Today
- `normalizeItems()` preserves weapon category, damage, damage type, armor class, and raw property abbreviations.
- `normalizeItems()` does not preserve weapon range.
- `normalizeItems()` does not preserve weapon mastery.
- `buildItemFacts()` displays properties using a small local abbreviation map, but values with source suffixes like `F|XPHB` are not normalized before lookup.
- `DetailFactGrid` renders plain strings only, so fact values cannot currently contain clickable inline references.
- `inlineText.ts` recognizes `itemproperty` and `itemmastery` as reference-style tags, but they are not navigable because they are not mapped to generated content entities.

## Implementation Strategy

### 1. Import Item Rule Definitions
Extend generation to pass `itemProperty` and `itemMastery` records from `data/items-base.json` into normalization.

Recommended approach:

- Keep existing item source loading unchanged where possible.
- Add a new normalization path for item rule definitions.
- Convert item rule definitions into `variantrule` content entities.

No new source file is required because `data/items-base.json` is already imported.

### 2. Generate Linkable Item Property Rules
Convert each `itemProperty` record into a reference-only `variantrule` record.

Recommended generated identity:

- use the property display name and source as the public reference target
- example `A|XPHB` becomes `Ammunition [XPHB]`
- example generated id: `ammunition|xphb|variantrule`

Recommended metadata:

- `kind: 'itemProperty'` or `ruleSubtype: 'itemProperty'`
- `abbreviation`
- `sourceCode`
- `entriesText`

The rule page should render the property's entries exactly like other reference-only rules.

### 3. Generate Linkable Item Mastery Rules
Convert each `itemMastery` record into a reference-only `variantrule` record.

Recommended generated identity:

- use mastery name and source as the public reference target
- example `Nick|XPHB` becomes `Nick [XPHB]`
- example generated id: `nick|xphb|variantrule`

Recommended metadata:

- `kind: 'itemMastery'` or `ruleSubtype: 'itemMastery'`
- `entriesText`

The rule page should render the mastery rule text directly, not just link to a parent `Weapon Mastery Properties` page.

### 4. Avoid Duplicate Rule Entries
Because `variantrule` records already come from `data/variantrules.json`, adding generated item rules may introduce name/source overlaps in future data.

Recommended behavior:

- normalize existing variant rules first
- normalize item property/mastery rules second
- dedupe by id
- if an existing variant rule id exists, keep the existing imported variant rule and skip the generated item rule

This keeps behavior deterministic and avoids duplicate content entity ids.

### 5. Preserve Weapon Metadata
Update `normalizeItems()` to preserve:

- `metadata.range`: raw weapon range string, e.g. `20/60`
- `metadata.mastery`: raw mastery uid array, e.g. `["Nick|XPHB"]`

Also improve metadata/search payloads:

- include readable range in item `searchText`
- include readable property names in item `searchText`
- include readable mastery names in item `searchText`

### 6. Normalize Item Property And Mastery References
Add shared helpers for 5eTools item rule refs.

Recommended helper behavior:

- parse `F|XPHB` into `{ name: 'F', sourceCode: 'XPHB' }`
- resolve property abbreviation to display name using item property definitions where available
- parse `Nick|XPHB` into `{ name: 'Nick', sourceCode: 'XPHB' }`
- generate inline tags:
  - `{@itemProperty Light|XPHB}` or equivalent resolvable display form
  - `{@itemMastery Nick|XPHB}`

The exact internal representation can be minimal as long as the UI can render readable clickable values.

### 7. Improve Inline Reference Parsing
Update `src/features/compendium/utils/inlineText.ts`.

Required behavior:

- `itemproperty` should become navigable to `variantrule`
- `itemmastery` should become navigable to `variantrule`
- display override handling should use the third tag pipe segment when present

Examples:

- `{@itemProperty L|XPHB|Light}` displays `Light` and resolves to `Light [XPHB]`
- `{@itemMastery Nick|XPHB}` displays `Nick` and resolves to `Nick [XPHB]`

### 8. Upgrade Detail Facts To Support Rich Values
Update `DetailFact` and `DetailFactGrid` so fact values may be either plain text or rich inline tokens.

Recommended shape:

- keep `value: string` for existing fact users
- add optional `tokens: InlineTextToken[]` for clickable values

Rendering behavior:

- if `tokens` exists, render with `RichTextLine`
- otherwise render the existing plain `Text`
- collect/resolve references from fact tokens using the existing inline reference machinery

This should preserve existing fact grid styling and behavior for all non-rich facts.

### 9. Add Weapon Facts
Update `buildItemFacts()`.

Add or improve facts:

- `Range`: format raw range as `20/60 ft.`
- `Properties`: readable clickable property labels
- `Weapon Mastery`: readable clickable mastery labels

Expected examples:

- `Dagger [XPHB]`
  - `Range: 20/60 ft.`
  - `Properties: Finesse, Light, Thrown`
  - `Weapon Mastery: Nick`
- `Longbow [XPHB]`
  - `Range: 150/600 ft.`
  - `Properties: Ammunition, Heavy, Two-Handed`
  - `Weapon Mastery: Slow`
- `Greatsword [XPHB]`
  - `Properties: Heavy, Two-Handed`
  - `Weapon Mastery: Graze`

### 10. Extend Audit
Update `scripts/audit-5etools.mjs`.

Add strict checks:

- generated rule entries exist for XPHB item masteries:
  - Cleave
  - Graze
  - Nick
  - Push
  - Sap
  - Slow
  - Topple
  - Vex
- generated rule entries exist for representative XPHB item properties:
  - Ammunition
  - Finesse
  - Heavy
  - Light
  - Thrown
  - Two-Handed
  - Versatile
- representative weapon metadata is preserved:
  - `Dagger [XPHB]`: range `20/60`, mastery `Nick|XPHB`, properties `F|XPHB`, `L|XPHB`, `T|XPHB`
  - `Longbow [XPHB]`: range `150/600`, mastery `Slow|XPHB`, properties `A|XPHB`, `H|XPHB`, `2H|XPHB`
  - `Greatsword [XPHB]`: mastery `Graze|XPHB`, properties `H|XPHB`, `2H|XPHB`

Keep existing Step 21 and Step 22 audit checks intact.

### 11. Regenerate And Verify
Run:

- `npm run generate:5etools`
- `npm run audit:5etools`
- `npm run typecheck`

Manual smoke checks after reseed/app reload:

- Open `Dagger [XPHB]`.
- Confirm range appears in `Item Facts`.
- Confirm properties are readable and clickable.
- Confirm mastery is readable and clickable.
- Tap `Nick`; it opens the `Nick [XPHB]` rule detail.
- Tap `Light`; it opens the `Light [XPHB]` property rule detail.

## Acceptance Criteria
- Weapon range appears in the top `Item Facts` section.
- Weapon properties appear readable, not as raw abbreviations.
- Weapon properties are clickable links to rule details.
- Weapon mastery appears in the top `Item Facts` section.
- Weapon mastery is clickable and opens the exact mastery rule.
- `{@itemProperty ...}` references are navigable.
- `{@itemMastery ...}` references are navigable.
- Generated content includes linkable property and mastery rules.
- Audit catches missing property/mastery rules or missing weapon metadata.
- `npm run generate:5etools` succeeds.
- `npm run audit:5etools` succeeds.
- `npm run typecheck` succeeds.
- No SQLite schema or migration files change.

## Non-Goals
- Add item property or mastery automation to the character builder.
- Add a separate compendium category for item properties or masteries.
- Change item browse filters.
- Change item result row metadata unless needed for correctness.
- Add new database tables or columns.
- Import unrelated 5eTools categories.

## Risks And Mitigations
- Risk: mapping item properties/masteries to `variantrule` could collide with existing variant rule names.
  - Mitigation: dedupe by generated id and keep existing imported variant rules when conflicts exist.
- Risk: fact grid rich text could affect existing fact layout.
  - Mitigation: keep plain string rendering as default and only use rich rendering for properties/mastery.
- Risk: inline `itemProperty` tags use abbreviations rather than names.
  - Mitigation: generate tags/fact tokens with display names, and improve display override parsing.
- Risk: old generated content lacks item property/mastery rules until regeneration/reseed.
  - Mitigation: run `npm run generate:5etools` and rely on content version reseeding.
