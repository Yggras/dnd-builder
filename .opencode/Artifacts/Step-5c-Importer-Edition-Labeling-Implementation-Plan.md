# Step 5c Importer Edition Labeling Implementation Plan

## Objective
Refine 5etools importer edition labeling so 2024-compatible supplement sources are not incorrectly classified as legacy content, while preserving the expected duplicate visibility behavior for older and newer spell versions in the compendium.

The immediate outcome of this step is a broader curated 2024-compatible source policy in the importer that correctly labels spells such as `Holy Star of Mystra` without collapsing `PHB` and `XPHB` duplicates into a single visible entry.

This step intentionally focuses on importer classification and generated content outputs. It does not change compendium UI behavior.

## Confirmed Decisions
- `PHB` and `XPHB` duplicate spell entries should both remain visible in the compendium.
- The importer should distinguish between primary 2024 sources and broader 2024-compatible supplement sources.
- Edition labeling should not remain `XPHB`-only when later additive sources are clearly 2024-compatible.
- The first curated 2024-compatible supplement set is:
  - `FRHoF`
  - `XGE`
  - `TCE`
  - `FTD`
  - `BMT`
  - `AAG`
  - `SCC`
  - `EGW`

## Product Boundary

### Included In Step 5c
- Add a curated 2024-compatible supplement source set to the importer.
- Update importer edition inference logic.
- Regenerate generated 5etools content outputs.
- Verify corrected edition labeling on affected spells.

### Explicitly Excluded From Step 5c
- Compendium UI ranking changes.
- Duplicate suppression between legacy and 2024 spell entries.
- Builder rule changes beyond the effects of corrected source classification.

## Feature Goals
- 2024-compatible supplement spells are no longer mislabeled as legacy.
- Existing duplicate `PHB` and `XPHB` entries remain visible as expected.
- Generated content reflects a clearer policy distinction between primary 2024 sources and broader 2024-compatible sources.

## Architectural Approach

### Source Classification Strategy
Keep explicit raw record flags authoritative, then apply curated source-based inference.

Recommended classification order:
1. Explicit 2024 flags on the raw record.
2. Primary 2024 source membership.
3. Compatible 2024 supplement source membership.
4. Legacy fallback.

Reason:
- keeps direct raw metadata highest priority
- preserves current `XPHB` baseline behavior
- fixes mislabels from later compatible supplements

### Source Set Separation
Keep two separate importer concepts:
- `PRIMARY_2024_SOURCES`
- `COMPATIBLE_2024_SOURCES`

Reason:
- primary baseline and broader compatibility are not the same thing
- later builder and search behavior may want to treat them differently
- avoids overloading a single source set with multiple meanings

## Code Areas To Change

### 1. Importer Source Configuration
Extend importer config with a curated 2024-compatible supplement source set.

Responsibilities:
- centralize compatibility policy
- keep the list explicit and reviewable

### 2. Importer Edition Inference Helpers
Update or replace the current 2024 inference helper so it can distinguish broader compatibility, not just primary source membership.

Responsibilities:
- preserve explicit 2024 flags
- classify compatible supplements correctly
- keep the fallback path predictable

### 3. Normalization Layer
Ensure normalized entity records reflect the improved source classification in:
- `rulesEdition`
- `isLegacy`
- `isPrimary2024`
- builder visibility behavior where applicable

## Verification Plan

### Targeted Data Checks
- `Holy Star of Mystra` should be labeled `2024` after regeneration.
- `Crusader's Mantle` should still expose both `PHB` and `XPHB` entries.
- `Holy Aura` should still expose both `PHB` and `XPHB` entries.

### Broader Source Checks
- Representative spells from `XGE`, `TCE`, `FTD`, `BMT`, `AAG`, `SCC`, and `EGW` should no longer default to legacy solely because they are not `XPHB`.

### Technical Checks
- generated content is regenerated successfully
- typecheck passes
- no UI-specific code changes are required to realize the corrected labels

## Risks And Tradeoffs
- A curated compatibility allowlist is still a policy decision, not automatic truth from raw source metadata.
- Treating more supplements as 2024-compatible may broaden builder visibility more than before, which is intended here but should be monitored.
- Over time the curated set may need revisiting as more sources are added or compatibility expectations change.

## Exit Criteria
Step 5c is complete when all of the following are true:
- the importer contains a curated 2024-compatible supplement source set
- affected spell labels regenerate correctly
- `Holy Star of Mystra` is no longer mislabeled legacy
- `PHB` and `XPHB` duplicate spell visibility remains unchanged
- generated outputs and typecheck verification pass
