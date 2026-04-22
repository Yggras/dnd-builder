# Step 8 Backgrounds and Equipment Magic Items Compendium Implementation Plan

## Objective
Expand the app-managed content pipeline and compendium so backgrounds become searchable first-class entries, while the current item surface is clarified into two player-facing compendium categories:
- `Equipment` for mundane non-magical gear such as torches, rope, tools, weapons, and armor
- `Magic Items` for all magical item entries

This step extends the existing 5etools-derived content flow from source fetch through normalization, generated bundle output, SQLite seeding, repository filtering, and compendium UI labeling.

## Confirmed Decisions
- Backgrounds must be imported into the app and searchable in the compendium.
- The existing user-facing `Items` terminology should be replaced with `Equipment`.
- `Equipment` means mundane non-magical gear.
- Everything magical should appear under `Magic Items`.
- The underlying stored item entity type may remain `item`; the split into `Equipment` and `Magic Items` is a runtime taxonomy and UI concern.
- Compendium type badges for magical item entries should read `Magic Item`.
- Execution rule for this artifact phase: document the plan and execution sequence before feature code is written.

## Product Boundary

### Included In Step 8
- Add backgrounds to the importer source set, normalization pipeline, generated bundle, SQLite seed flow, and compendium search.
- Preserve compendium metadata needed to classify item entries at runtime.
- Add separate compendium filter modes for `Backgrounds`, `Equipment`, and `Magic Items`.
- Rename current user-facing `Items` language to `Equipment` where it refers to mundane gear browsing.
- Update compendium result and detail labeling so magical items render as `Magic Item` and mundane items render as `Equipment`.
- Regenerate bundled content and verify the new records are reachable through the app's local-first compendium flow.

### Explicitly Excluded From Step 8
- Full background integration into the guided character builder flow.
- Background-specific builder validation, auto-application of benefits, or granted-feat substeps.
- Manual inventory editing or homebrew item creation.
- Rich compendium rendering beyond the current text-first detail strategy.
- Realtime, sync-queue, or Supabase changes unrelated to content bootstrap and local search.

## Feature Goals
- A user can search and browse backgrounds from the compendium.
- A user can distinguish mundane gear from magical items without guessing from source text.
- `Equipment` and `Magic Items` use the same classification rule in generated content and runtime compendium filters.
- The runtime compendium remains backed by `compendium_entries`, not generated JSON reads in screen code.
- The changes should strengthen the future builder content layer without forcing builder scope into this step.

## Target Taxonomy

### Backgrounds
Backgrounds become a first-class content type and compendium entry type.

Recommended responsibilities:
- searchable compendium entry
- builder-ready canonical content record for future work
- source and edition labeling consistent with the rest of the content model

Underlying type:
- `background`

### Equipment
Equipment is the user-facing compendium classification for mundane non-magical item entries.

Examples:
- rope
- torches
- packs
- artisan tools
- non-magical armor
- non-magical weapons

Underlying stored type:
- `item`

### Magic Items
Magic Items are the user-facing compendium classification for magical item entries.

Underlying stored type:
- `item`

### Item Classification Rule
Use one rule consistently in generation and runtime filtering:
- `Equipment` if `category === 'basic'`
- `Equipment` if `rarity == null`
- `Equipment` if `rarity === 'none'`
- otherwise `Magic Item`

Reason:
- this matches the existing generated chunk split between `mundaneEquipment` and `magicItems`, reducing drift between pipeline output and runtime filtering

## Design Rules

### Metadata Preservation Rule
Compendium rows must preserve enough metadata to support local filtering and labeling.

Reason:
- the current compendium search path reads from SQLite `compendium_entries`, so item metadata must survive generation and seed import in order to distinguish `Equipment` from `Magic Items`

### Canonical Type Rule
Do not introduce a separate persisted `magicitem` entity type.

Reason:
- magical and mundane entries already share the canonical `item` model; the needed change is taxonomy and filtering, not a split runtime schema

### Taxonomy Alignment Rule
Screen labels, filter labels, and result badges must agree on the same classification rule.

Reason:
- mismatched labels would make compendium search feel inconsistent and undermine trust in the content model

### Smallest Useful Background Rule
Import backgrounds deeply enough to support compendium search and future builder reuse, but stop short of builder implementation.

Reason:
- the app needs background content in the data layer now, while the actual builder flow can land in a later step

## Architectural Approach

### 1. Importer Source Expansion
Extend the 5etools importer input set so backgrounds are fetched alongside the existing supported source files.

Primary targets:
- `scripts/5etools-importer/config.mjs`
- `scripts/generate-5etools.mjs`

Responsibilities:
- add the raw backgrounds source path
- fetch and resolve background records during bundle generation

### 2. Background Normalization
Add a background normalization path that produces canonical content records with enough metadata for compendium and later builder work.

Primary target:
- `scripts/5etools-importer/normalize.mjs`

Responsibilities:
- add `normalizeBackgrounds`
- produce stable background IDs
- capture background-specific metadata such as abilities, feat links, proficiencies, and equipment summaries where cleanly available
- include background text and render payload in the same style as existing normalized records

### 3. Generated Bundle Expansion
Emit background chunks and background compendium entries alongside existing generated content.

Primary target:
- `scripts/5etools-importer/write.mjs`

Responsibilities:
- add background chunk output
- add background compendium chunk output
- update manifest entity counts and chunk lists
- keep generated registry output aligned with the new chunks

### 4. Shared Type Alignment
Update shared domain types so the app recognizes backgrounds as a supported content and compendium type.

Primary target:
- `src/shared/types/domain.ts`

Responsibilities:
- extend type unions to include `background`
- keep compendium types broad enough for UI-level taxonomy without breaking existing repository contracts

### 5. Compendium Metadata Preservation
Preserve metadata on generated compendium entries and SQLite-seeded compendium rows.

Primary targets:
- `scripts/5etools-importer/normalize.mjs`
- `src/shared/content/bootstrap.native.ts`

Responsibilities:
- carry metadata into generated compendium entry records
- write preserved metadata into SQLite `compendium_entries.metadata`

### 6. Repository Filter Expansion
Teach the local compendium search adapter to support the new filter modes.

Primary target:
- `src/features/content/adapters/SQLiteContentRepository.ts`

Responsibilities:
- add support for `background`
- add support for `equipment`
- add support for `magicitem`
- keep the existing `all` and canonical entry-type flow intact

### 7. Hook And UI Filter Alignment
Update the compendium hook and screens to expose the new taxonomy.

Primary targets:
- `src/features/compendium/hooks/useCompendiumSearch.ts`
- `src/features/compendium/screens/CompendiumScreen.tsx`
- `src/features/compendium/screens/CompendiumDetailScreen.tsx`

Responsibilities:
- add `Backgrounds`, `Equipment`, and `Magic Items` filter options
- rename current `Items` copy where it refers to mundane equipment browsing
- render result and detail badges as `Equipment` or `Magic Item` based on metadata-aware classification

### 8. Generated Content Verification
Regenerate the bundled content and verify the new content set flows through the app bootstrap successfully.

Primary targets:
- `generated/5etools/**`
- `src/shared/content/generated/5etoolsRegistry.ts`

Responsibilities:
- run the content generator
- confirm manifest counts and chunks include backgrounds
- confirm SQLite seeding still succeeds

## Proposed Data Shapes

### `background` canonical content record
Recommended fields beyond the shared base shape:
- `metadata.ability`
- `metadata.featOptions`
- `metadata.skillProficiencies`
- `metadata.toolProficiencies`
- `metadata.languageProficiencies`
- `metadata.equipmentSummary`
- `metadata.entriesText`

### `compendium_entry` metadata for items
Recommended relevant fields retained for runtime taxonomy:
- `category`
- `rarity`
- `type`
- `typeAlt`

Only the subset required for filtering and labeling must be preserved.

## Technical Verification
- Run `npm run generate:5etools`.
- Run `npm run typecheck`.
- Confirm generated manifest counts include backgrounds.
- Confirm generated chunk list includes background content and background compendium entries.
- Confirm local bootstrap still seeds content without metadata loss.
- Search for at least one known background entry in the compendium.
- Verify `Equipment` filter returns mundane gear entries.
- Verify `Magic Items` filter returns only magical item entries.
- Verify item result badges and detail badges display `Equipment` or `Magic Item` consistently.

## Risks And Mitigations

### Risk 1: Background Source Shape Differs From Existing Normalizers
Mitigation:
- keep the first normalization pass pragmatic and metadata-light where needed, capturing reliable text and common structured fields first

### Risk 2: Runtime Filtering Cannot Distinguish Mundane From Magical Items
Mitigation:
- preserve compendium metadata during generation and SQLite seeding before adding the new filter UI

### Risk 3: UI Labels Drift From Generated Taxonomy
Mitigation:
- derive both repository filtering and badge labeling from the same item classification helper or equivalent shared rule

### Risk 4: Scope Creep Into Builder Background Logic
Mitigation:
- stop after content import, search, and UI taxonomy work; defer builder behavior to a later step

### Risk 5: Generated Content Changes Break Existing Search
Mitigation:
- keep the compendium repository boundary unchanged for existing callers and verify `all` plus legacy filters still behave correctly

## Exit Criteria
Step 8 is complete when:
- backgrounds exist in the generated content bundle and seeded SQLite database
- backgrounds are searchable in the compendium
- the user-facing `Equipment` and `Magic Items` filters both work
- magical item rows and detail views display `Magic Item`
- mundane item rows and detail views display `Equipment`
- compendium metadata needed for runtime taxonomy is preserved
- generated content and typecheck verification pass
