# Step 5d Automatic Content Versioning Implementation Plan

## Objective
Replace the hardcoded generated content version with an automatically derived content fingerprint so runtime reseeding happens whenever the bundled content meaningfully changes, without depending on manual version bumps.

The immediate outcome of this step is a deterministic `contentVersion` value for the generated 5etools bundle that changes when the generated content changes and remains stable when the content is identical.

This step intentionally focuses on generated content versioning and reseed triggers. It does not change compendium UI behavior or local SQLite schema behavior.

## Confirmed Decisions
- Reseeding should depend on meaningful content changes, not on a manually maintained version string.
- Content versioning should remain separate from importer schema versioning.
- Generated timestamps such as `generatedAt` must not influence the content version fingerprint.
- The runtime seed logic may remain unchanged if the generated bundle exposes a correct automatic content version.

## Product Boundary

### Included In Step 5d
- Remove reliance on a hardcoded content version string.
- Add deterministic content fingerprint generation during 5etools bundle generation.
- Write the derived content version into the manifest and chunk files.
- Keep runtime reseeding behavior driven by the generated content version.

### Explicitly Excluded From Step 5d
- SQLite schema changes.
- Compendium UI changes.
- Importer source classification changes unrelated to version derivation.
- Remote content syncing logic.

## Feature Goals
- Running the generator twice with identical content should produce the same `contentVersion`.
- Changing importer logic or generated content should produce a different `contentVersion`.
- The app should reseed automatically after a real content change, without requiring manual version bumps.
- The app should skip reseeding when generated content is unchanged.

## Architectural Approach

### Versioning Strategy
Derive `contentVersion` from a deterministic hash of the generated content payloads and manifest structure, excluding volatile fields.

Reason:
- ties reseeding directly to actual bundle contents
- avoids human error from forgotten version bumps
- prevents unnecessary reseeds when only timestamps change

### Hash Input Strategy
Hash stable generated structures such as:
- final chunk payloads
- manifest chunk inventory
- importer schema version
- source repository and source ref metadata

Do not include:
- `generatedAt`
- any other volatile timestamps or runtime-only metadata

### Hashing Location
Compute the derived content version in the writer layer after chunk payloads are assembled but before files are written.

Reason:
- the final generated structures are already available
- ordering is already deterministic there
- avoids duplicating logic elsewhere in the importer flow

## Code Areas To Change

### 1. Importer Configuration
Reduce the role of the current hardcoded content version so it is no longer the driver of runtime reseeding.

Responsibilities:
- keep importer schema version and source metadata intact
- stop using a manually edited string as the content change signal

### 2. Writer Layer
Add deterministic content-version derivation in the generation writer.

Responsibilities:
- build stable hash input from final chunk payloads
- exclude volatile timestamp fields
- assign the same derived version to all chunk payloads and the manifest

### 3. Generated Output Contract
Ensure all generated files continue to expose `contentVersion`, but now as an automatically derived value.

Responsibilities:
- keep manifest/chunk format stable for runtime consumers
- avoid runtime changes where possible

## Verification Plan

### Determinism Checks
- generate content twice with no changes and confirm `contentVersion` stays the same
- confirm chunk and manifest version values match consistently

### Change Detection Checks
- make a real importer/content change
- regenerate content
- confirm `contentVersion` changes

### Runtime Checks
- launch app with an older seeded content version and confirm reseeding occurs
- relaunch without further content changes and confirm reseeding is skipped

### Technical Checks
- typecheck passes
- generator still completes successfully
- runtime still reads manifest and chunk versions without changes to seed flow

## Risks And Tradeoffs
- Hashing final payloads is slightly more work than a manual version string, but it removes a recurring source of operational mistakes.
- If volatile fields accidentally leak into the hash input, reseeds could happen more often than intended.
- If the hash input omits meaningful content structures, some real changes might fail to trigger reseeding.

## Exit Criteria
Step 5d is complete when all of the following are true:
- generated `contentVersion` is automatically derived
- identical content regeneration keeps the same version
- real content changes produce a different version
- runtime reseeding is triggered by actual content changes instead of manual version bumps
- typecheck and generator verification pass
