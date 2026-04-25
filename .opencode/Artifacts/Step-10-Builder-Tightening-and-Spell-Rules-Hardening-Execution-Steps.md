# Step 10 Builder Tightening and Spell Rules Hardening Execution Steps

## Goal
Execute a focused builder-hardening pass so the current builder becomes more accurate, more understandable, and more stable without expanding into new product scope.

This step also closes the remaining `9f` baseline gaps in subclass-aware spellcasting, prepared-vs-known spell handling, completion routing, and preview parity.

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
- Audit subclass spellcasting metadata usage alongside class spellcasting metadata.
- Identify where current logic ignores subclass casters and `1/3` progression.
- Identify current false positives and false negatives in spell validation.
- Identify where `preparedSpellIds` exists but is not participating in validation or UI behavior.

Output:
- spell-hardening target list.

### 3. Refine The Spell State Model
- Tighten `spellsStep` structure where needed.
- Define the active spell payload contract for known/selected spells, prepared spells, cantrips, and manual exceptions.
- Separate selected, prepared, and override-backed spell state more clearly.
- Decide which classes and subclasses use prepared validation versus known-only validation based on available metadata.
- Preserve payload-owned spell detail while keeping progress columns minimal.

Output:
- tighter spell payload contract.

### 4. Implement Spell Rules Hardening
- Tighten known versus prepared spell behavior where supported.
- Tighten multiclass spellcasting progression handling.
- Tighten pact magic handling where needed.
- Add subclass-aware spellcasting derivation.
- Add explicit `1/3` progression handling.
- Include subclass spellcasting metadata in cantrip, known/prepared, and max-level validation.
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
- Require completion persistence to succeed before preview navigation.
- Prevent draft builds from rendering as completed preview.
- Improve edge-case handling where state can drift.

Output:
- hardened completion lifecycle.

### 7. Polish The Preview Surface
- Improve preview readability and completeness.
- Keep it summary-oriented.
- Add class/subclass summary and selected feat summary.
- Improve spell summary clarity.
- Ensure it reflects the completed build coherently.

Output:
- polished lightweight preview.

### 8. Run Verification Matrix
- Verify at least one non-caster.
- Verify at least one prepared caster.
- Verify at least one known-spells caster.
- Verify at least one pact caster.
- Verify at least one subclass-only or `1/3` caster.
- Verify at least one multiclass caster.
- Verify at least one multiclass caster with subclass spellcasting contribution.
- Verify at least one mixed-edition build.
- Verify override visibility and regression behavior.
- Verify completion routing only after successful save.
- Verify draft preview rejection or redirect behavior.

Output:
- validated Step 10 hardening baseline.

## Exit Criteria
Step 10 is complete when:
- spell validation is materially tighter for supported caster types
- subclass-aware spellcasting and prepared-versus-known handling are trustworthy for supported cases
- review semantics are clearer
- completion and regression are stable, including persistence and preview routing
- preview quality is improved and completion-gated
- representative end-to-end verification scenarios pass
