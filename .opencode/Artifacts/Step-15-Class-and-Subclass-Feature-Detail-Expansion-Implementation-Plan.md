# Step 15 Class and Subclass Feature Detail Expansion Implementation Plan

## Objective
Add real expandable class and subclass feature descriptions to the compendium by importing feature body content from 5etools class source files and rendering it inside the existing feature progression lists.

The outcome of this step is that class and subclass progression rows can be expanded to show what each feature does, using the Step 13 shared renderer for cleaned, styled rules text.

## Confirmed Decisions
- Expandable feature rows should apply to both classes and subclasses.
- Current runtime data is insufficient because class/subclass metadata only stores feature references, not feature bodies.
- This step should include importer/generated-content work.
- SQLite schema changes are not needed because feature details can live inside existing JSON metadata.
- Feature details should remain nested under class/subclass metadata for now.
- Do not introduce top-level compendium feature entries in this step.
- Do not add clickable cross-reference links in this step.
- Use existing Step 13 render block parsing and rendering for expanded feature content.
- Regenerating generated content is expected and justified for this feature.

## Product Boundary

### Included In Step 15
- Extend raw class source loading/normalization to preserve class feature body records.
- Extend raw class source loading/normalization to preserve subclass feature body records.
- Normalize feature detail payloads into app-friendly runtime metadata.
- Attach class feature details to class metadata.
- Attach subclass feature details to subclass metadata.
- Regenerate checked-in `generated/5etools/` content.
- Update runtime class/subclass feature parsing to include feature detail content when available.
- Update feature progression UI so rows expand/collapse.
- Render expanded details with the existing shared `RenderBlockList` renderer.
- Run generator and TypeScript verification.

### Explicitly Excluded From Step 15
- SQLite schema changes.
- Local DB migrations.
- New first-class `class_feature` or `subclass_feature` tables.
- New top-level compendium categories for features.
- Clickable inline links.
- Full feature search UI.
- Builder automation changes.
- Homebrew/user import support.
- Full rework of class/subclass importer architecture beyond feature details.

## Feature Goals
- Users can expand `Fighting Style`, `Action Surge`, `Spellcasting`, subclass features, and similar rows to read rules text in place.
- Class and subclass pages become useful rules references, not only progression indexes.
- Expanded feature content should hide raw 5etools syntax.
- Feature rows without imported details should remain readable and not crash.
- The generated runtime data should keep enough traceability to match progression references to feature body records.

## Current State

### Runtime Class/Subclass Metadata
Current class metadata includes references such as:
- `metadata.classFeatures`
- `metadata.subclassFeatures`

These references are usually strings like:
- `Fighting Style|Fighter|XPHB|1`
- `Second Wind|Fighter|XPHB|1`
- `Abjurer|Wizard|XPHB|Abjurer|XPHB|3`

Some class feature rows are objects such as:
- `{ classFeature: "Fighter Subclass|Fighter|XPHB|3", gainSubclassFeature: true }`

### Missing Runtime Data
The generated class and subclass compendium records currently have little or no body content:
- `summary: null`
- `text: ""`
- `renderPayload.entries: []`

The actual feature bodies exist in raw 5etools class files, but the importer currently does not normalize and attach them.

## Architectural Approach

### Importer Strategy
Extend the current class normalization flow rather than creating a new runtime feature entity layer.

Reason:
- class and subclass feature bodies are needed primarily inside class/subclass detail pages
- existing local tables already store JSON metadata
- this avoids schema churn while still solving the product issue

Recommended generated metadata additions:

```ts
metadata.classFeatureDetails?: Array<NormalizedFeatureDetail>
metadata.subclassFeatureDetails?: Array<NormalizedFeatureDetail>
```

Recommended detail shape:

```ts
type NormalizedFeatureDetail = {
  ref: string;
  name: string;
  level: number | null;
  sourceCode: string;
  sourceName: string;
  rulesEdition: '2014' | '2024' | 'legacy';
  isLegacy: boolean;
  summary: string | null;
  text: string;
  renderPayload: { entries: unknown[] } | null;
};
```

The exact TypeScript type can remain internal/runtime-inferred, but generated JSON should follow this contract.

### Feature Matching Strategy
Match progression references to feature detail records through stable feature reference keys.

For class features:
- progression ref: `Fighting Style|Fighter|XPHB|1`
- raw feature should produce the same or equivalent `ref`

For subclass features:
- progression ref: `Abjurer|Wizard|XPHB|Abjurer|XPHB|3`
- raw feature should produce the same or equivalent `ref`

Matching should be conservative and deterministic.

Fallback behavior:
- if a feature detail cannot be matched, progression row still renders collapsed with name/level only
- no raw IDs or broken placeholders should appear in normal UI

### Runtime UI Strategy
Extend the existing `FeatureProgressionList` instead of creating a separate detail component.

New behavior:
- rows with details are pressable
- tapping a row expands/collapses detail content
- expanded content renders with `RenderBlockList`
- rows without details may be non-expandable or show no expand affordance

Reason:
- progression lists already represent the class/subclass feature shape
- this keeps class and subclass pages consistent

## Code Areas To Change

### 1. Importer Source Flattening
Primary file:
- `scripts/generate-5etools.mjs`

Responsibilities:
- collect raw `classFeature` arrays from class files if present
- collect raw `subclassFeature` arrays from class files if present
- pass them into class normalization

### 2. Class Normalizer
Primary file:
- `scripts/5etools-importer/normalize.mjs`

Responsibilities:
- accept raw class feature and subclass feature collections
- normalize feature detail records
- attach relevant feature details to normalized class records
- attach relevant feature details to normalized subclass records
- preserve text and render payload entries
- use existing text extraction and source labeling helpers

### 3. Generated Writer
Primary file:
- `scripts/5etools-importer/write.mjs`

Expected impact:
- no structural writer changes should be necessary if details are nested in metadata
- generated content version should change automatically due to metadata changes
- generated registry should update through the existing writer

### 4. Runtime Feature Helpers
Primary file:
- `src/features/compendium/utils/classDetails.ts`

Responsibilities:
- extend `FeatureProgressionRow` with optional detail blocks/source metadata
- match progression rows to generated feature details
- expose detail availability to UI

### 5. Feature Progression UI
Primary file:
- `src/features/compendium/components/FeatureProgressionList.tsx`

Responsibilities:
- make detail-capable rows expandable
- show clear affordance for expandable rows
- render expanded details using `RenderBlockList`
- preserve current visual style and subclass unlock styling

### 6. Class And Subclass Detail Screens
Primary files:
- `src/features/compendium/screens/CompendiumClassScreen.tsx`
- `src/features/compendium/components/SubclassDetailView.tsx`

Expected impact:
- pass progression rows containing details into `FeatureProgressionList`
- no major layout rewrite should be needed

## Importer Data Notes

### Raw Class Files
5etools class files can contain multiple collections including:
- `class`
- `subclass`
- `classFeature`
- `subclassFeature`

The importer currently flattens only `class` and `subclass`. This step should include feature collections as first-class input to normalization.

### Text And Render Payload
Feature details should use the same source text strategy as other normalized records:
- `summary` from extracted text
- `text` from stripped readable text
- `renderPayload.entries` preserving enough structure for the Step 13 runtime renderer

Known compromise:
- render payload may still contain source-like nested shapes and inline tags
- Step 13 renderer is responsible for runtime cleanup in this phase

### Source And Edition Labeling
Feature detail records should preserve source/edition metadata consistently with their raw source record.

Edition behavior should follow existing importer helpers:
- explicit 2024 flags
- primary 2024 source membership
- compatible 2024 source membership
- legacy fallback

### Duplicate And Versioned Features
The importer should avoid collapsing different source versions unless they naturally attach to different class/subclass records.

Reason:
- PHB and XPHB features can differ
- progression references include source information and should preserve source-specific behavior

## UX Requirements
- Feature rows should remain compact when collapsed.
- Expand affordance should be obvious but not visually noisy.
- Expanded content should be readable on mobile.
- Expanded content should support paragraphs, lists, and basic tables through `RenderBlockList`.
- Rows without details should not imply they are expandable.
- Subclass unlock rows should retain their special visual treatment.
- Expanded feature details should not expose raw 5etools tag syntax.

## Verification Plan

### Generator Verification
- Run `npm run generate:5etools`.
- Confirm manifest content version changes.
- Confirm generated class metadata includes feature details.
- Confirm generated subclass metadata includes feature details.
- Confirm generated registry updates successfully.

### TypeScript Verification
- Run `npm run typecheck`.

### Manual Class Checks
Inspect at least:
- Fighter
- Wizard or Cleric
- Warlock
- Artificer

Confirm:
- feature rows expand where details exist
- expanded class feature text is readable
- subclass unlock rows remain distinguishable
- rows without detail do not break UI

### Manual Subclass Checks
Inspect at least:
- one XPHB subclass
- one legacy/PHB subclass
- one supplement subclass

Confirm:
- subclass feature rows expand where details exist
- feature body text matches the selected source/version where practical
- expanded detail text uses styled inline references and no raw tags

## Risks And Mitigations

### Risk 1: Feature Reference Matching Is Incomplete
Mitigation:
- build deterministic refs from raw feature fields
- preserve progression rows even when unmatched
- add targeted matching fallback only when observed necessary

### Risk 2: Generated Diff Is Large
Mitigation:
- accept generated diff for this feature because feature body data is required
- do not casually rerun generation outside this step
- review representative chunks rather than the entire generated diff manually

### Risk 3: Runtime Metadata Becomes Too Large
Mitigation:
- keep feature details nested only for class/subclass records already being seeded
- avoid duplicating feature details into separate compendium chunks in this step
- revisit dedicated feature tables only if performance or bundle size becomes a concrete issue

### Risk 4: Source Feature Shapes Are Irregular
Mitigation:
- use existing `extractText` fallback
- preserve render payload entries defensively
- fail gracefully in UI for missing/unsupported detail payloads

### Risk 5: Expanded Rows Become Too Verbose
Mitigation:
- collapsed state stays compact
- expanded content is user-initiated
- long feature text lives inside the row expansion rather than always visible

## Exit Criteria
Step 15 is complete when:
- raw class feature records are imported into generated class metadata
- raw subclass feature records are imported into generated subclass metadata
- class feature progression rows can expand to show real feature details when available
- subclass feature progression rows can expand to show real feature details when available
- expanded feature content uses the shared renderer and does not show raw tag syntax in normal cases
- rows without detail remain stable and readable
- no SQLite schema or migration changes were made
- generated content was regenerated intentionally
- `npm run generate:5etools` completes successfully
- `npm run typecheck` passes
