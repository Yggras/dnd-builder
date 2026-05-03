# Step 24 Builder Refactor and Orchestration Implementation Plan

## Goal
Refactor `CharacterBuilderScreen.tsx` into modular step components and a central orchestration hook to improve maintainability and fix stale-closure risks.

## User Review Required

> [!IMPORTANT]
> This refactor will not change the user-visible behavior or styling of the builder in this step. It is purely a maintainability and architecture pass.

## Proposed Changes

### [NEW] useBuilderController.ts
- Centralize mutation handlers and derived selectors.
- Enforce functional state updates.

### [NEW] BuilderStepComponents
- Extract Class, Species, Background, AbilityPoints, Inventory, Characteristics, Notes UI.

### [MODIFY] CharacterBuilderScreen.tsx
- Replace inline logic with controller and components.

## Verification Plan
- `npm run typecheck`
- Manual smoke checks for each section.
