# Step 9f Spellcasting Review Completion and Preview Execution Steps

## Goal
Execute the final builder launch phase so spellcasting, review, completion, and lightweight post-build preview all work together as a trustworthy end-to-end creation flow.

## Execution Rules
- Do not weaken spell rules just to ship the builder faster.
- Do not rely on text matching to determine spell applicability when structured metadata can be imported or normalized instead.
- Keep review focused on validation summary and completion.
- Do not allow unresolved blockers or checklist items to slip through completion.
- Let explicit overrides resolve supported cases intentionally and visibly, but do not use them to bypass missing required steps or broken internal state.

## Step-By-Step Execution Sequence

### 1. Confirm The Spell And Completion Contract
- Confirm strict known/prepared counts.
- Confirm multiclass spell rules are required.
- Confirm overrides may resolve invalidity.
- Confirm completion opens a lightweight preview.

Output:
- stable spell and completion contract.

### 2. Implement The Spell Applicability Data Prerequisite
- Import upstream spell source lookup data.
- Normalize structured `classIds` and `subclassIds` into spell metadata.
- Replace app-side spell filtering heuristics with structured metadata filtering.

Output:
- trustworthy builder-facing spell applicability data.

### 3. Implement Spell Support
- Add spell step UI.
- Add strict counts.
- Add multiclass spellcasting behavior.
- Add manual exception handling for supported edge cases only.
- Keep detailed spell-selection state in `character_builds.payload`.

Output:
- real spellcasting support.

### 4. Implement Review Summary
- Summarize blockers.
- Summarize checklist items.
- Summarize informational notices.
- Summarize overrides and mixed-edition state.
- Keep detailed review output in `character_builds.payload`.

Output:
- trustworthy review step.

### 5. Implement Completion State Transitions
- Add explicit completion action.
- Mark eligible builds complete.
- Regress complete builds to draft after invalidating edits.
- Update explicit builder progress columns when completion state changes.

Output:
- working draft/complete lifecycle.

### 6. Add Lightweight Preview
- Open a lightweight preview after successful completion.
- Keep it summary-oriented rather than turning it into a full live sheet.
- Include class, origin, ability, feat, spell, inventory, and source summary information.

Output:
- meaningful post-completion destination.

### 7. Verify End-To-End Builder Behavior
- Verify spell filtering works from structured metadata rather than text matching.
- Build at least one non-caster.
- Build at least one spellcaster.
- Build at least one multiclass spellcaster.
- Validate override behavior.
- Validate completion and regression behavior.

Output:
- validated full-builder baseline.

## Exit Criteria
Step 9f is complete when:
- strict spell support works
- review is trustworthy
- completion and regression work
- lightweight preview exists
- end-to-end builder verification passes
