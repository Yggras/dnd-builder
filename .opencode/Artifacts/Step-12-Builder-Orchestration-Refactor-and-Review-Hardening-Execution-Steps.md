# Step 12 Builder Orchestration Refactor and Review Hardening Execution Steps

## Goal
Apply a narrow builder-maintenance pass that improves correctness and review clarity while introducing only the smallest structural refactor needed to support that work.

## Execution Rules
- Keep the builder payload contract unchanged.
- Keep repository and service boundaries unchanged.
- Extract only pure helper logic in this step.
- Prioritize correctness and readability over broad reorganization.

## Step-By-Step Execution Sequence

### 1. Add Shared Review Helpers
- Create a builder review helper module.
- Move entity-index aggregation into the helper.
- Add category grouping helpers for builder issues.

Output:
- reusable review helper consumed by screen-level review logic.

### 2. Refactor Builder Screen Review/Source Logic
- Replace ad hoc full-entity aggregation with a memoized shared helper call.
- Reuse the helper in review source-summary logic.
- Keep existing autosave and mutation flow intact.

Output:
- smaller and less duplicated builder review/orchestration logic.

### 3. Tighten Spellcasting Profile Composition
- Refine spellcasting profile selection so subclass metadata augments class metadata.
- Avoid dropping class-owned spellcasting fields when subclass metadata is only partial.
- Tighten spell-level validation against the actively tracked spell sets.

Output:
- safer subclass-aware spellcasting behavior.

### 4. Improve Review Presentation
- Group issues by category.
- Keep the existing blocker/checklist/notice/override contract.
- Make the review section easier to scan.

Output:
- clearer review surface without a new validation model.

### 5. Tighten Preview Surface
- Update preview copy and summary rows.
- Preserve completion gating.
- Improve spell and inventory readability.

Output:
- cleaner lightweight completion preview.

### 6. Verify
- Run `npm run typecheck`.
- Fix any type regressions from the helper extraction or spell-review tightening.

Output:
- validated Step 12 baseline.

## Exit Criteria
Step 12 is complete when:
- the new artifacts exist
- the shared review helper is implemented and used
- builder review grouping is shipped
- spell profile composition is tightened
- preview is improved and still completion-gated
- `npm run typecheck` passes
