# Step 9d Species Background and Ability Score Builder Implementation Plan

## Objective
Implement the species, background, and ability score portions of the builder so origin choices, granted feat follow-ups, and ability allocation become rules-aware guided steps.

## Confirmed Decisions
- Species and background benefits should auto-apply when deterministic.
- Background is required for completion.
- Granted feats should trigger separate follow-up handling.
- Ability scores are handled manually with rules enforcement.
- ASIs and feats are guided but editable.
- Origin selections, granted-feat follow-up, and ability-score detail stay in `character_builds.payload`, while step progress remains visible through explicit builder progress columns.

## Product Boundary

### Included In Step 9d
- Species step.
- Background step.
- Deterministic benefit application where reliable.
- Granted-feat follow-up handling.
- Ability score and ASI handling.
- Checklist behavior for partially supported origin logic.

### Explicitly Excluded From Step 9d
- Full spell engine.
- Inventory/start gear logic.
- Final review/completion behavior.

## Feature Goals
- Species and background become real builder steps.
- Required background selection is enforced.
- Ability and ASI flows are rules-aware.
- Reliable deterministic grants are auto-applied.

## Architectural Approach

### 1. Builder-Facing Background Support
Wire backgrounds through the content service and repository layer for builder use.

### 2. Origin Benefit Application
Apply deterministic species/background benefits automatically where support is reliable.

### 3. Granted Feat Follow-Up
Surface feat-granting origin decisions as explicit follow-up choices.

### 4. Ability And ASI Engine
Support manual allocation plus legal ASI handling with validation.

Persistence note:
- store detailed species, background, granted-feat, and ability-allocation state inside `character_builds.payload`

## Verification
- Species can be selected.
- Backgrounds can be selected and are required.
- Deterministic benefits apply where reliable.
- Granted-feat follow-up appears when needed.
- Ability scores and ASIs validate correctly.
- The builder can resume origin and ability work without expanding the explicit-column surface beyond progress metadata.

## Risks And Mitigations

### Risk 1: Background Data Is Searchable But Not Builder-Ready
Mitigation:
- explicitly extend builder-facing content contracts and support matrix rather than assuming compendium availability equals builder readiness

### Risk 2: Over-Automation Creates Hidden Errors
Mitigation:
- auto-apply only deterministic effects that are trustworthy; fall back to checklist items otherwise

## Exit Criteria
Step 9d is complete when:
- species step works
- background step works and is required
- granted-feat follow-up exists
- ability score and ASI flows are rules-aware
- unsupported origin behavior surfaces as checklist items
