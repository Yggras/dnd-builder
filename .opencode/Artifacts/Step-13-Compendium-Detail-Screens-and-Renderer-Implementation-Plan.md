# Step 13 Compendium Detail Screens and Renderer Implementation Plan

## Objective
Improve compendium detail pages by replacing the current generic flattened text dump with a shared runtime renderer and type-aware detail layouts for spells and items.

The outcome of this step is a noticeably better read-only detail experience for high-volume compendium entries without changing the importer, generated content, SQLite schema, or content seeding flow.

This step intentionally focuses on runtime UI and parsing only. Importer render-payload cleanup, generated bundle changes, FTS/search optimization, and schema/index work remain separate follow-up work.

## Confirmed Decisions
- First-quality target: spells and items.
- Data strategy: runtime-only for this step.
- No importer changes.
- No generated content changes.
- No SQLite schema changes.
- Visual direction: preserve the current app theme and visual language.
- Inline 5etools tags should not leak raw syntax to users.
- Inline references should be subtly styled, but not clickable yet.
- Basic tables should render as tables when the structure is simple enough.
- Complex tables should fall back to clean text.
- Spell details should show core casting facts and resolved class/subclass names only.
- Item details should show core item facts, equipment stats, and attunement when detectable.
- Detail facts should use a compact top fact grid.
- Non-spell/item entries should use the shared cleaned block renderer only.

## Product Boundary

### Included In Step 13
- Create a shared runtime detail parsing layer for compendium entries.
- Create a small render block model for detail-page content.
- Create a reusable renderer for paragraphs, headings, lists, and basic tables.
- Strip 5etools inline tag syntax from displayed text.
- Style recognized inline references without adding navigation behavior.
- Improve `spell` detail pages with type-specific facts.
- Improve `item` detail pages with type-specific facts.
- Preserve source, edition, and type labeling.
- Keep generic detail pages usable through the shared renderer.
- Run TypeScript verification after implementation.

### Explicitly Excluded From Step 13
- Importer changes.
- Generated content regeneration.
- SQLite schema or migration changes.
- SQLite search or browse optimization.
- FTS tables.
- Clickable compendium cross-reference links.
- Full 5etools rich rendering parity.
- Homebrew, user import, or content editing workflows.
- New compendium routes beyond existing detail routes.

## Feature Goals
- A user opening a spell detail should immediately see casting facts before reading body text.
- A user opening an item detail should immediately see item type, rarity, value/weight, equipment stats, and attunement where available.
- Raw source markup such as `{@damage 2d6}` or `{@condition Prone|XPHB}` should not appear in rendered detail text.
- Non-spell/item details should improve through cleaned structured rendering without receiving full type-specific layouts yet.
- The implementation should expose renderer and metadata gaps clearly for later importer cleanup.

## Architectural Approach

### Runtime Detail View Model
Add a small detail view-model layer under the compendium feature.

Responsibilities:
- accept a `CompendiumEntry`
- derive display-safe title, type label, badges, facts, and render blocks
- branch only where type-specific layout is needed
- keep `CompendiumDetailScreen` thin

Reason:
- the current screen combines route handling, type labeling, tag fallback, and layout
- type-specific detail behavior will grow, so it should not be embedded directly in one screen component

### Shared Render Block Model
Create a runtime model that is intentionally smaller than the raw 5etools shape.

Recommended block kinds:
- `paragraph`
- `heading`
- `list`
- `table`
- `fallbackText`

Optional block kind if low-cost:
- `note`

Recommended block data:
- paragraphs and headings store inline text tokens
- lists store list items as inline text tokens
- tables store headers and rows as plain or tokenized cells
- fallback text stores a cleaned string

Reason:
- this gives the UI stable rendering primitives without pretending to fully support the upstream source format
- it provides a bridge toward future importer-owned render blocks

### Inline Text Tokenization
Add runtime parsing for the most common 5etools inline tags found in current generated payloads.

Supported first-pass tag behavior:
- `{@spell Fireball|XPHB}` renders as `Fireball` styled as a reference
- `{@item Longsword|XPHB}` renders as `Longsword` styled as a reference
- `{@condition Prone|XPHB}` renders as `Prone` styled as a reference
- `{@variantrule Hit Points|XPHB}` renders as `Hit Points` styled as a reference
- `{@damage 2d6}` renders as `2d6` styled as a rules/dice value
- `{@dice 1d20}` renders as `1d20` styled as a rules/dice value
- `{@dc 15}` renders as `15` styled as a rules/dice value
- emphasis tags like `{@i ...}` and `{@b ...}` render as styled text when practical
- unknown tags strip syntax and preserve readable display text when possible

No inline token should navigate in this step.

Reason:
- styled references improve scanability without adding the scope and correctness burden of link resolution

### Render Payload Parsing
Parse the existing `entry.renderPayload` at runtime.

Expected input pattern:
- current generated records usually expose `renderPayload.entries`
- entries may contain strings, nested arrays, lists, named sections, tables, and other object structures

Parsing rules:
- strings become paragraph blocks or inline list/table cells depending on context
- objects with `name` and nested `entries` become heading plus nested blocks
- objects with `type: 'list'` and `items` become list blocks
- simple objects with `type: 'table'`, `colLabels`, and `rows` become table blocks
- complex tables fall back to cleaned text blocks
- unknown object structures fall back to recursive text extraction

Reason:
- current generated content is source-like, so the runtime parser must be defensive and graceful

### Spell Detail Layout
Create a spell-specific detail view when `entry.entryType === 'spell'`.

Core fact fields:
- level or cantrip label
- school label
- casting time
- range
- components
- duration
- ritual
- concentration
- source and edition remain visible in header/badges

Class/subclass availability:
- derive from `entry.metadata.classIds` and `entry.metadata.subclassIds`
- resolve IDs against locally seeded content entities through the content repository/service
- show resolved names only
- hide unresolved IDs
- do not show an availability section if no names resolve

Reason:
- spell details are frequent and benefit most from structured quick-reference facts
- resolved names avoid leaking app-owned IDs into the UI

### Item Detail Layout
Create an item-specific detail view when `entry.entryType === 'item'`.

Core fact fields:
- equipment vs magic item
- item type
- rarity
- value
- weight
- source and edition remain visible in header/badges

Equipment/stat fact fields:
- weapon category
- damage
- damage type
- armor class
- item properties if displayable

Attunement:
- show attunement when metadata exposes it reliably
- otherwise detect conservative text patterns from summary/body/render payload
- avoid false precision if the source text is ambiguous

Reason:
- item details need fast inventory-use facts, not only prose

### Generic Detail Layout
For classes, subclasses, backgrounds, feats, species, and optional features:
- keep the existing high-level page structure
- use the shared renderer instead of a raw body text block
- keep source, edition, summary, and type labeling visible
- do not add type-specific facts in this step unless the data is already trivial and shared

Reason:
- this keeps the first pass focused while still improving all detail pages through cleaner rendering

## Code Areas To Change

### 1. Compendium Detail Screen
Primary target:
- `src/features/compendium/screens/CompendiumDetailScreen.tsx`

Responsibilities after refactor:
- route param handling
- loading/error/not-found states
- pass loaded entry to the detail layout layer
- avoid owning parser logic directly

### 2. Detail View Models / Parsing Utilities
Recommended new files:
- `src/features/compendium/utils/detailBlocks.ts`
- `src/features/compendium/utils/inlineText.ts`
- `src/features/compendium/utils/detailFacts.ts`

Responsibilities:
- parse render payloads into render blocks
- tokenize inline text
- derive spell and item facts
- provide generic type and badge labels consistently

### 3. Shared Detail Components
Recommended new files:
- `src/features/compendium/components/CompendiumDetailHeader.tsx`
- `src/features/compendium/components/DetailFactGrid.tsx`
- `src/features/compendium/components/DetailSection.tsx`
- `src/features/compendium/components/RenderBlockList.tsx`
- `src/features/compendium/components/RichTextLine.tsx`
- `src/features/compendium/components/BasicTableBlock.tsx`

Responsibilities:
- render consistent detail-page structure
- preserve current theme styling
- keep renderer components reusable for future type-specific screens

### 4. Type-Specific Detail Views
Recommended new files:
- `src/features/compendium/components/SpellDetailView.tsx`
- `src/features/compendium/components/ItemDetailView.tsx`
- `src/features/compendium/components/GenericCompendiumDetailView.tsx`

Responsibilities:
- organize facts and sections by entry type
- delegate body content to `RenderBlockList`
- keep type-specific logic localized

### 5. Content Resolution For Spell Availability
Possible repository/service additions:
- `getContentEntitiesByIds(ids: string[])`
- or narrower helper methods for resolving class/subclass IDs

Preferred approach:
- add the smallest repository method needed to resolve IDs by primary key
- avoid loading full categories only to resolve spell availability names

Reason:
- this is a small performance improvement aligned with future optimization work
- it avoids exposing IDs in detail UI

## Data Handling Notes

### Runtime Only
All parsing should consume existing fields:
- `entry.entryType`
- `entry.metadata`
- `entry.renderPayload`
- `entry.text`
- `entry.summary`
- source and edition fields

No code should assume generated files will be regenerated for this step.

### Defensive Parsing
The renderer must tolerate:
- missing `renderPayload`
- malformed nested structures
- unexpected object shapes
- tables with inconsistent rows
- raw tags not covered by the first-pass tokenizer

Fallback behavior should always produce readable text rather than crash.

### Styling Without Clickability
Inline references should be styled, but not pressable.

Reason:
- clickable references need reliable entity lookup, route decisions, and unresolved-reference handling
- that should be a separate step after renderer quality is stable

## UX Requirements
- Detail pages should remain readable on mobile width.
- Fact grid should wrap cleanly on narrow screens.
- Body text should have comfortable line height.
- Tables should be horizontally safe or simplified enough for mobile.
- Source, edition, and type labels should remain prominent enough to avoid edition confusion.
- Spell and item pages should present quick-reference facts before long prose.

## Verification Plan

### TypeScript Verification
- Run `npm run typecheck`.

### Manual Detail Checks
Inspect at least:
- one cantrip
- one leveled concentration spell
- one spell with ritual metadata
- one spell with class/subclass availability metadata
- one mundane weapon
- one armor item
- one magic item
- one item requiring attunement if available
- one feat
- one background
- one class or subclass detail route

### Data Cleanliness Checks
- Confirm raw tags like `{@damage`, `{@spell`, and `{@condition` do not appear in rendered detail text.
- Confirm unknown tags degrade into readable text.
- Confirm simple tables render as tables.
- Confirm complex tables render as cleaned fallback text.
- Confirm unresolved spell class/subclass IDs are hidden.

## Risks And Mitigations

### Risk 1: Runtime Parser Becomes A Second Importer
Mitigation:
- keep the parser intentionally small
- support only detail rendering needs
- document importer cleanup separately when raw structure causes pain

### Risk 2: Inline Reference Styling Implies Clickability
Mitigation:
- use subtle styling, not link affordances such as underlines or button states
- do not attach press handlers in this step

### Risk 3: Basic Table Rendering Breaks On Complex Source Tables
Mitigation:
- detect simple table shape conservatively
- fall back to text for anything complex or inconsistent

### Risk 4: Spell Availability Resolution Over-fetches
Mitigation:
- prefer lookup by IDs rather than browsing all classes/subclasses
- hide unresolved IDs

### Risk 5: Item Attunement Detection Is Incomplete
Mitigation:
- only show attunement when metadata or text is clear
- avoid displaying misleading false negatives as definitive facts

## Exit Criteria
Step 13 is complete when:
- spell detail pages show structured casting facts and cleaned rendered body content
- item detail pages show structured item facts, equipment stats, attunement when detectable, and cleaned rendered body content
- generic detail pages use the shared renderer instead of a raw text dump
- raw 5etools inline tag syntax no longer appears in normal rendered detail content
- simple tables render acceptably and complex tables fall back to readable text
- spell class/subclass availability names show only when resolved cleanly
- the implementation remains runtime-only with no generated, importer, or schema changes
- `npm run typecheck` passes
