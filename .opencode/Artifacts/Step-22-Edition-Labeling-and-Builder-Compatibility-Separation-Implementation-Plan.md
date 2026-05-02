# Step 22 Edition Labeling and Builder Compatibility Separation Implementation Plan

## Objective
Fix importer edition classification so compendium badges and filters show the content's actual edition, while builder availability remains controlled by separate compatibility policy.

The immediate issue is that `Artificer [TCE]` is currently labeled as `2024` because `TCE` is treated as a 2024-compatible source. It should remain selectable in the builder, but it should display as legacy / `2014` content.

## Confirmed Decisions
- Keep compatible legacy content selectable in the builder.
- Mark compatible legacy content as legacy / `2014` in compendium UI.
- Do not use 2024 compatibility to drive visible edition labels.
- Do not change SQLite schema or migrations.
- Do not add new UI labels such as `2014 Compatible` in this step.
- Keep the current badge text as `2014` or `2024`.
- Add audit coverage so this mismatch is caught automatically.

## Current State Summary

### Existing Flaw
The importer currently uses `is2024CompatibleRecord()` to set:

- `rulesEdition`
- `isLegacy`
- `isSelectableInBuilder`

This conflates two concepts:

- actual rules edition of the source record
- whether a record is compatible/selectable in a 2024 builder context

Concrete example:

- Raw `Artificer [TCE]` has `edition: "classic"`.
- Raw `Artificer [EFA]` has `edition: "one"`.
- Generated output currently labels both as `rulesEdition: "2024"`.

### Desired Model
Use separate concepts:

- `rulesEdition`: actual edition of the source record.
- `isLegacy`: whether the source record is legacy/classic content.
- `isPrimary2024`: whether the source record is primary 2024 content.
- `isSelectableInBuilder`: whether app policy allows this record in builder flows.

## Classification Policy

### Actual Edition
Actual edition should be determined from raw record metadata and primary source fallback only.

Recommended rules:

- `record.edition === 'one'` -> `rulesEdition: '2024'`, `isLegacy: false`
- `record.basicRules2024` -> `rulesEdition: '2024'`, `isLegacy: false`
- `record.srd52` -> `rulesEdition: '2024'`, `isLegacy: false`
- primary 2024 source fallback, currently `XPHB` and `EFA` -> `rulesEdition: '2024'`, `isLegacy: false`
- `record.edition === 'classic'` -> `rulesEdition: '2014'`, `isLegacy: true`
- otherwise -> `rulesEdition: '2014'`, `isLegacy: true`

Important: `COMPATIBLE_2024_SOURCES` must not affect `rulesEdition` or `isLegacy`.

### Builder Selectability
Builder selectability may still use compatibility policy.

Recommended rules:

- actual 2024 records are selectable
- records from `COMPATIBLE_2024_SOURCES` are selectable even if they are legacy/classic
- other legacy records are not selectable unless they already meet an explicit selectable rule

Expected examples:

- `Artificer [EFA]`: `rulesEdition: '2024'`, `isLegacy: false`, `isSelectableInBuilder: true`
- `Artificer [TCE]`: `rulesEdition: '2014'`, `isLegacy: true`, `isSelectableInBuilder: true`
- `Druid [XPHB]`: `rulesEdition: '2024'`, `isLegacy: false`, `isSelectableInBuilder: true`
- `Druid [PHB]`: `rulesEdition: '2014'`, `isLegacy: true`, `isSelectableInBuilder: false`

## Implementation Strategy

### 1. Split Importer Helpers
Update `scripts/5etools-importer/utils.mjs` so helper names and behavior reflect separate responsibilities.

Recommended helpers:

- `isActual2024Record(record, primary2024Sources)`
- `isPrimary2024Record(record, primary2024Sources)`
- `isBuilderSelectableRecord(record, primary2024Sources, compatible2024Sources)`

Exact naming can vary, but the code should make it hard to accidentally use compatibility for edition labels again.

### 2. Update Base Normalization
Update `createBaseRecord()` in `scripts/5etools-importer/normalize.mjs`.

Expected generated fields:

- `rulesEdition`: based on actual edition only
- `isLegacy`: based on actual edition only
- `isPrimary2024`: based on explicit 2024 / primary 2024 source only
- `isSelectableInBuilder`: based on builder selectability policy

### 3. Preserve Current UI Behavior
No UI code should be required for the badge/filter correction because current UI already uses generated `isLegacy` and `rulesEdition`.

Affected existing code should start behaving correctly after regeneration:

- `getEditionLabel()`
- category browse edition filters
- compendium list badges
- detail page source facts
- class detail badges

### 4. Extend Audit Checks
Update `scripts/audit-5etools.mjs` to assert edition classification for supported imported records.

Recommended strict audit checks:

- raw records with `edition: 'classic'` must not generate `rulesEdition: '2024'`
- raw records with `edition: 'one'` must generate `rulesEdition: '2024'`
- targeted Artificer checks:
  - `Artificer [TCE]` is `2014`, `isLegacy: true`, `isSelectableInBuilder: true`
  - `Artificer [EFA]` is `2024`, `isLegacy: false`, `isSelectableInBuilder: true`

Recommended coverage:

- classes
- subclasses
- species
- backgrounds
- feats
- optional features
- spells
- items
- conditions
- actions
- variant rules

The audit does not need to verify every compatibility policy decision in detail; it should specifically prevent compatibility from masquerading as actual edition.

### 5. Regenerate Content
Run:

- `npm run generate:5etools`

Expected generated impact:

- many records from compatible legacy sources change from `rulesEdition: '2024'` / `isLegacy: false` to `rulesEdition: '2014'` / `isLegacy: true`
- those records may remain `isSelectableInBuilder: true`
- content version changes

### 6. Verify
Run:

- `npm run audit:5etools`
- `npm run typecheck`

Manual/generated spot checks:

- `generated/5etools/classes/artificer-tce.json`
- `generated/5etools/classes/artificer-efa.json`
- class browse Artificer badges after app reload/reseed
- edition filters still split `2014` and `2024` based on generated `isLegacy`

## Acceptance Criteria
- `Artificer [TCE]` displays as `2014` / legacy.
- `Artificer [TCE]` remains selectable in builder flows.
- `Artificer [EFA]` displays as `2024`.
- `COMPATIBLE_2024_SOURCES` no longer changes visible edition labels.
- Audit fails if `edition: 'classic'` records are generated as `2024`.
- Audit passes after regeneration.
- `npm run typecheck` passes.
- No schema or migration files change.

## Non-Goals
- Add a new `2014 Compatible` badge.
- Add new database columns for compatibility reasons.
- Change character builder rules beyond preserving compatibility-based selectability.
- Revisit every source in `COMPATIBLE_2024_SOURCES`.
- Import new 5eTools categories.

## Risks And Mitigations
- Risk: users may wonder why `2014` content is selectable in a 2024 builder.
  - Mitigation: preserve current UI for now; consider a future `2014 Compatible` helper label if confusion remains.
- Risk: filters may show more `2014` entries than before.
  - Mitigation: this is correct because the filter should represent source edition, not builder compatibility.
- Risk: `isLegacy` may be used elsewhere to imply non-selectability.
  - Mitigation: verify builder code uses `isSelectableInBuilder` for selectability, not `isLegacy`.
