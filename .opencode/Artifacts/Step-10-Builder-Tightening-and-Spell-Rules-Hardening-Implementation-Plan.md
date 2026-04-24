# Step 10 Builder Tightening and Spell Rules Hardening Implementation Plan

## Objective
Tighten the newly implemented builder so the spell system, review semantics, completion flow, and preview surface move from a working baseline to a trustworthy release-quality experience.

This step is a hardening phase, not a new product-surface phase. It focuses on correctness, clarity, and fit-and-finish in the builder flow that now exists after Steps 9a through 9f.

## Confirmed Decisions
- This phase builds on the existing `9f` baseline rather than replacing it.
- Spell-to-class and spell-to-subclass linkage should continue to rely on normalized builder-facing content, not UI-side text heuristics.
- The priority is correctness first, polish second.
- Overrides remain limited to unsupported-content gaps, edge-case spell situations, and explicit visible rule/count bypasses.
- The lightweight preview should remain summary-oriented rather than becoming a full live sheet.
- This phase may refine builder payload structure where needed, but should avoid broad product-scope expansion.

## Product Boundary

### Included In Step 10
- Tighten spell rules accuracy for supported caster classes.
- Improve review semantics and issue presentation.
- Improve completion and regression behavior where needed.
- Polish the lightweight completion preview.
- Add targeted verification across representative builder scenarios.
- Refine builder-owned payload structures when needed to support the tighter rules model.

### Explicitly Excluded From Step 10
- Campaign assignment or live sheet work.
- DM dashboard changes.
- New compendium feature work unrelated to builder correctness.
- New builder steps beyond the current agreed flow.
- Homebrew or custom content support.

## Feature Goals
- Supported spellcasting classes feel rules-aware rather than approximate.
- Review clearly communicates what is blocked, unresolved, overridden, or merely informational.
- Completion and regression behavior feels stable and predictable.
- The post-completion preview feels intentional and informative.
- The builder is trustworthy enough that remaining gaps are explicit rather than hidden.

## Architectural Approach

### 1. Spell Rules Hardening
Tighten the spell engine from a generic count-based model into a more class-aware implementation.

Primary responsibilities:
- distinguish prepared versus known behavior where the current class metadata supports it
- tighten multiclass spellcasting progression handling
- account for pact magic separately where needed
- reduce false-positive and false-negative validation outcomes

### 2. Spell State Model Refinement
Refine `spellsStep` so the payload structure better reflects actual spell workflows.

Primary responsibilities:
- represent cantrips distinctly if needed
- separate selected spells from prepared spells where needed
- preserve visible override-backed spell exceptions cleanly
- avoid relying on freeform exception notes for everything

### 3. Review Semantics Tightening
Improve the review layer so the validation contract is easier to read and trust.

Primary responsibilities:
- group issues more clearly by severity and/or step
- make override-backed resolution visibly distinct from unresolved issues
- improve user understanding of completion eligibility

### 4. Completion and Regression Hardening
Tighten state transitions so builder completion remains stable under edits.

Primary responsibilities:
- reduce inconsistent transitions between `draft` and `complete`
- ensure invalidating edits reliably regress complete builds to draft
- preserve explicit progress-column behavior while keeping detailed reasoning in payload

### 5. Preview Polish
Improve the lightweight preview destination without turning it into the live sheet.

Recommended contents:
- name
- class, subclass, and level summary
- species and background
- final ability scores
- feat summary
- spell summary
- inventory summary
- source and edition summary
- visible completion state context

### 6. Verification Matrix
Use representative build types to harden the implementation.

Recommended verification set:
- non-caster
- full prepared caster
- full spontaneous/known-style caster where supported by current metadata
- pact caster
- multiclass caster
- mixed-edition build

## Verification
- Supported casters validate with class-appropriate spell behavior.
- Review presentation clearly separates blockers, checklist items, notices, and overrides.
- Completion succeeds only when the validation contract allows it.
- Invalidating edits reliably regress completed builds to draft.
- Preview reflects the completed build coherently.
- The builder remains type-safe and locally testable through the existing app flow.

## Risks And Mitigations

### Risk 1: Spell Metadata Still Does Not Support Full Class-Specific Accuracy Everywhere
Mitigation:
- tighten supported cases first
- surface unsupported cases explicitly through checklist items or visible overrides

### Risk 2: Payload Refinements Create Migration Churn Inside The Builder
Mitigation:
- prefer minimal payload evolution
- add small, purposeful structure rather than broad rewrites

### Risk 3: Review Polish Regresses The Underlying Validation Contract
Mitigation:
- keep the issue model stable and improve presentation around it rather than inventing a second parallel review system

## Exit Criteria
Step 10 is complete when:
- spell rules are materially tighter for supported caster types
- review semantics are clearer and easier to trust
- completion and regression behavior are stable
- the preview is polished and informative
- representative manual verification scenarios pass
