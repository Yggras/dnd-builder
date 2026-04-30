# Step 18 Reference Only Compendium Content Implementation Plan

## Objective
Import and expose reference-only compendium content needed by inline references and rules lookup, starting with conditions, actions, and variant rules.

This step expands the generated compendium dataset after Step 17 establishes inline navigation mechanics for existing content.

## Confirmed Decisions
- Conditions and variant rules are in v1 content scope as reference-only content.
- Actions are useful reference targets for existing class, spell, and item text.
- This step may change importer code and generated content.
- This step may extend domain type unions for new content entity types.
- Do not add builder automation for these content types.
- Do not add homebrew or user import support.
- Keep content reference-only in v1.
- Use existing generic detail view unless type-specific views are clearly needed.

## Product Boundary

### Included In Step 18
- Extend importer source loading for reference-only source files.
- Normalize conditions.
- Normalize actions.
- Normalize variant rules.
- Add generated content chunks for new reference-only types.
- Add compendium entries for new reference-only types.
- Update local domain/content type unions as needed.
- Update bundled content bootstrap/write paths as needed.
- Add browse/search support only if required for detail resolution and existing compendium search.
- Expand Step 17 inline resolver to support newly imported reference-only types.
- Run generator and typecheck.

### Explicitly Excluded From Step 18
- Builder automation changes.
- Character sheet condition automation.
- Combat/action automation.
- New encounter or rules-tool surfaces.
- Homebrew import/editing.
- Public content distribution workflow changes.
- Deep custom layouts for every reference type unless needed for readability.
- Monsters, NPCs, vehicles, boons, rewards, hazards, objects, diseases, deities, or other excluded v1 types.

## Current State Summary

### Already Present
- Generated compendium content currently includes species, classes, subclasses, backgrounds, feats, optional features, spells, and items.
- Conditions, actions, and variant rules are not currently generated.
- Inline parser already recognizes tags such as `condition`, `action`, and `variantrule` for readable display text.
- Generic detail renderer can render most prose/list/table records if normalized into `renderPayload.entries`.

### Missing
- Source files for conditions/actions/variant rules are not loaded.
- Normalizers do not exist for these reference-only types.
- Domain type unions do not include these entity types.
- Generated writer does not chunk these entity groups.
- Content bootstrap does not seed these entity groups.
- Inline resolver cannot navigate to these types until entries exist.

## Implementation Strategy

### 1. Identify Source Files
Inspect 5etools source structure for likely files:
- conditions/statuses
- actions
- variant rules
- rules reference files if needed

Do not assume exact filenames before inspecting source data.

### 2. Extend Source Loading
Add source file paths to importer config.
Load reference-only JSON alongside existing source files.

Keep this explicit and curated. Do not broadly import every rules file.

### 3. Normalize Reference Records
Create normalizers that reuse existing base record behavior where possible.

Recommended generated metadata:
- `entriesText`
- lightweight category/kind if source has one
- no builder-specific grant metadata

Recommended render payload:
- preserve `entries` for shared renderer

### 4. Extend Content Entity Types
Add new content entity types:
- `condition`
- `action`
- `variantrule`

Update associated type unions and repository code to accept these records.

### 5. Extend Generated Writer
Add chunks for reference-only content.

Possible chunking:
- `conditions/all.json`
- `actions/all.json`
- `variant-rules/all.json`
- `compendium/conditions.json`
- `compendium/actions.json`
- `compendium/variantRules.json`

Keep chunk naming consistent with existing generated registry conventions.

### 6. Seed And Query Support
Ensure bundled bootstrap seeds new content entities and compendium entries through existing generic paths.

If existing repository methods are type-union constrained, widen them safely.

Avoid adding new list UI unless needed.

### 7. Detail Rendering
Use `GenericCompendiumDetailView` initially.

Only add type-specific views if generic rendering is clearly insufficient in smoke checks.

### 8. Inline Resolver Expansion
After records exist, extend inline reference navigation from Step 17:
- `condition` -> condition detail
- `action` -> action detail
- `variantrule` -> variant rule detail

Keep unsupported references non-clickable.

### 9. Verification
Run `npm run generate:5etools`.
Run `npm run typecheck`.

Manual checks:
- condition detail opens and renders readable text
- action detail opens and renders readable text
- variant rule detail opens and renders readable text
- inline condition/action/variant rule refs navigate when resolved
- unsupported references remain safe

## Code Areas To Change When Approved

### Importer Config And Orchestration
- `scripts/5etools-importer/config.mjs`
- `scripts/generate-5etools.mjs`

Expected impact:
- add source files
- load new raw collections
- pass them to normalization/writer

### Importer Normalization
- `scripts/5etools-importer/normalize.mjs`

Expected impact:
- add normalizers for conditions, actions, variant rules
- include new groups in compendium entry normalization

### Generated Writer
- `scripts/5etools-importer/write.mjs`

Expected impact:
- add chunk groups and compendium chunks for new types

### Domain And Content Types
- `src/shared/types/domain.ts`
- content repository/service types as needed

Expected impact:
- extend `ContentEntityType`
- ensure generic content handling accepts new types

### Inline Resolver
- Step 17 resolver files

Expected impact:
- enable navigation for condition/action/variant-rule tags

### Generated Content
- `generated/5etools/**`
- `src/shared/content/generated/5etoolsRegistry.ts`

Expected impact:
- new chunks and updated manifest/registry

## Risks And Mitigations

### Risk 1: Source Shapes Differ From Existing Records
Mitigation:
- keep normalizers defensive
- preserve entries for generic renderer

### Risk 2: Scope Creep Into Full Rules Reference
Mitigation:
- limit Step 18 to conditions, actions, and variant rules
- defer tables and other rule references unless needed later

### Risk 3: Generated Diff Is Large
Mitigation:
- regenerate once after implementation is ready
- inspect representative chunks and manifest

### Risk 4: New Types Need Category UI
Mitigation:
- do not add top-level browse categories unless explicitly needed
- ensure detail routes and search can open entries

### Risk 5: Reference Matching Ambiguity
Mitigation:
- preserve source-aware IDs
- do not navigate ambiguous refs

## Exit Criteria
Step 18 is complete when:
- conditions are generated as reference-only compendium entries
- actions are generated as reference-only compendium entries
- variant rules are generated as reference-only compendium entries
- generic detail pages render these entries readably
- inline condition/action/variant-rule refs navigate when resolved
- no builder automation changes were made
- no schema or migration changes were made unless explicitly approved
- `npm run generate:5etools` succeeds
- `npm run typecheck` succeeds
