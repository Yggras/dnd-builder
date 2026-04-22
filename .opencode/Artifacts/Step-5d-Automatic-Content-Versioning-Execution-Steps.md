# Step 5d Automatic Content Versioning Execution Steps

## Goal
Execute the automatic content-versioning improvement in a controlled sequence so generated 5etools bundles trigger runtime reseeding only when their actual contents change.

## Execution Rules
- Do not depend on a manual content version bump for reseeding after this step.
- Keep importer schema version separate from generated content version.
- Exclude volatile timestamps from version derivation.
- Preserve the existing runtime manifest/chunk contract unless a change is strictly required.

## Step-By-Step Execution Sequence

### 1. Confirm The Versioning Contract
- Confirm runtime reseeding should continue comparing stored seeded version to bundled content version.
- Confirm `contentVersion` should represent bundle content changes, not generation time.
- Confirm importer schema version remains a separate concern.

Output:
- stable contract for automatic content versioning.

### 2. Remove Reliance On Manual Content Versioning
- Reduce or eliminate the hardcoded content version string as the source of reseed truth.
- Preserve schema version and source metadata values separately.

Output:
- importer no longer depends on manual reseed version maintenance.

### 3. Add Deterministic Content Fingerprinting
- Build stable hash input from final chunk payloads and manifest structure.
- Exclude `generatedAt` and similar volatile fields.
- Compute a deterministic hash-based content version.

Output:
- automatically derived content version.

### 4. Write The Derived Version Into Generated Outputs
- Apply the derived `contentVersion` to all chunk payloads.
- Apply the same version to `content-index.json`.

Output:
- generated output contract updated with automatic versioning.

### 5. Run Determinism Verification
- Generate the bundle twice without changes.
- Confirm `contentVersion` remains identical across runs.

Output:
- determinism validated.

### 6. Run Change Detection Verification
- Make or reuse a meaningful importer/content change.
- Regenerate the bundle.
- Confirm `contentVersion` changes.

Output:
- real content changes now trigger a new bundled version.

### 7. Verify Runtime Reseed Behavior
- Launch app with a prior seeded version and confirm reseeding occurs after a real generated-content change.
- Relaunch without further changes and confirm reseeding is skipped.

Output:
- runtime seed trigger behavior validated.

### 8. Run Technical Verification
- Run typecheck.
- Confirm generator output remains valid.
- Confirm runtime code still consumes generated manifest and chunks without additional contract changes.

Output:
- validated Step 5d automatic versioning baseline.

## Task List
1. Confirm the automatic content versioning contract.
2. Remove reliance on manual content versioning.
3. Implement deterministic content fingerprinting.
4. Apply the derived version to manifest and chunk outputs.
5. Verify deterministic repeat generation.
6. Verify change detection behavior.
7. Verify runtime reseeding behavior.
8. Run typecheck and final technical verification.

## Risks During Execution

### Risk 1: Volatile Fields Leak Into The Hash Input
Mitigation:
- explicitly strip `generatedAt` and similar volatile values before hashing.

### Risk 2: Hash Input Misses Meaningful Content Changes
Mitigation:
- build the fingerprint from final chunk payloads and manifest structure rather than partial intermediate data.

### Risk 3: Runtime Contract Changes Unnecessarily
Mitigation:
- keep the manifest and chunk `contentVersion` fields intact and only change how they are derived.

## Exit Criteria
Step 5d is complete when:
- generated content versioning is automatic
- identical bundle regenerations keep the same version
- real content changes produce a different version
- runtime reseeding follows actual bundle changes
- typecheck and generator verification pass
