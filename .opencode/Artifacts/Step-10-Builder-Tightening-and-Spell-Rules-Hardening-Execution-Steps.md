# Step 10 Builder Tightening and Spell Rules Hardening Execution Steps

## Goal
Execute a focused builder-hardening pass so the current builder becomes more accurate, more understandable, and more stable without expanding into new product scope.

## Execution Rules
- Tighten correctness before adding polish.
- Do not broaden scope into new feature areas.
- Keep unsupported cases explicit rather than silently guessing.
- Preserve the agreed override boundary.
- Prefer small structural refinements over broad rewrites.

## Step-By-Step Execution Sequence

### 1. Confirm The Hardening Scope
- Confirm this step tightens the existing builder rather than introducing new major surfaces.
- Confirm spell accuracy is the primary correctness target.
- Confirm review clarity and preview polish are secondary but still required outcomes.

Output:
- stable Step 10 hardening scope.

### 2. Audit The Current Spell Engine
- Identify where the current spell summary logic is still overly generic.
- Identify class types that need differentiated handling.
- Identify current false positives and false negatives in spell validation.

Output:
- spell-hardening target list.

### 3. Refine The Spell State Model
- Tighten `spellsStep` structure where needed.
- Separate selected, prepared, and override-backed spell state more clearly if required.
- Preserve payload-owned spell detail while keeping progress columns minimal.

Output:
- tighter spell payload contract.

### 4. Implement Spell Rules Hardening
- Tighten known versus prepared spell behavior where supported.
- Tighten multiclass spellcasting progression handling.
- Tighten pact magic handling where needed.
- Preserve explicit unsupported-case visibility.

Output:
- more trustworthy spell engine.

### 5. Tighten Review Presentation
- Improve grouping and readability of issues.
- Distinguish unresolved issues from override-backed resolution more clearly.
- Make completion readiness easier to interpret.

Output:
- clearer review surface.

### 6. Harden Completion And Regression
- Verify completion state transitions still align with the validation contract.
- Ensure invalidating edits reliably return completed builds to draft.
- Improve edge-case handling where state can drift.

Output:
- hardened completion lifecycle.

### 7. Polish The Preview Surface
- Improve preview readability and completeness.
- Keep it summary-oriented.
- Ensure it reflects the completed build coherently.

Output:
- polished lightweight preview.

### 8. Run Verification Matrix
- Verify at least one non-caster.
- Verify at least one prepared caster.
- Verify at least one pact caster.
- Verify at least one multiclass caster.
- Verify at least one mixed-edition build.
- Verify override visibility and regression behavior.

Output:
- validated Step 10 hardening baseline.

## Exit Criteria
Step 10 is complete when:
- spell validation is materially tighter for supported caster types
- review semantics are clearer
- completion and regression are stable
- preview quality is improved
- representative end-to-end verification scenarios pass
