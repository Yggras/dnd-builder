# Step 9f Spellcasting Review Completion and Preview Implementation Plan

## Objective
Implement the builder's deepest remaining systems: spellcasting, review/validation summary, completion state transitions, and lightweight post-completion preview.

This step is the launch gate for the full builder because the user explicitly requires deep spell support and meaningful completion semantics.

## Confirmed Decisions
- Spell support must be deep enough for strict known/prepared behavior.
- Overfill is not allowed by default.
- Multiclass spell rules are required from day one.
- Edge cases such as ritual/book/list behavior may use manual exceptions first.
- Review is mainly a validation summary and approval gate.
- Completion requires no unresolved blockers or checklist items.
- Overrides can intentionally resolve invalidity and still permit completion.
- Finishing the builder should open a lightweight preview.

## Product Boundary

### Included In Step 9f
- Spell step behavior and spell selection UI.
- Strict spell validation and multiclass spellcasting support.
- Review step summary logic.
- Draft/complete state transition logic.
- Completion regression behavior after later edits.
- Lightweight post-completion preview.

### Explicitly Excluded From Step 9f
- Campaign assignment.
- Live sheet/session state.
- DM dashboard integration.

## Feature Goals
- Spellcasting builds are truly supported.
- Review gives a trustworthy summary of what is complete, blocked, or overridden.
- Characters can become complete and later fall back to draft.
- Completion feels meaningful and ends in a lightweight preview.

## Architectural Approach

### 1. Spell Engine
Implement strict spell selection rules, including multiclass spellcasting support.

### 2. Review Model
Summarize blockers, checklist items, informational notices, and overrides.

### 3. Completion Engine
Implement:
- complete-state eligibility
- explicit completion action
- later regression to draft

### 4. Preview Surface
Build a lightweight post-completion preview destination.

## Verification
- Caster and multiclass-caster spell rules validate correctly.
- Overfill is blocked unless explicitly overridden.
- Review summarizes the build accurately.
- Completion succeeds only when allowed.
- Invalidating later edits can return the character to draft.

## Risks And Mitigations

### Risk 1: Spell Rules Are Still Too Shallow
Mitigation:
- treat spell depth as the launch gate for this phase and do not declare the builder complete without it

### Risk 2: Completion Logic Becomes Inconsistent With Overrides
Mitigation:
- keep override semantics anchored to the Step 9a validation contract and expose them clearly in review

## Exit Criteria
Step 9f is complete when:
- strict spell support works, including multiclass handling
- review summarizes validation state accurately
- draft and complete transitions work
- completion regression works after invalidating edits
- a lightweight post-completion preview exists
