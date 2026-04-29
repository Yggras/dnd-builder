# Step 14 Class and Subclass Detail Pages Implementation Plan

## Objective
Upgrade class and subclass compendium detail experiences by turning the existing class-specific route into a full class detail page and adding a metadata-driven subclass detail view.

The outcome of this step is a useful class/subclass reference experience even though current generated class and subclass compendium body text is mostly empty. This step should reuse the Step 13 detail renderer components, remain runtime-only, and avoid importer, generated content, SQLite schema, and seeding changes.

## Confirmed Decisions
- Continue from the Step 13 runtime detail renderer foundation.
- Classes and subclasses are the next detail-quality target.
- Keep the existing class-specific route: `/(app)/compendium/class/[classId]`.
- Turn `CompendiumClassScreen` into the real rich class detail page.
- Remove or de-emphasize the extra `Open class entry` tap from the class route.
- Subclasses stay normal compendium detail entries under `/(app)/compendium/[entryId]`.
- Add a `SubclassDetailView` for `entryType === 'subclass'`.
- Keep the implementation runtime-only.
- Do not change importer output in this step.
- Do not regenerate generated content in this step.
- Do not change SQLite schema or migrations in this step.

## Product Boundary

### Included In Step 14
- Add runtime helpers for parsing class and subclass metadata into readable UI facts and progression rows.
- Add a shared feature progression component for class and subclass features by level.
- Upgrade `CompendiumClassScreen` into a rich class detail page.
- Add a subclass detail view to the existing compendium detail route.
- Reuse Step 13 components such as `CompendiumDetailHeader`, `DetailFactGrid`, `DetailSection`, `RenderBlockList`, and styled inline text.
- Resolve parent class names for subclass details where possible.
- Resolve additional subclass spell names where possible.
- Preserve source and edition labeling.
- Run TypeScript verification after implementation.

### Explicitly Excluded From Step 14
- Importer changes.
- Generated content regeneration.
- SQLite schema or migration changes.
- Compendium search or category browse optimization.
- Full class feature body text import.
- Full subclass feature body text import.
- Clickable inline cross-reference links.
- New subclass top-level category.
- Homebrew, user import, or content editing workflows.

## Feature Goals
- Opening a class from the `Classes` category should show a useful class reference page immediately.
- Users should not need to tap an additional `Open class entry` button to see class details.
- Class pages should expose key builder/reference facts from existing metadata.
- Class pages should show feature progression by level.
- Class pages should show subclass options inside the class experience.
- Subclass pages should expose parent class, feature progression, and additional spells where available.
- Empty generated `renderPayload.entries` should not make class/subclass pages feel empty.

## Current Data Reality
Current generated class and subclass compendium records frequently have:
- `summary: null`
- `text: ""`
- `renderPayload.entries: []`

The useful data currently lives mostly in metadata:
- class `metadata.primaryAbility`
- class `metadata.hitDie`
- class `metadata.proficiency`
- class `metadata.spellcastingAbility`
- class `metadata.casterProgression`
- class `metadata.startingProficiencies`
- class `metadata.startingEquipment`
- class `metadata.featProgression`
- class `metadata.optionalfeatureProgression`
- class `metadata.classFeatures`
- subclass `metadata.shortName`
- subclass `metadata.spellcastingAbility`
- subclass `metadata.casterProgression`
- subclass `metadata.subclassFeatures`
- subclass `metadata.additionalSpellIds`

This step should treat class/subclass pages as metadata-driven reference pages.

## Architectural Approach

### Class Route Strategy
Keep `/(app)/compendium/class/[classId]` as the primary class detail route.

Reason:
- classes are structurally different from normal entries because subclasses belong inside the class experience
- the current route already supports the desired class-to-subclass browsing model
- improving this route avoids creating an extra intermediate page or a duplicated class detail experience

Expected behavior:
- class category rows continue routing to `/(app)/compendium/class/[classId]`
- that route renders the rich class detail page
- subclass rows from that page continue routing to normal detail entries
- direct class compendium entry routes can remain generic fallback in this step unless a small bridge is needed

### Subclass Detail Strategy
Add `SubclassDetailView` under the normal detail route for `entryType === 'subclass'`.

Reason:
- subclasses are not top-level category destinations
- they should remain reachable from class pages and normal detail links
- subclass details need type-specific metadata interpretation, but not a separate route

### Runtime Metadata Helpers
Add class/subclass detail helper utilities under the compendium feature.

Responsibilities:
- format hit die
- format primary abilities
- format saving throw proficiencies
- format spellcasting/caster progression labels
- parse feature references into level/name/source rows
- detect subclass unlock rows
- format starting proficiencies
- format starting equipment text with Step 13 inline styling
- parse additional spell IDs

Reason:
- metadata parsing is currently scattered through builder utilities and should not be duplicated directly in screens
- detail screens should remain mostly composition and layout

### Feature Progression Component
Add a shared `FeatureProgressionList` component.

Responsibilities:
- display feature rows grouped or sorted by level
- support class feature rows and subclass feature rows
- visually mark subclass unlock rows when known
- preserve compact readability on mobile

Recommended row shape:
- `level: number | null`
- `name: string`
- `sourceCode?: string | null`
- `isSubclassUnlock?: boolean`

Reason:
- both classes and subclasses need level-based progression display
- this creates a reusable component for future richer feature body text

### Class Detail Page Layout
Upgrade `CompendiumClassScreen` to show:

1. Header
- class name
- source and edition badges
- subclass count
- optional short summary/fallback copy

2. Class Facts
- hit die
- primary abilities
- saving throws
- spellcasting ability, if any
- caster progression, if any
- source
- edition

3. Proficiencies
- armor
- weapons
- tools when readable
- skill choice summary when readable

4. Feature Progression
- rows from `metadata.classFeatures`
- sorted by level
- subclass unlock rows visually distinguished

5. Starting Equipment
- render `metadata.startingEquipment.entries` using styled inline text
- omit section when no readable equipment text exists

6. Subclasses
- keep subclass search
- show subclass cards/rows
- link subclass rows to normal detail routes

Reason:
- this turns the current shallow class landing page into a useful reference surface

### Subclass Detail Layout
Add `SubclassDetailView` to show:

1. Header
- subclass name
- source and edition badges
- type badge

2. Subclass Facts
- parent class when resolved
- short name if different from display name
- spellcasting ability, if any
- caster progression, if any
- source
- edition

3. Feature Progression
- rows from `metadata.subclassFeatures`
- sorted by level

4. Additional Spells
- resolve `metadata.additionalSpellIds` through existing ID lookup
- show resolved spell names only
- hide unresolved IDs
- omit section if no names resolve

5. Details
- use `RenderBlockList` if any render blocks exist
- otherwise show a concise unavailable-content note rather than an empty panel

Reason:
- current subclass entries have no prose, so feature progression and metadata are the primary value

## Code Areas To Change

### 1. Class Detail Utilities
Recommended new file:
- `src/features/compendium/utils/classDetails.ts`

Responsibilities:
- derive class facts
- derive subclass facts
- parse class feature references
- parse subclass feature references
- derive starting proficiency summaries
- derive starting equipment display strings
- parse parent class hints from subclass IDs/metadata where possible

### 2. Shared Progression Component
Recommended new file:
- `src/features/compendium/components/FeatureProgressionList.tsx`

Responsibilities:
- render feature rows by level
- support subclass unlock styling
- handle empty progression state gracefully

### 3. Class Detail Screen
Primary file:
- `src/features/compendium/screens/CompendiumClassScreen.tsx`

Responsibilities:
- keep route and subclass search behavior
- replace shallow class landing content with rich class facts and progression
- remove or de-emphasize the `Open class entry` button
- use existing `useCompendiumClassDetails`

### 4. Class Detail Hook
Primary file:
- `src/features/compendium/hooks/useCompendiumClassDetails.ts`

Potential improvement:
- use `getContentEntitiesByIds([classId])` instead of `browseClasses().find(...)`
- keep subclass query unchanged for now

Reason:
- this avoids loading all classes to show one class detail
- it aligns with the ID lookup method added in Step 13

### 5. Subclass Detail View
Recommended new file:
- `src/features/compendium/components/SubclassDetailView.tsx`

Responsibilities:
- render subclass-specific facts
- resolve parent class/additional spells where possible
- render subclass feature progression
- use shared detail sections and renderer components

### 6. Detail Screen Delegation
Primary file:
- `src/features/compendium/screens/CompendiumDetailScreen.tsx`

Responsibilities:
- route `entryType === 'subclass'` to `SubclassDetailView`
- keep spell, item, and generic handling intact

## Data Parsing Notes

### Class Feature References
Known shapes:
- strings like `Fighting Style|Fighter|XPHB|1`
- objects like `{ classFeature: "Fighter Subclass|Fighter|XPHB|3", gainSubclassFeature: true }`

Parsing should:
- extract feature name from the first pipe segment
- extract level from the last numeric pipe segment
- mark subclass unlock rows when `gainSubclassFeature` is true
- fall back to cleaned display text when parsing fails

### Subclass Feature References
Known shapes:
- strings like `Abjurer|Wizard|XPHB|Abjurer|XPHB|3`

Parsing should:
- extract feature name from the first pipe segment
- extract level from the last numeric pipe segment
- fall back to cleaned display text when parsing fails

### Primary Ability Metadata
Known shape:
- array of objects like `{ str: true }`, `{ dex: true }`

Display should:
- map ability abbreviations to full labels
- support multiple alternatives such as `Strength or Dexterity`
- omit if metadata is unreadable

### Hit Die Metadata
Known shape:
- object like `{ number: 1, faces: 10 }`

Display should:
- show `d10` when number is `1`
- show `2d6` style if number differs

### Starting Proficiencies
Known shape can include:
- `armor`
- `weapons`
- `tools`
- `toolProficiencies`
- `skills`

Display should:
- prioritize readable arrays such as armor/weapons/tools
- summarize skill choices when the common `{ choose: { from, count } }` shape exists
- omit deeply irregular structures rather than dumping raw JSON

### Starting Equipment
Known shape:
- `metadata.startingEquipment.entries` can contain 5etools-tagged strings

Display should:
- use Step 13 inline parsing/styling
- not attempt full equipment option automation in this view

## UX Requirements
- Class details should be useful without generated prose.
- Feature progression should be scannable by level.
- Subclass search remains usable in the class page.
- Subclass pages should not show raw IDs.
- Empty sections should be omitted or replaced with concise unavailable-content text.
- Fact grids should wrap cleanly on mobile.
- Existing source/edition visual language should remain consistent with Step 13 detail pages.

## Verification Plan

### TypeScript Verification
- Run `npm run typecheck`.

### Manual Class Checks
Inspect at least:
- Fighter
- Wizard or Cleric
- Artificer
- one legacy/non-primary class if available

Confirm:
- class facts render correctly
- feature progression is sorted and readable
- subclass unlock rows are visible
- proficiencies are readable
- starting equipment renders styled item references
- subclass search still filters subclass rows
- subclass rows route correctly

### Manual Subclass Checks
Inspect at least:
- one 2024 primary subclass
- one legacy subclass
- one subclass with additional spells if available

Confirm:
- parent class resolves when possible
- feature progression renders correctly
- additional spells show resolved names only
- source and edition labels remain visible
- no raw IDs leak into normal UI

## Risks And Mitigations

### Risk 1: Class/Subclass Text Is Empty
Mitigation:
- build value from metadata-driven facts and progression rather than relying on body text

### Risk 2: Feature Reference Parsing Is Imperfect
Mitigation:
- parse conservatively
- fall back to cleaned display text
- never crash on malformed references

### Risk 3: Starting Proficiency Structures Are Irregular
Mitigation:
- support common readable shapes only
- omit irregular pieces rather than showing raw JSON

### Risk 4: Class Route And Normal Detail Route Drift
Mitigation:
- keep classes primarily on the class route for now
- only add normal class-detail bridging later if needed

### Risk 5: Scope Creep Into Importer Cleanup
Mitigation:
- record missing prose/metadata as follow-up work
- do not change generated content in this step

## Exit Criteria
Step 14 is complete when:
- class category rows still open the class route
- the class route renders rich class details, not just a shallow landing page
- class facts, proficiencies, starting equipment, feature progression, and subclass list are visible when data exists
- subclass detail entries use a dedicated subclass detail view
- subclass facts, feature progression, and additional spells render when data exists
- raw class/subclass metadata IDs do not leak into normal UI
- no importer, generated content, schema, or migration changes were made
- `npm run typecheck` passes
