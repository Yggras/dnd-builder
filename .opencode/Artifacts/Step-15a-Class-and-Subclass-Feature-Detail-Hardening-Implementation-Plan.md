# Step 15a Class and Subclass Feature Detail Hardening Implementation Plan

## Objective
Harden the existing Step 15 class/subclass feature-detail implementation before moving on to new compendium detail surfaces.

Step 15 already imports feature body text, regenerates class/subclass metadata, and renders expandable feature progression rows. Step 15a locks down correctness and resilience so feature details are matched deterministically, importer mismatches are visible, and expanded text avoids leaking raw 5etools syntax in normal cases.

## Confirmed Decisions
- This is a hardening pass, not a new product surface.
- Do not add new compendium categories.
- Do not add SQLite schema changes or migrations.
- Do not add new content tables.
- Do not change builder automation behavior.
- Keep feature details nested in class/subclass metadata.
- Continue using the Step 13 renderer for expanded feature content.
- Regenerating generated 5etools content is expected after importer metadata changes.
- This document is planning-only; no implementation code should be written until explicitly approved.

## Product Boundary

### Included In Step 15a
- Add stable feature refs to generated class and subclass feature detail records.
- Match runtime feature rows to details by explicit ref instead of array index only.
- Preserve safe fallback behavior for rows without details.
- Add light importer validation for duplicate feature detail refs.
- Add basic unmatched progression-ref reporting or diagnostics during generation.
- Strengthen inline tag parsing for observed raw tag leaks in expanded feature text.
- Regenerate checked-in generated content after importer changes.
- Run TypeScript verification.

### Explicitly Excluded From Step 15a
- New first-class feature entities.
- Top-level class feature or subclass feature compendium browse pages.
- Clickable inline references.
- Search indexing changes.
- SQLite schema or migration changes.
- Builder rule automation changes.
- Major renderer redesign.
- Homebrew or user import support.

## Current State Summary

### Already Present
- `scripts/generate-5etools.mjs` collects raw `classFeature` and `subclassFeature` records.
- `scripts/5etools-importer/normalize.mjs` attaches feature details to class/subclass metadata.
- `generated/5etools/` contains `classFeatureDetails` and `subclassFeatureDetails` in representative class/subclass records.
- `src/features/compendium/components/FeatureProgressionList.tsx` expands rows with detail entries.
- `src/features/compendium/utils/classDetails.ts` reads detail entries into `FeatureProgressionRow`.
- `npm run typecheck` currently passes.

### Known Gaps
- Runtime feature-detail matching relies on array index alignment between progression refs and detail arrays.
- Generated detail records do not currently expose a stable `ref` value.
- Generated detail records are lean and do not include summary/text/source-name metadata from the Step 15 ideal shape.
- Duplicate feature detail refs are not explicitly validated.
- Unmatched progression refs are not surfaced clearly during generation.
- Some expanded feature text can still expose unsupported or partially parsed inline tags such as `{@5etools ...}`, `{@itemMastery ...}`, `{@creature ...}`, or nested tags inside `{@note ...}`.

## Implementation Strategy

### 1. Stable Feature Refs
Extend the importer feature-detail normalization so every matched detail record includes a deterministic `ref`.

Recommended generated detail shape for Step 15a:

```ts
type NormalizedFeatureDetail = {
  ref: string;
  name: string;
  level: number | null;
  sourceCode: string | null;
  page: number | null;
  entries: unknown[];
};
```

Keep the shape minimal unless richer metadata is needed immediately. `summary`, `text`, `sourceName`, and edition fields can remain future enhancements if `ref` matching and rendering do not require them.

### 2. Runtime Matching By Ref
Update class/subclass feature row building to prefer explicit ref matching.

Recommended behavior:
- Parse a progression feature ref from `metadata.classFeatures` or `metadata.subclassFeatures`.
- Look for a feature detail record with the same `ref`.
- Fall back to the current index-aligned detail if needed.
- Preserve rows when no detail exists.
- Never display raw refs or unresolved IDs in normal UI.

### 3. Importer Validation And Diagnostics
Add light generation-time checks that identify obvious importer mistakes without blocking valid partial coverage.

Validation targets:
- Duplicate `ref` values within a class's `classFeatureDetails`.
- Duplicate `ref` values within a subclass's `subclassFeatureDetails`.
- Optional warning counts for unmatched class/subclass progression refs.

Failure policy:
- Throw on duplicate refs because duplicate detail matching is ambiguous.
- Do not fail generation solely because some progression refs are unmatched unless a systemic mismatch is detected.

### 4. Inline Tag Hardening
Expand the existing inline text parser to preserve readable labels from observed feature-detail tags.

Observed tags to support or safely strip:
- `{@5etools ...}`
- `{@itemMastery ...}`
- `{@creature ...}`
- nested tags inside `{@note ...}`
- existing supported tags must keep their current display behavior.

Expected behavior:
- The visible text should remain readable.
- Unsupported tags should not leak raw `{@...}` syntax.
- References remain styled but non-clickable.

### 5. Generated Content Refresh
Run `npm run generate:5etools` after importer changes.

Expected generated changes:
- `generated/5etools/content-index.json` gets a new `contentVersion` and `generatedAt`.
- Class chunks include `metadata.classFeatureDetails[].ref`.
- Subclass records include `metadata.subclassFeatureDetails[].ref`.
- Generated registry remains valid.

### 6. Verification
Run `npm run typecheck` after regeneration.

Manual smoke checks should focus on expanded feature detail rows:
- Fighter class page.
- Wizard or Cleric class page.
- Warlock class page.
- Artificer class page.
- One XPHB subclass page.
- One legacy PHB subclass page.
- One supplement subclass page.

## Code Areas To Change When Approved

### Importer Orchestration
- `scripts/generate-5etools.mjs`

Expected impact:
- No major changes expected unless diagnostics are centralized there.

### Importer Normalization
- `scripts/5etools-importer/normalize.mjs`

Expected impact:
- Add stable refs to normalized feature detail records.
- Add duplicate-ref validation helpers.
- Add unmatched-ref diagnostics if practical.

### Runtime Class/Subclass Helpers
- `src/features/compendium/utils/classDetails.ts`

Expected impact:
- Extend local feature detail type with optional `ref`.
- Match detail records by ref first.
- Keep index fallback as defensive compatibility for previously generated data only if needed.

### Inline Text Utility
- `src/features/compendium/utils/inlineText.ts`

Expected impact:
- Add support for observed 5etools tag names.
- Improve fallback handling so unknown tags keep readable labels without raw syntax.

### Generated Content
- `generated/5etools/**`
- `src/shared/content/generated/5etoolsRegistry.ts`

Expected impact:
- Large generated diff is expected and acceptable for this step.

## Risks And Mitigations

### Risk 1: Ref Shape Drift
Mitigation:
- Build refs from the same parser used to interpret progression refs.
- Keep generated refs close to source UID strings where possible.

### Risk 2: Large Generated Diff
Mitigation:
- Regenerate only once after implementation is ready.
- Inspect representative chunks instead of manually reviewing every generated file.

### Risk 3: Overly Strict Validation Blocks Useful Partial Data
Mitigation:
- Throw only on duplicate refs.
- Treat unmatched refs as warnings/counts unless the mismatch is clearly systemic.

### Risk 4: Inline Parser Eats Useful Text
Mitigation:
- Keep payload-label extraction conservative.
- Add support for observed tags by preserving first readable payload segment.

### Risk 5: Backward Compatibility Complexity
Mitigation:
- Prefer generated `ref` matching going forward.
- Keep only minimal index fallback if needed because existing checked-in generated content may temporarily lack refs during development.

## Exit Criteria
Step 15a is complete when:
- Generated class feature details include stable refs.
- Generated subclass feature details include stable refs.
- Runtime feature rows match details by ref before relying on index fallback.
- Duplicate feature detail refs fail generation.
- Unmatched progression refs are surfaced clearly enough for follow-up.
- Expanded feature text does not expose common raw tags in normal cases.
- Rows without details remain stable and readable.
- No SQLite schema or migration files changed.
- No new content tables or compendium categories were added.
- `npm run generate:5etools` succeeds.
- `npm run typecheck` succeeds.
