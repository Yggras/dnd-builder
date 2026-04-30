# Step 17 Inline Compendium Reference Navigation Implementation Plan

## Objective
Make supported inline references in rendered compendium detail text tappable so users can drill into related rules content and return through normal stack navigation.

The first pass should support references that already exist in the generated compendium. It should not add new imported content types or broaden the compendium dataset.

## Confirmed Decisions
- Navigation uses stack push, not replace.
- Chained reference navigation must work naturally.
- Back from a linked detail page should return to the previous detail page.
- First pass is limited to already generated compendium content.
- Do not change the importer.
- Do not regenerate generated 5etools content.
- Do not change SQLite schema or migrations.
- Do not add new content tables.
- Do not add new compendium categories.
- Unsupported or unresolved references stay styled but non-clickable.
- Do not show errors/toasts for normal unresolved references.

## Product Boundary

### Included In Step 17
- Extend inline token data to carry optional reference target metadata.
- Parse supported 5etools inline tags into reference-aware tokens.
- Resolve supported references to existing compendium entries.
- Render resolved reference tokens as pressable inline text.
- Navigate with `router.push` to resolved compendium detail routes.
- Preserve normal text wrapping and current rich-text styling.
- Keep unresolved refs visually distinct but not clickable.
- Run TypeScript verification.

### Explicitly Excluded From Step 17
- Importing conditions, actions, variant rules, tables, or other new reference-only content.
- Schema or migration changes.
- Generated content changes.
- Clickable references for unsupported content types.
- Search result pages for filter tags.
- Ambiguous reference picker UI.
- External links for books or quickrefs.
- Builder automation changes.

## Supported First-Pass Targets

Clickable when resolvable:
- `{@spell ...}` -> spell detail
- `{@item ...}` -> item detail
- `{@feat ...}` -> feat detail
- `{@optfeature ...}` -> optional feature detail

Optionally clickable if cleanly resolvable with existing data:
- `{@classFeature ...}` only if it maps to an existing class/subclass detail route without ambiguity
- `{@subclassFeature ...}` only if it maps to an existing subclass detail route without ambiguity

Styled but non-clickable in Step 17:
- `{@condition ...}`
- `{@action ...}`
- `{@variantrule ...}`
- `{@creature ...}`
- `{@book ...}`
- `{@quickref ...}`
- `{@filter ...}` unless it resolves to one obvious single entity without a browse/search page
- `{@table ...}`
- rewards, boons, monsters, and any excluded v1 content

## Current State Summary

### Already Present
- `parseInlineText` converts 5etools tags into styled inline tokens.
- `RichTextLine` renders inline tokens inside React Native text.
- Detail body rendering flows through `RenderBlockList` and `RichTextLine`.
- Compendium detail routes already accept compendium entry IDs.
- Existing generated content includes spells, items, feats, optional features, classes, subclasses, species, backgrounds.

### Missing
- Inline tokens do not preserve enough source metadata to resolve navigation targets.
- Rich text references are styled but not pressable.
- No shared resolver exists to turn tag references into compendium entry routes.

## Implementation Strategy

### 1. Extend Inline Token Model
Extend `InlineTextToken` so reference tokens can include optional target metadata.

Recommended shape:

```ts
type InlineTextToken = {
  kind: 'text' | 'reference' | 'dice' | 'emphasis' | 'strong';
  text: string;
  reference?: {
    tag: string;
    name: string;
    sourceCode: string | null;
    entityType: 'spell' | 'item' | 'feat' | 'optionalfeature' | null;
  };
};
```

Keep this display-focused. Do not put navigation logic in the parser.

### 2. Parse Supported Reference Tags
Update inline parsing so supported tags preserve:
- tag name
- display text
- canonical referenced name
- optional source code
- target entity type when known

Example mappings:
- `spell` -> `spell`
- `item` -> `item`
- `feat` -> `feat`
- `optfeature` -> `optionalfeature`

The parser should continue to strip unsupported raw syntax while keeping readable labels.

### 3. Build Reference Resolver
Add a small runtime resolver that converts parsed inline references into compendium entry IDs.

Recommended behavior:
- only attempt supported entity types
- prefer exact explicit source from the tag
- if no source exists, try current entry source
- then try preferred primary/2024 records
- if zero or multiple plausible matches remain, treat as unresolved

Use existing content repository/service methods where possible. If no efficient lookup exists, add the smallest repository method needed.

### 4. Avoid Per-Token Database Queries
Do not query per token. Build reference targets per rendered detail payload.

Acceptable first-pass approaches:
- collect reference candidates from parsed render blocks at the detail-view level and resolve them in one batched query
- or resolve by deterministic ID when source is present, then optionally verify existence only when needed

Prefer a small and reliable implementation over an over-general resolver.

### 5. Render Pressable References
Update rich text rendering so resolved references are tappable.

Requirements:
- use `router.push`, not replace
- preserve inline wrapping
- use accessibility role `link`
- keep pressed feedback subtle
- unresolved references render exactly like styled non-clickable references

### 6. Preserve Chain Navigation
Every reference tap should push a new route onto the stack.

Expected flow:
- Wizard detail page
- tap Fireball
- Fireball detail page
- tap another supported reference
- next detail page
- back returns to Fireball
- back returns to Wizard

### 7. Verification
Run `npm run typecheck`.

Manual smoke checks:
- open a spell detail with a feat/item/spell reference if available
- open a class feature expansion with spell/item/feat refs
- tap a spell reference
- tap a second supported reference from the new page
- back through the chain
- confirm unsupported refs stay non-clickable and do not error

## Code Areas To Change When Approved

### Inline Parsing
- `src/features/compendium/utils/inlineText.ts`

Expected impact:
- add reference metadata to tokens
- preserve existing text cleanup behavior

### Rich Text Rendering
- `src/features/compendium/components/RichTextLine.tsx`

Expected impact:
- render resolved reference tokens as pressable inline text
- accept optional reference resolution data or a callback

### Render Blocks
- `src/features/compendium/utils/detailBlocks.ts`
- `src/features/compendium/components/RenderBlockList.tsx`

Expected impact:
- pass reference target context through to rich text lines
- possibly expose helper to collect references from blocks

### Reference Resolution
- likely `src/features/compendium/utils/inlineReferences.ts`
- possibly `src/features/compendium/hooks/useResolvedInlineReferences.ts`
- possibly content repository/service additions if batched lookup by type/name/source is needed

Expected impact:
- resolve supported tokens to compendium detail route IDs
- avoid per-token database queries

### Detail Views
- spell, item, feat, species, background, subclass, generic detail views as needed

Expected impact:
- provide current entry context/source and resolved reference map to `RenderBlockList`

## Risks And Mitigations

### Risk 1: Inline Text Pressables Break Wrapping
Mitigation:
- keep nested `Text` structure where possible
- test React Native support for `onPress` on nested `Text`

### Risk 2: Reference Resolution Is Ambiguous
Mitigation:
- require exact source match when source is supplied
- do not navigate when multiple plausible targets remain

### Risk 3: Excessive Queries
Mitigation:
- batch resolve candidates per detail render
- avoid resolving unsupported tags

### Risk 4: Unsupported Tags Feel Broken
Mitigation:
- keep unsupported tags styled but non-clickable
- do not show errors for expected unsupported content

### Risk 5: Route Cycles
Mitigation:
- allow cycles naturally through stack navigation
- do not add cycle prevention unless a concrete issue appears

## Exit Criteria
Step 17 is complete when:
- supported inline spell/item/feat/optional-feature references become tappable when resolved
- taps use stack push and support chained navigation
- unresolved references remain styled but non-clickable
- unsupported content types do not navigate or error
- existing detail rendering remains readable
- no importer or generated content changes were made
- no schema or migration changes were made
- `npm run typecheck` succeeds
