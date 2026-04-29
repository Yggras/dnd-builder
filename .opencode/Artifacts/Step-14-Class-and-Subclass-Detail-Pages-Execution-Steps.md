# Step 14 Class and Subclass Detail Pages Execution Steps

## Goal
Execute the class and subclass detail-page pass in a controlled sequence so the existing class route becomes a useful class reference page and normal subclass entries receive a dedicated metadata-driven detail view.

## Execution Rules
- Do not change the importer in this step.
- Do not regenerate generated 5etools content in this step.
- Do not change SQLite schema or migrations in this step.
- Do not implement a top-level subclass category.
- Do not implement clickable inline cross-reference links.
- Do not broaden the scope into compendium search or SQLite optimization.
- Reuse Step 13 detail components wherever practical.
- Keep parsing defensive and runtime-only.
- Prefer omission of unreliable metadata over raw JSON display.

## Step-By-Step Execution Sequence

### 1. Inspect Representative Class And Subclass Records
- Inspect current seeded/generated class and subclass shapes.
- Confirm reliable metadata fields for classes.
- Confirm reliable metadata fields for subclasses.
- Confirm common feature-reference string patterns.

Output:
- implementation notes for supported metadata shapes.

### 2. Add Class/Subclass Detail Utility Types
- Define a `FeatureProgressionRow` type.
- Define helper output shapes for class facts, subclass facts, proficiencies, and equipment text.
- Keep types local to compendium detail utilities unless reuse becomes necessary.

Output:
- stable internal contracts for class/subclass rendering.

### 3. Implement Ability And Hit Die Formatting
- Format class primary abilities from metadata.
- Format ability abbreviations into readable labels.
- Format hit die from metadata.
- Handle malformed or missing values gracefully.

Output:
- class fact helpers for abilities and hit die.

### 4. Implement Spellcasting Fact Formatting
- Format spellcasting ability when present.
- Format caster progression when present.
- Prefer human-readable labels over raw codes where simple.
- Omit missing values.

Output:
- class/subclass spellcasting facts.

### 5. Implement Feature Reference Parsing
- Parse class feature strings.
- Parse class feature objects with `classFeature` and `gainSubclassFeature`.
- Parse subclass feature strings.
- Extract feature name and level.
- Mark subclass unlock rows.
- Fall back to cleaned text when parsing fails.

Output:
- reusable feature progression rows for classes and subclasses.

### 6. Implement Proficiency Summary Helpers
- Parse armor proficiencies.
- Parse weapon proficiencies.
- Parse readable tool proficiencies.
- Parse common skill-choice structures.
- Avoid displaying raw nested JSON.

Output:
- readable proficiency fact/section data for class pages.

### 7. Implement Starting Equipment Text Helper
- Read `metadata.startingEquipment.entries`.
- Convert strings to inline text tokens using Step 13 inline parsing.
- Return an empty result if no readable equipment entry exists.

Output:
- starting equipment content ready for rendering.

### 8. Add FeatureProgressionList Component
- Render feature progression rows sorted by level.
- Show level labels consistently.
- Highlight subclass unlock rows subtly.
- Handle empty rows gracefully.

Output:
- reusable progression list component.

### 9. Improve useCompendiumClassDetails
- Replace `browseClasses().find(...)` with ID lookup through `getContentEntitiesByIds([classId])` if practical.
- Keep subclass loading through `browseSubclasses(classId)`.
- Preserve existing loading, fetching, and error behavior.

Output:
- class detail hook loads one class directly.

### 10. Upgrade CompendiumClassScreen Header
- Keep class route param handling.
- Keep source and edition labeling.
- Remove or de-emphasize the `Open class entry` button.
- Keep subclass count visible.

Output:
- class route starts acting as the real class detail page.

### 11. Add Class Facts Section
- Use `DetailSection` and `DetailFactGrid`.
- Show hit die, primary abilities, saving throws, spellcasting facts, source, and edition where available.

Output:
- class quick-reference facts visible near the top.

### 12. Add Proficiencies Section
- Show armor, weapons, tools, and skills where readable.
- Use compact rows or fact grid depending on final shape.
- Omit irregular metadata.

Output:
- class proficiencies are readable without raw data.

### 13. Add Class Feature Progression Section
- Render parsed `metadata.classFeatures` through `FeatureProgressionList`.
- Sort by level.
- Mark subclass unlock rows.

Output:
- class level progression is visible and scannable.

### 14. Add Starting Equipment Section
- Render `metadata.startingEquipment.entries` with styled inline text.
- Omit the section if no readable entry exists.

Output:
- class starting equipment is visible where present.

### 15. Preserve And Polish Subclass List Section
- Keep subclass search input.
- Keep subclass rows routing to normal detail entries.
- Align styling with the new class detail sections.
- Ensure empty state remains clear.

Output:
- class page still supports subclass discovery.

### 16. Add SubclassDetailView
- Add a dedicated subclass detail view component.
- Use shared detail header.
- Add subclass fact grid.
- Add feature progression section.
- Add additional spells section if resolved spell names exist.
- Add generic details section only if render blocks exist.

Output:
- normal subclass detail entries become useful despite empty prose.

### 17. Resolve Parent Class And Additional Spells
- Resolve parent class through content entity lookup where possible.
- Resolve additional spells through `metadata.additionalSpellIds` and `getContentEntitiesByIds`.
- Display resolved names only.
- Hide unresolved IDs.

Output:
- subclass pages do not leak app-owned IDs.

### 18. Wire Subclass Detail Delegation
- Update `CompendiumDetailScreen` to use `SubclassDetailView` for `entryType === 'subclass'`.
- Keep existing spell, item, and generic paths intact.

Output:
- subclass entries route to the new type-specific view.

### 19. Verify TypeScript
- Run `npm run typecheck`.
- Fix any type errors introduced by the refactor.

Output:
- typecheck passes.

### 20. Manual Smoke Checks
- Open the Classes category.
- Open Fighter class details.
- Open Wizard or Cleric class details.
- Open Artificer class details.
- Search subclasses inside a class page.
- Open a subclass detail from a class page.
- Open a legacy subclass detail if available.

Output:
- class and subclass detail pages are readable and navigation still works.

### 21. Record Follow-Up Importer Gaps
- Note that class/subclass prose is missing from generated compendium entries.
- Note any metadata fields that are too irregular for runtime display.
- Note future importer opportunities for richer class feature body text.

Output:
- follow-up list for future importer/generated content cleanup.

## Task List
1. Inspect class/subclass data shapes.
2. Add class/subclass detail utility types.
3. Implement ability and hit die formatting.
4. Implement spellcasting fact formatting.
5. Implement feature reference parsing.
6. Implement proficiency summary helpers.
7. Implement starting equipment text helper.
8. Add `FeatureProgressionList`.
9. Improve `useCompendiumClassDetails` with ID lookup.
10. Upgrade `CompendiumClassScreen` header.
11. Add class facts section.
12. Add proficiencies section.
13. Add class feature progression section.
14. Add starting equipment section.
15. Preserve and polish subclass list/search section.
16. Add `SubclassDetailView`.
17. Resolve parent class and additional spells for subclass details.
18. Wire subclass detail delegation in `CompendiumDetailScreen`.
19. Run `npm run typecheck`.
20. Perform manual smoke checks.
21. Record follow-up importer gaps.

## Verification Details

### Required Command
- `npm run typecheck`

### Required Class Checks
- Class route opens from the `Classes` category.
- Class page no longer feels like an intermediate landing page.
- Hit die renders when available.
- Primary ability renders when available.
- Saving throws render when available.
- Spellcasting facts render only when available.
- Feature progression rows show names and levels.
- Subclass unlock rows are distinguishable.
- Starting equipment renders styled item references where present.
- Subclass search still filters results.
- Subclass rows still navigate correctly.

### Required Subclass Checks
- Subclass detail route renders dedicated subclass view.
- Parent class renders when resolved.
- Feature progression rows show names and levels.
- Additional spells render resolved names only when available.
- Source and edition labels remain visible.
- Empty body prose does not produce an ugly empty page.

## Risks During Execution

### Risk 1: Feature Strings Have Multiple Formats
Mitigation:
- extract the first readable segment as name
- extract the last numeric segment as level
- fall back gracefully when parsing fails

### Risk 2: Proficiency Metadata Is Too Nested
Mitigation:
- implement common readable cases only
- omit unsupported shapes rather than displaying raw data

### Risk 3: Class Page Becomes Too Dense
Mitigation:
- use compact sections and progression rows
- keep subclass search below primary reference sections

### Risk 4: Direct Class Entry Route Still Exists
Mitigation:
- leave generic fallback in place for this step
- consider route bridging in a later navigation cleanup if needed

### Risk 5: Runtime Work Hides Importer Deficiencies
Mitigation:
- record missing class/subclass prose and richer feature content as importer follow-ups

## Exit Criteria
Step 14 is complete when:
- class pages are rich metadata-driven detail pages
- class page includes facts, proficiencies, feature progression, starting equipment, and subclass discovery where data exists
- subclass pages use a dedicated subclass detail view
- subclass page includes facts, feature progression, and resolved additional spells where data exists
- class/subclass UI avoids raw IDs and raw JSON
- subclass navigation from class pages still works
- no importer, generated content, schema, or migration changes were made
- `npm run typecheck` passes
