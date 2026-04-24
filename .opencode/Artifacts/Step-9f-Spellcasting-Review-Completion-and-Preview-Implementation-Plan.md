# Step 9f Spellcasting Review Completion and Preview Implementation Plan

## Objective
Implement the builder's deepest remaining systems: spellcasting, review/validation summary, completion state transitions, and lightweight post-completion preview.

This step is the launch gate for the full builder because the user explicitly requires deep spell support and meaningful completion semantics.

## Confirmed Decisions
- Spell support must be deep enough for strict known/prepared behavior.
- Overfill is not allowed by default.
- Multiclass spell rules are required from day one.
- Edge cases such as ritual/book/list behavior may use manual exceptions first.
- Structured spell-to-class and spell-to-subclass linkage should come from builder-facing normalized content, not from UI-side text matching heuristics.
- Review is mainly a validation summary and approval gate.
- Completion requires no unresolved blockers or checklist items.
- Overrides can intentionally resolve invalidity and still permit completion.
- Overrides are allowed for unsupported-content gaps, edge-case spell situations, and explicit visible rule/count bypasses, but not for missing required steps or broken internal state.
- Finishing the builder should open a lightweight preview.
- The lightweight preview should summarize the completed build rather than becoming a full interactive sheet.
- Detailed spell selections, review state, and override summaries live in `character_builds.payload`; the resulting draft/complete state continues to surface through explicit progress columns.

## Product Boundary

### Included In Step 9f
- Builder-facing spell linkage import/normalization work required for trustworthy spell filtering and validation.
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
- Spell filtering and validation rely on structured builder-facing spell applicability metadata rather than fragile text matching.
- Spellcasting builds are truly supported.
- Review gives a trustworthy summary of what is complete, blocked, or overridden.
- Characters can become complete and later fall back to draft.
- Completion feels meaningful and ends in a lightweight preview.

## Architectural Approach

### 1. Spell Applicability Data Prerequisite
Import or derive trustworthy spell applicability metadata before spell UI work lands.

Responsibilities:
- ingest upstream spell source lookup data from the 5etools generated artifact set
- map upstream class and subclass spell applicability to canonical app IDs
- emit normalized spell metadata such as `classIds` and `subclassIds`
- replace app-side text-match spell filtering with structured metadata filtering

### 2. Spell Engine
Implement strict spell selection rules, including multiclass spellcasting support, on top of the structured applicability metadata.

Responsibilities:
- enforce known and prepared counts
- enforce no-overfill behavior by default
- support multiclass spellcasting progression rules
- surface manual exception handling only for agreed edge cases

### 3. Review Model
Summarize blockers, checklist items, informational notices, and overrides.

Persistence note:
- keep detailed review summaries and override records in `character_builds.payload`, while exposing the high-level completion state through explicit columns

Responsibilities:
- summarize override usage clearly and visibly
- keep override scope aligned to the agreed supported and unsupported cases
- summarize mixed-edition and source usage

### 4. Completion Engine
Implement:
- complete-state eligibility
- explicit completion action
- later regression to draft

### 5. Preview Surface
Build a lightweight post-completion preview destination.

Recommended contents:
- name
- class, subclass, and level summary
- species and background
- final ability scores
- selected feats
- spell summary if applicable
- inventory summary
- source and edition summary

## Verification
- Generated spell content carries structured `classIds` and `subclassIds` suitable for builder filtering.
- Caster and multiclass-caster spell rules validate correctly.
- Overfill is blocked unless explicitly overridden.
- Review summarizes the build accurately.
- Completion succeeds only when allowed.
- Invalidating later edits can return the character to draft.
- Roster-visible completion state remains queryable without parsing the full review payload.

## Risks And Mitigations

### Risk 1: Spell Rules Are Still Too Shallow
Mitigation:
- treat spell depth and spell applicability metadata quality as the launch gate for this phase and do not declare the builder complete without both

### Risk 2: Upstream Spell Lookup Mapping Does Not Line Up Cleanly With Canonical App IDs
Mitigation:
- resolve class and subclass applicability to canonical IDs during normalization rather than pushing name-based matching into app runtime

### Risk 3: Completion Logic Becomes Inconsistent With Overrides
Mitigation:
- keep override semantics anchored to the Step 9a validation contract and expose them clearly in review

## Exit Criteria
Step 9f is complete when:
- spell applicability metadata is normalized into builder-facing content and app-side spell filtering no longer depends on text matching
- strict spell support works, including multiclass handling
- review summarizes validation state accurately
- draft and complete transitions work
- completion regression works after invalidating edits
- a lightweight post-completion preview exists
