# Step 24 Builder Refactor and Orchestration Execution Steps

## Goal
Execute the refactor of `CharacterBuilderScreen.tsx`.

## Execution Checklist

### 1. Extract Builder Controller Hook
- [ ] Create `src/features/builder/hooks/useBuilderController.ts`.
- [ ] Move all mutation handlers from `CharacterBuilderScreen.tsx`.
- [ ] Move derived selectors (available classes, spell summary, etc.).
- [ ] Convert all handlers to functional updates `setDraftBuild(curr => ...)`.

### 2. Extract Step Components
- [ ] Create `src/features/builder/components/BuilderStepClass.tsx`.
- [ ] Create `src/features/builder/components/BuilderStepSpecies.tsx`.
- [ ] Create `src/features/builder/components/BuilderStepBackground.tsx`.
- [ ] Create `src/features/builder/components/BuilderStepAbilityPoints.tsx`.
- [ ] Create `src/features/builder/components/BuilderStepInventory.tsx`.
- [ ] Create `src/features/builder/components/BuilderStepCharacteristics.tsx`.
- [ ] Create `src/features/builder/components/BuilderStepNotes.tsx`.

### 3. Integrate into CharacterBuilderScreen
- [ ] Import `useBuilderController`.
- [ ] Replace inline UI with step components.
- [ ] Pass necessary props from controller to components.
- [ ] Clean up unused styles and imports.

### 4. Verification
- [ ] `npm run typecheck`.
- [ ] Verify name/characteristics still update.
- [ ] Verify class/subclass selection and level changes.
- [ ] Verify spell selection.
- [ ] Verify inventory seeding and adding items.
- [ ] Verify completion review and gating.
