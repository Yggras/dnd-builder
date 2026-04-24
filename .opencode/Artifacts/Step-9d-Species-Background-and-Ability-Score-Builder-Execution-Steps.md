# Step 9d Species Background and Ability Score Builder Execution Steps

## Goal
Execute the origin and ability-score builder work so species, background, granted feats, and ASI handling become real guided parts of the wizard.

## Execution Rules
- Do not treat compendium availability as sufficient proof of builder readiness.
- Auto-apply only deterministic effects that are reliable.
- Keep background required for completion.
- Surface unsupported cases as checklist items rather than silent omissions.

## Step-By-Step Execution Sequence

### 1. Confirm The Origin Contract
- Confirm species and background are real builder steps.
- Confirm background is required.
- Confirm deterministic benefits should auto-apply.

Output:
- stable origin-step contract.

### 2. Add Builder-Facing Background Access
- Extend repository/service access to backgrounds.
- Verify background metadata needed for builder use.

Output:
- builder-ready background access.

### 3. Implement Species Step
- Add species selection.
- Apply deterministic species effects where reliable.
- Keep detailed species-step state in `character_builds.payload`.

Output:
- usable species step.

### 4. Implement Background Step
- Add background selection.
- Apply deterministic background effects where reliable.
- Keep detailed background-step state in `character_builds.payload`.

Output:
- usable required background step.

### 5. Add Granted-Feat Follow-Up
- Detect feat-granting origin cases.
- Surface explicit follow-up selection behavior.

Output:
- guided granted-feat handling.

### 6. Implement Ability And ASI Handling
- Add manual ability score allocation.
- Add ASI handling with rules enforcement.
- Keep detailed allocation state in `character_builds.payload` while preserving resumable step progress through explicit columns.

Output:
- ability-score baseline.

### 7. Verify Origin And Ability Behavior
- Test species and background selection.
- Test required background behavior.
- Test deterministic grant application.
- Test ability/ASI validation.

Output:
- validated origin and ability baseline.

## Exit Criteria
Step 9d is complete when:
- species and background steps work
- backgrounds are required
- granted-feat follow-up works
- ability score and ASI handling works
- unsupported origin logic appears as checklist items
