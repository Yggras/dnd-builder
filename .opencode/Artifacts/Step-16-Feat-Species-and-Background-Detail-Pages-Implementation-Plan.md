# Step 16 Feat Species and Background Detail Pages Implementation Plan

## Objective
Add dedicated compendium detail views for feats, species, and backgrounds so these common builder-facing entry types reach the same quality level as spells, items, classes, and subclasses.

The outcome is that feat, species, and background detail pages show useful quick-reference facts above the existing rendered body text, while preserving the shared compendium detail renderer and current navigation model.

## Confirmed Decisions
- Implement feats, species, and backgrounds together in one step.
- This step is runtime/UI only.
- Do not change the importer.
- Do not regenerate generated 5etools content.
- Do not change SQLite schema or migrations.
- Do not add new content tables.
- Do not change builder automation behavior.
- Do not add clickable inline references.
- Reuse Step 13 shared detail components.
- Keep generic detail fallback for any unsupported compendium entry type.

## Product Boundary

### Included In Step 16
- Dedicated `FeatDetailView`.
- Dedicated `SpeciesDetailView`.
- Dedicated `BackgroundDetailView`.
- Fact-grid helpers for feat metadata.
- Fact-grid helpers for species metadata.
- Fact-grid helpers for background metadata.
- Resolution of background granted feat IDs to feat names where available.
- `CompendiumDetailScreen` delegation for `feat`, `species`, and `background`.
- TypeScript verification.
- Manual smoke checks for representative 2024 and legacy entries.

### Explicitly Excluded From Step 16
- Importer changes.
- Generated content changes.
- SQLite schema or migration changes.
- New compendium categories.
- Clickable related-content links.
- Builder validation or automation changes.
- New search or filter behavior.
- Full homebrew or custom-content handling.
- Overhauling the generic renderer.

## Current State Summary

### Already Present
- `GenericCompendiumDetailView` renders header, summary, and body blocks for all non-specialized entry types.
- `RenderBlockList` already handles paragraphs, headings, lists, tables, and fallback text.
- `DetailFactGrid`, `DetailSection`, and `DetailSummarySection` are reusable for all detail pages.
- Generated feat, species, and background compendium records already include useful `metadata` and `renderPayload.entries`.
- Background metadata includes `featIds`, allowing granted feats to be resolved by existing content lookup methods.

### Missing
- Feats do not yet show dedicated quick-reference facts such as feat type and ability benefits.
- Species do not yet show dedicated quick-reference facts such as size, speed, creature type, darkvision, traits, and ability metadata.
- Backgrounds do not yet show dedicated quick-reference facts such as ability scores, granted feat, proficiencies, languages, and equipment.
- Background granted feat IDs are not yet resolved to readable feat names on detail pages.

## Implementation Strategy

### 1. Shared Detail Fact Helpers
Extend detail fact utility code with defensive display helpers for the metadata shapes used by feats, species, and backgrounds.

Recommended helper coverage:
- ability metadata entries
- feat category labels
- size labels
- speed summaries
- creature type summaries
- darkvision summaries
- language summaries
- skill/tool proficiency summaries
- equipment summary cleanup

Keep the helpers conservative. If a metadata shape is too irregular, omit the fact instead of displaying raw JSON.

### 2. Feat Detail View
Add a dedicated feat view that composes:
- shared detail header
- fact grid
- summary section
- rendered body blocks

Recommended feat facts:
- Type: Origin, General, Epic Boon, Fighting Style, or Other
- Ability: formatted ability benefit or choice, when readable
- Repeatable: only if reliably detectable later; omit if not present
- Source
- Edition

Do not attempt deep prerequisite automation in this step unless metadata is already readily displayable.

### 3. Species Detail View
Add a dedicated species view that composes:
- shared detail header
- fact grid
- summary section
- rendered body blocks

Recommended species facts:
- Size
- Speed
- Creature Type
- Darkvision
- Traits
- Ability
- Source
- Edition

Speed formatting should support common object shapes such as `{ walk: 30, fly: true }` without showing raw booleans. Boolean alternate speeds can be rendered as readable labels such as `Fly equal to walking speed` when practical.

### 4. Background Detail View
Add a dedicated background view that composes:
- shared detail header
- fact grid
- optional granted feat section or fact
- summary section
- rendered body blocks

Recommended background facts:
- Ability Scores
- Skills
- Tools
- Languages
- Equipment
- Source
- Edition

Resolve `metadata.featIds` through `getContentEntitiesByIds` and display resolved feat names only. Do not display unresolved IDs.

### 5. Detail Screen Delegation
Update `CompendiumDetailScreen` so:
- `feat` routes to `FeatDetailView`
- `species` routes to `SpeciesDetailView`
- `background` routes to `BackgroundDetailView`
- existing spell, item, and subclass paths remain intact
- all other entry types keep using `GenericCompendiumDetailView`

### 6. Verification
Run `npm run typecheck`.

Manual smoke checks should include:
- one 2024 origin feat
- one general feat
- one legacy feat with table content if available
- one 2024 species
- one legacy species
- one 2024 background with granted feat
- one legacy background with long characteristics/tables

## Code Areas To Change When Approved

### Detail Fact Utilities
- `src/features/compendium/utils/detailFacts.ts`

Expected impact:
- Add fact builders for feats, species, and backgrounds.
- Add local formatting helpers for readable metadata display.

### New Detail Components
- `src/features/compendium/components/FeatDetailView.tsx`
- `src/features/compendium/components/SpeciesDetailView.tsx`
- `src/features/compendium/components/BackgroundDetailView.tsx`

Expected impact:
- Compose existing shared detail components with type-specific fact grids.
- Keep styles minimal and local only where needed.

### Detail Screen Routing
- `src/features/compendium/screens/CompendiumDetailScreen.tsx`

Expected impact:
- Add type-specific delegation for `feat`, `species`, and `background`.

### Optional Shared Helpers
- `src/features/compendium/utils/catalog.ts`

Expected impact:
- Only adjust if existing labels are not reusable from `detailFacts.ts`.

## Risks And Mitigations

### Risk 1: Metadata Shapes Are Irregular
Mitigation:
- support common readable cases only
- omit unsupported shapes rather than rendering raw JSON

### Risk 2: Ability Formatting Becomes Too Broad
Mitigation:
- implement compact display for deterministic bonuses and common choose structures
- defer rare ability-shape polish to follow-up

### Risk 3: Background Equipment Is Verbose
Mitigation:
- use `metadata.equipmentSummary` if present
- parse inline tags through existing rich text cleanup helpers
- keep equipment as a concise fact or small section, not a huge custom UI

### Risk 4: Background Granted Feat IDs Do Not Resolve
Mitigation:
- show only resolved names
- omit the granted feat fact/section if nothing resolves

### Risk 5: Detail Screen Delegation Gets Noisy
Mitigation:
- keep route/query logic in `CompendiumDetailScreen`
- delegate all loaded-entry rendering to focused components

## Exit Criteria
Step 16 is complete when:
- feat entries use a dedicated detail view
- species entries use a dedicated detail view
- background entries use a dedicated detail view
- facts are shown only when readable and useful
- body text still renders through the shared renderer
- background granted feats resolve to names when available
- unresolved IDs and raw JSON are not shown
- spell, item, class, and subclass detail behavior is unchanged
- no importer, generated content, schema, migration, or builder changes were made
- `npm run typecheck` succeeds
