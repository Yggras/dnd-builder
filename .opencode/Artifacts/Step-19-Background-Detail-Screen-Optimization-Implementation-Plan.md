# Step 19 Background Detail Screen Optimization Implementation Plan

## Objective
Improve the background compendium detail screen so it is more useful and less repetitive:

- Show a readable background description/overview when source content provides one.
- Make background feat references tappable.
- Make equipment references in the Details block tappable.
- Remove the separate Starting Equipment section because that information is already present in Details.
- Keep starting equipment inside the Details block.

## Confirmed Decisions
- This is a runtime UI/rendering improvement only.
- Do not regenerate bundled 5etools content.
- Do not change SQLite schema or migrations.
- Do not change builder behavior or background automation.
- Do not add a new top-level compendium category.
- Preserve existing generic inline reference behavior.

## Current State Summary

### Already Present
- Background detail pages are rendered by `src/features/compendium/components/BackgroundDetailView.tsx`.
- Background records already include source `renderPayload.entries` with list rows such as `Feat:` and `Equipment:`.
- Inline reference navigation already supports `feat` and `item` references when the render tokens preserve reference metadata.
- Background entries already include `metadata.equipmentSummary`, `metadata.featIds`, and `metadata.entriesText`.
- Details are rendered through `RenderBlockList` and `buildRenderBlocks(entry)`.

### Problems
- A dedicated description/overview is missing from the background detail screen.
- `BackgroundDetailView` renders a separate Starting Equipment section from `metadata.equipmentSummary`, duplicating the Equipment row already shown in Details.
- Object-style list items in `detailBlocks.ts` are converted through `extractReadableText()`, which cleans inline tags before tokenization.
- Because inline tags are stripped too early, source rows such as `Feat: {@feat ...}` and `Equipment: {@item ...}` display readable text but do not become tappable links in Details.

## Implementation Strategy

### 1. Add Background Overview
Add a lightweight background overview section near the top of `BackgroundDetailView`.

Recommended behavior:
- Prefer the first meaningful prose paragraph from `entry.renderPayload.entries` that is not the mechanical opening list.
- Fall back to `entry.summary` when no narrative prose exists.
- Avoid showing raw JSON, IDs, or generated metadata.
- Avoid duplicating the full Details section.

Possible section title:
- `Overview`

For modern 2024 backgrounds that only contain mechanical list rows, the fallback summary is acceptable even if concise and mechanical. For legacy backgrounds, this should surface narrative/background feature prose before the detailed block.

### 2. Remove Duplicate Starting Equipment Section
Remove the explicit Starting Equipment section from `BackgroundDetailView.tsx`.

Expected cleanup:
- Remove `equipmentSummary` rendering.
- Remove now-unused imports such as `RichTextLine`, `useInlineTokenReferenceTargets`, and `parseInlineText` if they become unused.
- Keep Details unchanged as the canonical place for starting equipment text.

### 3. Preserve Inline References In Object List Items
Update `src/features/compendium/utils/detailBlocks.ts` so object-style list items preserve raw inline tags when creating `InlineTextToken`s.

Target source shapes:
- `{ type: 'item', name: 'Feat:', entry: '{@feat ...}' }`
- `{ type: 'item', name: 'Equipment:', entry: '... {@item ...}' }`

Recommended approach:
- Add a small helper that formats list item records as display text without cleaning inline tags from the `entry` value.
- Include the item `name` prefix when present.
- Use `parseInlineText()` on the raw formatted text so reference metadata survives.
- Keep fallback behavior for unusual object shapes.

This should make feat and equipment links work in Details without adding per-row custom UI.

### 4. Keep Scope Narrow
Do not make facts clickable in this step unless Details links prove insufficient.

Reason:
- The user specifically wants equipment links in the detail section.
- The generated background Details block already contains both feat and equipment rows.
- Reusing the shared renderer avoids a background-only link component.

### 5. Verification
Run:
- `npm run typecheck`

Manual smoke checks:
- Open a 2024 background such as `Aberrant Heir`.
- Confirm an overview/description is visible.
- Confirm the separate Starting Equipment card is gone.
- Confirm `Feat:` in Details links to the feat page.
- Confirm equipment names in Details link to item pages.
- Open a legacy background such as `Acolyte`.
- Confirm legacy narrative/feature prose remains readable.
- Confirm unsupported inline tags remain safe and non-clickable.

## Code Areas To Change When Approved

### Background Detail Screen
- `src/features/compendium/components/BackgroundDetailView.tsx`

Expected impact:
- Add overview display.
- Remove duplicate Starting Equipment section.
- Remove unused equipment-specific inline reference plumbing.

### Detail Block Renderer Utilities
- `src/features/compendium/utils/detailBlocks.ts`

Expected impact:
- Preserve inline tags for object-style list items.
- Enable existing inline reference resolver to link feats and items from background Details.

## Risks And Mitigations

### Risk 1: Overview Duplicates Details Too Much
Mitigation:
- Prefer a short first prose paragraph.
- Fall back to summary only when no prose paragraph exists.

### Risk 2: List Item Formatting Regresses Other Detail Pages
Mitigation:
- Keep the helper narrow and compatible with existing object-list shapes.
- Preserve fallback behavior for unsupported shapes.
- Run typecheck and smoke-check non-background detail pages if touched behavior appears broad.

### Risk 3: Ambiguous Inline References Do Not Navigate
Mitigation:
- Keep existing resolver behavior: ambiguous refs remain non-clickable.
- Do not force navigation when source/name resolution is uncertain.

## Exit Criteria
Step 19 is complete when:
- Background detail pages show an overview/description when available.
- The separate Starting Equipment section is removed.
- Starting equipment remains visible inside Details.
- Feat references in background Details can navigate when resolved.
- Equipment references in background Details can navigate when resolved.
- No generator, schema, migration, or builder changes are made.
- `npm run typecheck` succeeds.
