# Step 13 Compendium Detail Screens and Renderer Execution Steps

## Goal
Execute the compendium detail quality pass in a controlled sequence so spell and item detail pages become structured, readable, and free of raw 5etools tag syntax, while generic detail pages benefit from the shared renderer.

## Execution Rules
- Do not change the importer in this step.
- Do not regenerate generated 5etools content in this step.
- Do not change SQLite schema or migrations in this step unless a blocker is discovered and explicitly approved.
- Do not implement clickable compendium cross-reference links in this step.
- Do not broaden the scope into compendium search or browse optimization.
- Keep the implementation runtime-only and defensive.
- Prefer small, reusable components over expanding `CompendiumDetailScreen` into a large type-switch file.
- Preserve the current theme, spacing language, and badge conventions.

## Step-By-Step Execution Sequence

### 1. Reconfirm Current Detail Data Shapes
- Inspect representative `CompendiumEntry` records through existing generated/runtime shapes.
- Confirm current `renderPayload.entries` patterns for spells, items, feats, backgrounds, and classes.
- Confirm metadata fields available for spell facts and item facts.

Output:
- short implementation notes on which fields are reliable enough to display.

### 2. Add Inline Text Token Types
- Define a small runtime inline-token model.
- Include token kinds for:
  - normal text
  - reference text
  - rules/dice text
  - emphasis text if practical
  - strong text if practical
- Keep token data display-focused only.

Output:
- a stable internal contract for styled inline text rendering.

### 3. Implement Inline Tag Parsing Utility
- Parse common 5etools inline tags into inline tokens.
- Preserve readable labels from known tags.
- Strip unsupported tag syntax while keeping useful display text.
- Avoid navigation behavior.

Important first-pass tags:
- spell references
- item references
- feat references
- condition references
- variant rule references
- action references
- damage and dice values
- DC values
- italic and bold tags

Output:
- reusable `parseInlineText` style utility.

### 4. Add Render Block Types
- Define render block kinds:
  - paragraph
  - heading
  - list
  - table
  - fallbackText
- Decide whether `note` is worth adding in this pass based on source shapes.
- Ensure every block can be rendered without knowing the original raw source shape.

Output:
- stable runtime render block model.

### 5. Implement Render Payload Parser
- Parse `entry.renderPayload?.entries` recursively.
- Convert plain strings to paragraph blocks.
- Convert named sections to heading plus nested blocks.
- Convert list-like entries to list blocks.
- Convert simple table-like entries to table blocks.
- Convert unknown objects to fallback text.
- Use `entry.text` when no useful render payload exists.

Output:
- reusable `buildRenderBlocks(entry)` style utility.

### 6. Implement Basic Table Detection
- Detect simple tables conservatively.
- Require a predictable header/row shape before rendering a table block.
- Normalize cells into displayable inline tokens or plain strings.
- Fall back to text for inconsistent rows, nested tables, or complex structures.

Output:
- table blocks render only when safe.

### 7. Create Shared Renderer Components
- Add `RichTextLine` for inline tokens.
- Add `RenderBlockList` for block rendering.
- Add `BasicTableBlock` for basic tables.
- Add `DetailSection` for consistent section styling.
- Keep styles local and aligned with existing theme.

Output:
- generic content renderer usable by all detail entry types.

### 8. Extract Shared Detail Header
- Move title, source, edition, and type badges into a reusable header component.
- Reuse existing type labeling behavior where possible.
- Move duplicate equipment/magic item classification into shared utility code.

Output:
- detail header no longer duplicated in type-specific views.

### 9. Add Compact Fact Grid Component
- Create a reusable fact grid for short label/value pairs.
- Support wrapping on narrow screens.
- Hide facts with null, empty, or unresolved values.
- Keep values concise.

Output:
- shared quick-reference fact layout.

### 10. Derive Spell Facts
- Read spell facts from `entry.metadata`.
- Derive labels for:
  - cantrip or spell level
  - school
  - casting time
  - range
  - components
  - duration
  - ritual
  - concentration
- Keep formatting concise and mobile-friendly.

Output:
- spell facts ready for `SpellDetailView`.

### 11. Resolve Spell Class And Subclass Names
- Add the smallest repository/service method needed to resolve content entities by IDs.
- Resolve IDs from `entry.metadata.classIds` and `entry.metadata.subclassIds`.
- Show resolved class/subclass names only.
- Hide the availability section if no names resolve.

Output:
- spell availability can be displayed without leaking app-owned IDs.

### 12. Build Spell Detail View
- Compose the shared header, compact fact grid, optional availability section, summary, and rendered body blocks.
- Ensure casting facts appear before long prose.
- Ensure body content is cleaned and styled.

Output:
- enhanced spell detail page.

### 13. Derive Item Facts
- Read item facts from `entry.metadata`.
- Derive labels for:
  - equipment vs magic item
  - item type
  - rarity
  - value
  - weight
  - weapon category
  - damage
  - damage type
  - armor class
  - properties if displayable
  - attunement when detectable
- Use conservative attunement detection if metadata is missing.

Output:
- item facts ready for `ItemDetailView`.

### 14. Build Item Detail View
- Compose the shared header, compact fact grid, summary, and rendered body blocks.
- Group equipment stats in a readable way.
- Avoid showing empty or misleading facts.

Output:
- enhanced item detail page.

### 15. Build Generic Detail View
- Use shared header, summary panel, and `RenderBlockList`.
- Preserve current behavior for source and edition labels.
- Do not add type-specific fact grids for generic types in this step.

Output:
- improved generic details for feats, backgrounds, classes, subclasses, species, and optional features.

### 16. Refactor CompendiumDetailScreen
- Keep route param extraction and query states in the screen.
- Delegate loaded-entry rendering to the appropriate detail view:
  - `spell` -> spell detail view
  - `item` -> item detail view
  - everything else -> generic detail view
- Remove old flattened-body rendering from the screen.

Output:
- `CompendiumDetailScreen` remains small and orchestration-focused.

### 17. Verify TypeScript
- Run `npm run typecheck`.
- Fix any type errors introduced by the detail refactor.

Output:
- typecheck passes.

### 18. Manual Smoke Checks
- Open a cantrip detail.
- Open a concentration spell detail.
- Open a ritual spell detail if available.
- Open a spell with class/subclass availability metadata.
- Open a mundane weapon detail.
- Open an armor detail.
- Open a magic item detail.
- Open an attunement item detail if available.
- Open a feat detail.
- Open a background detail.
- Open a class or subclass detail route.

Output:
- detail pages are readable and do not expose raw tag syntax.

### 19. Record Follow-Up Importer Gaps
- Note source structures that required runtime fallback.
- Note missing metadata that would improve detail rendering.
- Note tag types that should become first-class later.
- Do not fix these in this step unless they are runtime blockers.

Output:
- clear follow-up list for importer/render-payload cleanup.

## Task List
1. Inspect representative detail payload and metadata shapes.
2. Define inline text token types.
3. Implement inline tag parsing.
4. Define render block types.
5. Implement render payload parsing.
6. Implement basic table detection and fallback behavior.
7. Build shared rich text and block renderer components.
8. Extract reusable detail header.
9. Build compact fact grid component.
10. Derive spell facts.
11. Resolve spell class/subclass names by IDs.
12. Build spell detail view.
13. Derive item facts.
14. Build item detail view.
15. Build generic detail view.
16. Refactor `CompendiumDetailScreen` to delegate rendering.
17. Run `npm run typecheck`.
18. Perform manual smoke checks across representative entry types.
19. Capture follow-up importer/render-payload cleanup notes.

## Verification Details

### Required Command
- `npm run typecheck`

### Required Visual Checks
- Raw tag syntax does not appear in normal rendered detail text.
- Styled references are visibly distinct but not clickable.
- Spell facts appear above body content.
- Item facts appear above body content.
- Basic tables do not overflow badly on mobile-width screens.
- Complex table fallback remains readable.
- Generic entries still render meaningful detail content.

### Required Data Checks
- Cantrip level label is readable.
- Leveled spell label is readable.
- Ritual and concentration labels match metadata.
- Spell class/subclass names are shown only when resolved.
- Item type and rarity labels are readable.
- Mundane vs magic item classification matches existing catalog behavior.
- Weapon/armor stats show only when available.
- Attunement is shown only when reliably detected.

## Risks During Execution

### Risk 1: Existing Render Payload Is Too Irregular
Mitigation:
- implement recursive fallback text extraction early
- prefer readable fallback over perfect structure

### Risk 2: Detail Screen Refactor Gets Too Broad
Mitigation:
- keep non-spell/item types on the shared renderer only
- avoid adding class/feat/background-specific fact layouts in this step

### Risk 3: Inline Token Parser Misses Tags
Mitigation:
- preserve display labels for unknown tags when possible
- add targeted handling only for tags seen in current payloads

### Risk 4: Class/Subclass Availability Requires Heavy Queries
Mitigation:
- use ID-based lookup rather than loading full categories
- show resolved names only

### Risk 5: Attunement Detection Produces Bad Facts
Mitigation:
- display attunement only when metadata or text patterns are clear
- otherwise omit the fact

## Exit Criteria
Step 13 is complete when:
- spell details use the new structured spell view
- item details use the new structured item view
- generic details use the shared block renderer
- inline 5etools tags are cleaned and styled where appropriate
- basic tables render and complex tables fall back to readable text
- spell availability names resolve without exposing IDs
- no importer, generated content, or schema changes were made
- `npm run typecheck` passes
