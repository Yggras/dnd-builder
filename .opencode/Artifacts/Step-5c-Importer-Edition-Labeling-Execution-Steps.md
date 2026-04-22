# Step 5c Importer Edition Labeling Execution Steps

## Goal
Execute the importer edition-labeling refinement in a controlled sequence so 2024-compatible supplement sources are classified correctly without changing the expected duplicate spell visibility behavior in the compendium.

## Execution Rules
- Do not collapse `PHB` and `XPHB` duplicates into one visible entry in this step.
- Keep explicit raw 2024 flags authoritative.
- Keep primary 2024 source logic separate from broader 2024-compatible source logic.
- Regenerate generated outputs after importer changes and verify affected examples directly.

## Step-By-Step Execution Sequence

### 1. Confirm The Source Classification Contract
- Confirm primary 2024 and compatible 2024 are different importer concepts.
- Confirm duplicate spell visibility should remain unchanged.
- Confirm the initial curated compatible source set.

Output:
- stable edition-labeling contract for importer changes.

### 2. Extend Importer Source Configuration
- Add `COMPATIBLE_2024_SOURCES` to importer config.
- Keep `PRIMARY_2024_SOURCES` intact.

Output:
- explicit source policy for broader 2024 compatibility.

### 3. Update Edition Inference Helpers
- Refine the current importer helper so it can classify a record as 2024-compatible even when it is not from a primary 2024 source.
- Preserve explicit raw flags and current primary-source behavior.

Output:
- importer edition inference aligned to the broader curated set.

### 4. Update Normalization Behavior
- Ensure normalized records use the refined classification for:
  - `rulesEdition`
  - `isLegacy`
  - `isPrimary2024`
  - builder visibility where applicable

Output:
- normalized entities reflect corrected edition labeling.

### 5. Regenerate Generated Content
- Run the 5etools generator.
- Update generated spell and compendium outputs.

Output:
- fresh generated content reflecting the importer changes.

### 6. Verify Affected Spell Labels
- Confirm `Holy Star of Mystra` is labeled `2024`.
- Confirm `Crusader's Mantle` still includes both `PHB` and `XPHB` entries.
- Confirm `Holy Aura` still includes both `PHB` and `XPHB` entries.

Output:
- targeted spell verification completed.

### 7. Verify Broader Source Coverage
- Inspect representative outputs for `XGE`, `TCE`, `FTD`, `BMT`, `AAG`, `SCC`, and `EGW`.
- Confirm they are no longer defaulting to legacy solely due to non-`XPHB` source codes.

Output:
- broader source classification verified.

### 8. Run Technical Verification
- Run TypeScript typecheck.
- Confirm no unrelated runtime regressions were introduced by the importer changes.

Output:
- validated Step 5c importer baseline.

## Task List
1. Confirm the importer source classification contract.
2. Add `COMPATIBLE_2024_SOURCES` to config.
3. Refine edition inference helpers.
4. Update normalization behavior as needed.
5. Regenerate generated outputs.
6. Verify targeted spell labels.
7. Verify broader source coverage.
8. Run typecheck and final verification.

## Risks During Execution

### Risk 1: Primary And Compatible Source Meanings Become Blurred
Mitigation:
- keep separate constants and separate helper semantics.

### Risk 2: Duplicate Spell Visibility Changes Accidentally
Mitigation:
- keep search and UI behavior untouched in this step and verify the duplicate examples directly.

### Risk 3: Builder Visibility Broadens More Than Expected
Mitigation:
- review representative generated entries from the curated compatible set before accepting the change.

## Exit Criteria
Step 5c is complete when:
- broader 2024-compatible supplement sources are configured in the importer
- edition inference reflects the new compatibility policy
- `Holy Star of Mystra` is labeled `2024`
- `Crusader's Mantle` and `Holy Aura` still expose both old and new versions
- regenerated outputs and typecheck verification pass
