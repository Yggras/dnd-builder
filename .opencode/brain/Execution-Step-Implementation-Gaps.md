# Execution Step Implementation Gaps

## Audit Context
- Audited all `*Execution-Steps.md` artifacts under `.opencode/Artifacts` on 2026-05-03.
- Source-confirmed completed checkbox work was marked in the checkbox-based execution files.
- `npm run typecheck` passes.
- `npm run audit:5etools` passes.
- The audit reports 8 unmatched subclass feature details out of 1332 as existing diagnostics, but no strict audit failure.

## Source-Confirmed Gaps

### Step 5: Original Compendium Search Surface
- Artifact: `.opencode/Artifacts/Step-5-Compendium-Execution-Steps.md`
- Finding: The original placeholder search screen with a search input and entry-type filter chips is no longer implemented as described.
- Current state: The compendium home is a category-first entry point, with category browse screens providing search and filters.
- Impact: This appears superseded by later category-browse work, but the Step 5 execution text does not reflect that evolution.

### Step 8: Equipment And Magic Item Top-Level Taxonomy
- Artifact: `.opencode/Artifacts/Step-8-Backgrounds-and-Equipment-Magic-Items-Compendium-Execution-Steps.md`
- Finding: The exact requested top-level `Equipment` and `Magic Items` compendium surfaces are not present.
- Current state: The app has an `Items` category with item-kind filtering for mundane and magic items, and detail badges can show `Equipment` or `Magic Item`.
- Impact: If the product still wants separate top-level surfaces, the category model needs another pass.

### Step 9a: Explicit Builder Progress Columns
- Artifact: `.opencode/Artifacts/Step-9a-Builder-State-Model-and-Capability-Audit-Execution-Steps.md`
- Finding: Roster-visible builder progress is not fully queryable from explicit columns.
- Current state: `character_builds` stores `build_state`, `current_step`, `revision`, timestamps, and full JSON payload. Roster labels still derive class/species information from payload.
- Impact: Roster and resume summaries still depend on payload parsing unless more explicit columns or denormalized summary fields are added.

### Step 9a: Stale Capability Audit Baseline
- Artifact: `.opencode/Artifacts/Step-9a-Builder-State-Model-and-Capability-Audit-Execution-Steps.md`
- Finding: `builderCapabilityAuditBaseline` is stale.
- Current state: It still marks some areas as missing or launch-blocking even though later implementation added multiclass allocation, characteristics/notes state, review/completion gating, and spell support.
- Impact: The audit baseline should be reconciled with current implementation before it is used for planning.

### Step 9b: Roster Labels Parse Payload
- Artifact: `.opencode/Artifacts/Step-9b-My-Characters-Roster-and-Builder-Shell-Execution-Steps.md`
- Finding: The roster does not read all visible progress from explicit columns.
- Current state: `SQLiteCharacterRepository` derives roster class/species labels from the build payload.
- Impact: This duplicates the Step 9a persistence-boundary gap and should be resolved with the same denormalized progress strategy if still desired.

### Step 11: Authoritative Category Definition Object
- Artifact: `.opencode/Artifacts/Step-11-Compendium-Category-Browse-and-Per-Category-Filters-Execution-Steps.md`
- Finding: There is no single authoritative category registry containing route keys, labels, supported filters, sort modes, and empty-state copy.
- Current state: Category labels, summaries, filters, and sorting logic are split across catalog and browse utilities.
- Impact: Category behavior works, but future category changes remain more error-prone than the artifact intended.

### Step 11: Filtering And Sorting Mostly Run In JavaScript
- Artifact: `.opencode/Artifacts/Step-11-Compendium-Category-Browse-and-Per-Category-Filters-Execution-Steps.md`
- Finding: Most compendium browse filtering and sorting is performed after loading category rows rather than in SQLite.
- Current state: Repository methods return broad category results, and `useCompendiumCategoryBrowse` applies most filters in memory.
- Impact: This is acceptable at current scale but conflicts with the execution step's performance direction.

### Step 13: Spell Casting Time Fact Missing From Generated Metadata
- Artifact: `.opencode/Artifacts/Step-13-Compendium-Detail-Screens-and-Renderer-Execution-Steps.md`
- Finding: Spell detail facts attempt to read `entry.metadata.time`, but spell normalization does not currently persist `time`.
- Current state: Spell facts include level, school, range, components, duration, ritual, and concentration. Casting time cannot render from current generated spell metadata.
- Impact: Add `metadata.time` during spell normalization and regenerate content if casting time should appear in spell facts.

### Step 16: Background Equipment Summary Fact
- Artifact: `.opencode/Artifacts/Step-16-Feat-Species-and-Background-Detail-Pages-Execution-Steps.md`
- Finding: `buildBackgroundFacts()` does not expose a background equipment summary fact.
- Current state: Background details render overview, facts, and detail blocks; equipment-related content is available in detail content rather than the top fact grid.
- Impact: Add an equipment fact only if the product still wants that information elevated into the top background facts section.

### Step 17: Inline Reference Pressed Feedback
- Artifact: `.opencode/Artifacts/Step-17-Inline-Compendium-Reference-Navigation-Execution-Steps.md`
- Finding: Clickable inline references do not have explicit pressed-state visual feedback.
- Current state: Resolved references are styled as underlined links.
- Impact: Add pressed styling in `RichTextLine` if tactile feedback remains desired.

### Step 20: Spell Filter Section Order
- Artifact: `.opencode/Artifacts/Step-20-Spell-Compendium-Optimization-Execution-Steps.md`
- Finding: The implemented spell filter order differs from the recommended order in the execution plan.
- Current state: The implemented order is Edition, Level, School, Role, Class, Damage Type, Ritual, Concentration, Source.
- Expected by artifact: Level, Class, Damage Type, School, Role, Ritual, Concentration, Edition, Source.
- Impact: Functionality exists; this is a UX alignment gap only.

### Step 23 Builder Stabilization: Inventory Issue Preservation
- Artifact: `.opencode/Artifacts/Step-23-Builder-Stabilization-Execution-Steps.md`
- Finding: The checklist item `Preserve existing inventory issues only where still valid` is not fully implemented.
- Current state: Inventory reconciliation removes only `inventory-starting-equipment-review` and preserves other inventory issues wholesale.
- Impact: Stale inventory issues can survive context changes until an explicit reseed recalculates inventory issues.

## Superseded Historical Findings

### Step 5c: Compatible Sources As Visible 2024 Labels
- Artifact: `.opencode/Artifacts/Step-5c-Importer-Edition-Labeling-Execution-Steps.md`
- Finding: The Step 5c goal to label broader compatible supplement sources as 2024 is no longer implemented.
- Current state: Step 22 intentionally separated actual source edition from builder compatibility. Compatible legacy content can remain selectable while displaying as `2014` / legacy.
- Impact: Treat Step 5c's older labeling goal as superseded by Step 22 unless product policy changes again.

## Verification-Only Gaps

### Supabase Dashboard Auth Settings
- Artifact: `.opencode/Artifacts/Step-2-Auth-Execution-Steps.md`
- Finding: Dashboard-only assumptions such as disabled self-signup and user confirmation state cannot be verified from this repository.
- Impact: Confirm these directly in Supabase project settings before treating auth as operationally complete.

### Historical Baseline Audit Before Fix
- Artifact: `.opencode/Artifacts/Step-21-5etools-Import-Coverage-Audit-and-Class-Variant-Reachability-Execution-Steps.md`
- Finding: The baseline pre-fix failing audit cannot be reproduced from the current fixed source state.
- Impact: This remains unchecked in the execution artifact as historical verification that is no longer actionable without reverting to the old generated content state.

### Manual Smoke Checks Still Needed
- Artifact: `.opencode/Artifacts/Step-23-Builder-Stabilization-Execution-Steps.md`
- Finding: Manual smoke checks for rapid edits, class/subclass cleanup, inventory reseeding, and complete-to-draft regression have not been verified in this audit.
- Impact: Run these in the app before declaring the stabilization work fully accepted.

### Older Manual Verification Sections
- Artifacts: Steps 5d, 9f, 10, 11, 12, 13, 14, 15, 15a, 16, 17, 18, 19, 19a, and 20.
- Finding: Several historical execution files include manual UI, regeneration determinism, runtime reseed, or final diff review steps that are not source-verifiable today.
- Impact: Source implementation is present for most of those steps, but manual verification remains undocumented unless prior run notes exist outside the repo.

## No Source-Confirmed Gaps Found
- Step 1 Scaffolding.
- Step 3 5eTools Importer.
- Step 4 Content Seeding.
- Step 5b Local Schema Migrations.
- Step 6 Arcane Command Center.
- Step 7 Global Characters and Campaign Assignments.
- Step 9c Class Allocation and Feature Choice Engine.
- Step 9d Species, Background, and Ability Score Builder.
- Step 9e Inventory and Starting Equipment Builder.
- Step 22 Edition Labeling and Builder Compatibility Separation.
- Step 23 Weapon Item Facts, Range, Properties, and Mastery Links.
