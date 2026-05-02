# Step 21 5eTools Import Coverage Audit and Class Variant Reachability Implementation Plan

## Objective
Add a deterministic audit for currently imported 5eTools content and fix class-scoped subclass reachability so imported class/subclass variants are not silently hidden from the app.

This step focuses on answering two questions:

- Did we import everything we currently claim to import from 5eTools?
- Is every imported class and subclass variant reachable through the app's class-scoped compendium UX?

## Confirmed Decisions
- Audit only categories that this app currently imports.
- Document the audit scope so it must be extended when new 5eTools categories are imported.
- Do not add a global `Subclasses` compendium category.
- Keep subclass discovery class-scoped because subclasses derive from a specific class variant.
- Make the audit fail for coverage gaps inside supported imported categories.
- Make the audit warn or report informationally for known non-critical diagnostics and unsupported 5eTools categories.
- Preserve builder safety through existing `isSelectableInBuilder` filtering.
- Do not change SQLite schema or migrations unless a later implementation discovery proves it is unavoidable.

## Current State Summary

### Imported Source Scope Today
The importer currently reads these 5eTools sources:

- `data/races.json`
- `data/class/index.json` plus indexed `data/class/*.json`
- `data/backgrounds.json`
- `data/fluff-backgrounds.json`
- `data/feats.json`
- `data/optionalfeatures.json`
- `data/spells/index.json` plus indexed `data/spells/*.json`
- `data/generated/gendata-spell-source-lookup.json`
- `data/items-base.json`
- `data/items.json`
- `data/conditionsdiseases.json`
- `data/actions.json`
- `data/variantrules.json`

The audit should initially cover only records derived from those sources.

### Out Of Current Audit Scope
Examples of 5eTools categories not currently imported and therefore not audited as failures:

- monsters / bestiary
- adventures
- books
- languages
- deities
- vehicles
- traps and hazards
- rewards
- psionics
- objects
- tables
- recipes
- bastions
- character creation options

These may be listed as informational `out of scope` entries so future gaps are visible without failing the audit.

### Known Coverage Problem
Raw and normalized class/subclass counts currently indicate that the importer normalizes more subclass variants than the app seeds for class-detail browsing.

Observed before this step:

- Raw 5eTools classes: `30`
- Raw 5eTools subclasses: `315`
- Normalized classes: `30`
- Normalized subclasses: `315`
- Generated compendium subclass entries: `315`
- Seeded subclass content entities from class chunks: `159`
- Druid raw/imported subclass variants: `18`
- Druid visible under the preferred class chunk: `9`

The issue is not that Druid subclasses fail to normalize. The issue is that `writeGeneratedContent()` collapses class chunks by class name, selects a preferred class variant, and only writes subclasses attached to that selected class variant.

## Implementation Strategy

### 1. Add Audit Scope Documentation
Create an audit scope document near the importer, recommended path:

- `scripts/5etools-importer/AUDIT_SCOPE.md`

The document should include:

- supported imported categories
- source files used for each supported category
- explicitly out-of-scope 5eTools categories
- rule that this document and the audit script must be updated when adding a new imported category
- strictness policy for failures vs warnings

### 2. Add Audit Script
Add a script, recommended path:

- `scripts/audit-5etools.mjs`

Add package script:

- `npm run audit:5etools`

The audit should be read-only and deterministic. It should not regenerate content and should not modify files.

Recommended audit phases:

- fetch the same 5eTools source files as `scripts/generate-5etools.mjs`
- resolve `_copy` records the same way the generator does
- normalize records using the same normalizers where practical
- read generated `generated/5etools/content-index.json`
- read generated chunks needed for count comparison
- compare raw, resolved, normalized, compendium, and seeded chunk counts
- print a concise report
- exit non-zero when strict imported-category coverage checks fail

### 3. Audit Supported Category Counts
The audit should report counts for currently imported categories:

- species
- classes
- subclasses
- backgrounds
- feats
- optional features
- spells
- items
- conditions
- actions
- variant rules
- choice grants
- compendium entries

Recommended strict checks:

- normalized count equals generated manifest `entityCounts` for the same category
- every normalized entity has a corresponding generated content entity when that category is seeded as content entities
- every normalized entity has a corresponding compendium entry when that entity type is included in compendium entries
- content-index chunk counts agree with actual chunk contents

### 4. Audit Class And Subclass Reachability
Add class/subclass-specific strict checks:

- every normalized class appears in generated class chunks
- every normalized subclass appears in generated class chunks
- every subclass chunk record has a valid `classId`
- every subclass `classId` refers to a generated class content entity
- every class chunk contains only subclasses whose `classId` equals that chunk's class id
- per-class subclass counts in chunks match normalized subclasses grouped by `classId`

The audit should print per-class mismatches with enough detail to diagnose cases like Druid.

Recommended diagnostic format:

```text
FAIL subclasses reachability: normalized=315 seeded=159 missing=156
  Druid [PHB] expected=7 actual=0
  Druid [XPHB] expected=11 actual=9
```

Exact counts may differ after the implementation fix.

### 5. Fix Class Chunk Generation
Update `scripts/5etools-importer/write.mjs` so class chunks preserve every normalized class variant instead of collapsing by lowercase class name.

Current behavior:

- group classes by class name
- select one preferred class per name
- include preferred subclasses by name for that selected class

Recommended behavior:

- create one class chunk per normalized class record
- use a stable chunk id that includes class identity, not only lowercase class name
- include all normalized subclasses whose `classId` equals that class record's id
- do not collapse subclass variants by lowercase subclass name inside a class variant

Expected result:

- generated class chunk seeded class count equals normalized class count
- generated class chunk seeded subclass count equals normalized subclass count
- class detail remains class-scoped
- Druid variants and their matching subclass variants are reachable through their corresponding Druid class entries

### 6. Preserve Builder Behavior
Builder flows should continue using `ContentService.listClasses()` and `listSubclasses()` with `onlySelectableInBuilder: true`.

Compendium browse flows should continue using `browseClasses()` and `browseSubclasses()` with `onlySelectableInBuilder: false`.

No builder-specific behavior should be expanded in this step unless needed to preserve existing behavior after the chunking fix.

### 7. Verify Generated Content
After changing chunk generation, run:

- `npm run generate:5etools`

Expected generated impact:

- class chunks change substantially
- content-index chunk count may increase because class variants are no longer collapsed into one chunk per class name
- content version changes
- compendium chunks should remain aligned with normalized records

### 8. Verify Audit And Types
Run:

- `npm run audit:5etools`
- `npm run typecheck`

Expected audit result after fixes:

- strict supported-category checks pass
- class/subclass reachability checks pass
- unsupported 5eTools categories are informational only

## Acceptance Criteria
- Audit scope documentation exists and lists current imported categories and source files.
- `npm run audit:5etools` exists.
- Audit exits non-zero for missing supported imported records.
- Audit does not fail for categories not currently imported.
- Every normalized class variant is present in generated class chunks.
- Every normalized subclass variant is present in generated class chunks.
- Druid subclass variants are reachable through their corresponding Druid class variants.
- No global subclass category is added.
- `npm run generate:5etools` succeeds.
- `npm run audit:5etools` succeeds after the reachability fix.
- `npm run typecheck` succeeds.

## Non-Goals
- Import new 5eTools categories.
- Add a global subclass browse category.
- Add monsters, languages, vehicles, traps, rewards, psionics, tables, adventures, or books.
- Change local SQLite schema or migrations.
- Change character builder feature automation.
- Resolve every existing subclass feature detail warning unless it directly blocks coverage auditing.

## Risks And Mitigations
- Risk: class chunk ids changing may affect generated registry imports.
  - Mitigation: use stable ASCII-safe chunk ids and let registry generation derive imports from manifest chunks.
- Risk: class browse may show multiple same-named class variants.
  - Mitigation: existing result metadata includes source/edition context; preserve class-scoped detail navigation.
- Risk: generated diff is large.
  - Mitigation: expected because class chunking changes and generated timestamps/content version update.
- Risk: audit duplicates generator logic and drifts.
  - Mitigation: import and reuse existing generator helper functions/normalizers where practical, or keep shared audit helpers small and explicit.
