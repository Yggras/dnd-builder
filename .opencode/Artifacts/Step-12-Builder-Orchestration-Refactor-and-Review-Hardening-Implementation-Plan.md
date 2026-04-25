# Step 12 Builder Orchestration Refactor and Review Hardening Implementation Plan

## Objective
Execute a narrow builder-maintenance slice that supports the existing Step 10 hardening goals while reducing the most immediate structural pressure inside the builder screen.

This step is intentionally not a broad architecture rewrite. It keeps the current builder payload, repository, and service contracts intact while extracting the minimum shared review/orchestration helpers needed to make correctness work safer.

## Confirmed Decisions
- This step builds directly on the shipped builder baseline and the existing Step 10 hardening work.
- The payload contract in `src/features/builder/types/index.ts` remains stable.
- Repository and service contracts remain unchanged.
- The main target is correctness-first hardening with only minimal structural refactor.
- Review clarity and preview parity are part of this slice.
- `CharacterBuilderScreen.tsx` should get smaller only where the extraction directly supports correctness and maintainability.

## Product Boundary

### Included In Step 12
- Extract shared builder review/entity-index helpers out of `CharacterBuilderScreen.tsx`.
- Remove duplicated builder entity aggregation logic from the screen.
- Tighten spellcasting profile derivation so subclass metadata augments class metadata instead of blindly replacing it.
- Improve builder review presentation by grouping issues more clearly by category.
- Tighten builder copy so the screen reflects the real guided builder rather than the earlier shell phase.
- Improve lightweight preview parity and readability without turning it into the live sheet.

### Explicitly Excluded From Step 12
- Builder payload redesign.
- Repository or SQLite schema changes.
- New builder steps.
- New compendium feature work.
- Campaign assignment or live-sheet work.
- Homebrew or custom content support.

## Feature Goals
- Reduce duplicated review/orchestration code in the builder screen.
- Make spellcasting behavior more trustworthy for subclass-backed and partially described caster profiles.
- Make review output easier to scan and reason about.
- Keep completed preview output aligned with the current completion contract.

## Architectural Approach

### 1. Shared Builder Review Helper
Create a small helper module for:
- building the aggregated entity index used by review/source-summary logic
- grouping builder issues by category for UI presentation

This keeps the screen from rebuilding the same ad hoc structures in multiple places.

### 2. Minimal Screen Refactor
Refactor `CharacterBuilderScreen.tsx` to:
- consume the shared review helper
- memoize the full builder entity index once
- render grouped review sections instead of a flat issue wall
- update builder header copy to match the actual product state

### 3. Spell Profile Hardening
Refine `src/features/builder/utils/spellReview.ts` so subclass spellcasting metadata can override specific class-profile fields while still inheriting class metadata for fields the subclass does not define.

This targets the current risk where a subclass with partial metadata can accidentally discard class-owned spellcasting behavior.

### 4. Preview Tightening
Improve `CharacterPreviewScreen.tsx` so the completion preview:
- reads more intentionally
- summarizes spell and inventory state more clearly
- keeps the completion gate visible

## Verification
- `CharacterBuilderScreen.tsx` no longer duplicates full entity-index construction in multiple places.
- Review issues are grouped clearly by category.
- Subclass spellcasting profiles no longer discard class metadata when the subclass only provides partial spell metadata.
- Preview remains gated to completed builds.
- `npm run typecheck` passes.

## Risks And Mitigations

### Risk 1: Small Refactor Accidentally Changes Builder Semantics
Mitigation:
- keep the payload contract unchanged
- extract only pure helpers
- avoid moving mutation ownership out of the screen in this slice

### Risk 2: Spell Profile Merging Introduces New False Positives
Mitigation:
- preserve existing progression logic
- only change profile composition and spell-set validation behavior where it is clearly safer

### Risk 3: Review UI Polish Creates A Parallel Validation Model
Mitigation:
- keep the current issue categories and summary contract
- improve presentation only

## Exit Criteria
Step 12 is complete when:
- a new shared builder review helper exists and is used by the screen
- duplicated entity-index construction is removed from `CharacterBuilderScreen.tsx`
- spell profile composition is tighter for subclass-backed casters
- builder review output is grouped more clearly
- preview copy/readability is improved while remaining completion-gated
- `npm run typecheck` passes
