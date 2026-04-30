# Step 16 Feat Species and Background Detail Pages Execution Steps

## Goal
Execute the feat, species, and background detail-page pass in a controlled sequence so these common compendium entry types get type-specific quick-reference facts while continuing to use the shared detail renderer for body content.

## Execution Rules
- Do not change the importer in this step.
- Do not regenerate generated 5etools content in this step.
- Do not change SQLite schema or migrations.
- Do not add new content tables.
- Do not add clickable inline references.
- Do not change builder automation behavior.
- Reuse Step 13 detail components wherever practical.
- Keep parsing defensive and runtime-only.
- Prefer omission of unreliable metadata over raw JSON display.
- Preserve existing spell, item, class, and subclass detail behavior.

## Step-By-Step Execution Sequence

### 1. Inspect Representative Records
- Inspect representative feat records.
- Inspect representative species records.
- Inspect representative background records.
- Confirm reliable metadata fields and common shape variations.

Output:
- implementation notes for supported metadata shapes.

### 2. Add Shared Formatting Helpers
- Add compact string helpers for non-empty strings and arrays.
- Add title-case or label formatting where needed.
- Add defensive object walkers only for known simple metadata shapes.
- Avoid generic raw-object rendering.

Output:
- reusable helper foundation for detail facts.

### 3. Implement Ability Metadata Formatting
- Format deterministic ability bonuses such as `{ dex: 2, wis: 1 }`.
- Format common choose structures such as weighted/background choices.
- Omit shapes that cannot be summarized clearly.

Output:
- readable ability fact values for feats, species, and backgrounds.

### 4. Implement Proficiency Formatting
- Format skill proficiency objects.
- Format tool proficiency objects.
- Format language proficiency objects.
- Handle simple `anyStandard` counts when present.
- Omit complex unsupported structures.

Output:
- readable background and species proficiency facts.

### 5. Implement Species Fact Builder
- Format size values.
- Format speed values, including common walking and alternate-speed shapes.
- Format creature types.
- Format darkvision.
- Format trait tags.
- Include ability, source, and edition facts.

Output:
- `buildSpeciesFacts(entry)` style helper.

### 6. Implement Feat Fact Builder
- Format feat type from metadata category and feature type.
- Format ability benefit where readable.
- Include source and edition facts.
- Omit unreliable prerequisite or repeatability facts unless already clearly available.

Output:
- `buildFeatFacts(entry)` style helper.

### 7. Implement Background Fact Builder
- Format ability scores.
- Format skills, tools, and languages.
- Format equipment summary using inline cleanup.
- Include source and edition facts.

Output:
- `buildBackgroundFacts(entry, resolvedFeatNames)` style helper.

### 8. Add FeatDetailView
- Compose shared header.
- Render feat facts with `DetailFactGrid`.
- Render summary with `DetailSummarySection`.
- Render body with `RenderBlockList` and `buildRenderBlocks(entry)`.

Output:
- feats no longer use the generic detail page.

### 9. Add SpeciesDetailView
- Compose shared header.
- Render species facts with `DetailFactGrid`.
- Render summary with `DetailSummarySection`.
- Render body with `RenderBlockList` and `buildRenderBlocks(entry)`.

Output:
- species pages show quick-reference rules metadata above trait text.

### 10. Add BackgroundDetailView
- Compose shared header.
- Resolve `metadata.featIds` through existing content entity lookup.
- Render background facts with resolved feat names where available.
- Render summary with `DetailSummarySection`.
- Render body with `RenderBlockList` and `buildRenderBlocks(entry)`.

Output:
- background pages show builder-relevant metadata and readable granted feat names.

### 11. Wire Detail Delegation
- Update `CompendiumDetailScreen` delegation.
- Preserve existing spell, item, and subclass branches.
- Add branches for `feat`, `species`, and `background`.
- Keep generic fallback for everything else.

Output:
- supported entries route to their dedicated detail views.

### 12. Verify TypeScript
- Run `npm run typecheck`.
- Fix any type errors introduced by the new helpers and components.

Output:
- typecheck passes.

### 13. Manual Smoke Checks
- Open a 2024 origin feat.
- Open a general feat.
- Open a legacy feat with tables if available.
- Open a 2024 species.
- Open a legacy species.
- Open a 2024 background with a granted feat.
- Open a legacy background with long characteristics/tables.

Output:
- detail pages are readable, useful, and free of raw JSON/IDs.

### 14. Review Scope And Diff
- Confirm no generated content changed.
- Confirm no importer files changed.
- Confirm no SQLite schema or migration files changed.
- Confirm spell, item, class, and subclass files were only changed if necessary for shared behavior.

Output:
- implementation remains inside Step 16 boundaries.

## Task List
1. Inspect representative feat/species/background metadata shapes.
2. Add shared formatting helpers.
3. Implement ability metadata formatting.
4. Implement proficiency metadata formatting.
5. Build species fact helper.
6. Build feat fact helper.
7. Build background fact helper.
8. Add `FeatDetailView`.
9. Add `SpeciesDetailView`.
10. Add `BackgroundDetailView`.
11. Wire `CompendiumDetailScreen` delegation.
12. Run `npm run typecheck`.
13. Perform manual smoke checks.
14. Review final scope and diff.

## Verification Details

### Required Command
- `npm run typecheck`

### Required Feat Checks
- Feat type renders when available.
- Ability benefit renders when readable.
- Source and edition remain visible.
- Body text and tables still render through shared renderer.

### Required Species Checks
- Size renders when available.
- Speed renders when available.
- Creature type renders when available.
- Darkvision renders when available.
- Traits render when available.
- Body trait text remains readable.

### Required Background Checks
- Ability scores render when available.
- Skills render when available.
- Tools render when available.
- Languages render when available.
- Equipment summary renders when available.
- Granted feat names render when resolved.
- Unresolved feat IDs are not displayed.

## Risks During Execution

### Risk 1: Ability Metadata Has Many Variants
Mitigation:
- support common deterministic and choose shapes
- omit unusual shapes until a concrete case needs support

### Risk 2: Proficiency Metadata Is Nested
Mitigation:
- handle simple true/count entries only
- avoid raw object fallback

### Risk 3: Equipment Summary Is Too Long For A Fact Grid
Mitigation:
- start with concise cleaned summary
- if too long in manual checks, move equipment to a small `DetailSection`

### Risk 4: Background Feat Resolution Adds Loading States
Mitigation:
- mirror existing subclass related-entity query pattern
- hide granted feats until resolved

### Risk 5: Generic Detail Fallback Regresses
Mitigation:
- only add explicit branches for supported types
- leave fallback unchanged

## Exit Criteria
Step 16 is complete when:
- feat, species, and background entries render dedicated detail views
- useful facts appear above long body text
- rendered body content continues to use shared renderer
- background granted feats resolve to display names where possible
- no raw JSON or unresolved IDs appear in normal UI
- existing spell, item, class, and subclass detail pages still work
- no importer or generated content changes were made
- no schema or migration changes were made
- `npm run typecheck` passes
