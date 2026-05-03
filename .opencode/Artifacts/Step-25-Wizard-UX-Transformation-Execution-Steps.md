# Step 25: Wizard UX Transformation - Execution Steps

## Phase 1: Controller & Logic Enhancements
- [ ] Update `useBuilderController.ts`:
    - [ ] Define the 6 logical phases (`class`, `origin`, `abilities`, `inventory`, `basics`, `review`) and map internal steps to them.
    - [ ] Add `activePhase` state and navigation helpers (`goToPhase`, `nextPhase`, `prevPhase`).
    - [ ] Implement `getPhaseStatus(phaseId)`:
        - `complete`: No issues associated with steps in this phase.
        - `error`: At least one 'blocker' issue in this phase.
        - `warning`: Only 'checklist' or 'notice' issues in this phase.
        - `incomplete`: No selections made yet (optional).

## Phase 2: Wizard UI Components
- [ ] Create `BuilderWizardStepper.tsx`:
    - [ ] Horizontal scrollable container for the 6 phases.
    - [ ] Active phase indicator (e.g., accent bottom bar).
    - [ ] Status icons for each phase (Check, Warning, Error).
- [ ] Create `BuilderWizardNavigation.tsx`:
    - [ ] Sticky bottom bar with "Back" and "Next" buttons.
    - [ ] Handle "Next" -> "Finish Build" transition on the last phase.
- [ ] Create `BuilderWizardSlide.tsx`:
    - [ ] Layout wrapper using `Animated.View` for horizontal transitions.
    - [ ] Logic to determine slide direction based on phase index change.

## Phase 3: Screen Orchestration
- [ ] Modify `CharacterBuilderScreen.tsx`:
    - [ ] Move minimalist header (Character Name, Save Status) to a thin fixed bar.
    - [ ] Replace sequential component rendering with a phase-based `switch`.
    - [ ] Integrate `BuilderWizardStepper` at the top and `BuilderWizardNavigation` at the bottom.
    - [ ] Ensure `BuilderSpellsSection` is correctly integrated into the `Class` phase or its own sub-phase if needed (decided: part of Class phase).

## Phase 4: Polish & Success Moment
- [ ] Implement Success Feedback:
    - [ ] Add a simple animation (e.g., Lottie or a burst effect) when "Finish Build" is clicked.
    - [ ] Ensure smooth transition to the character preview screen.

## Phase 5: Verification
- [ ] `npm run typecheck`.
- [ ] Manual smoke test: Complete a character from scratch using the new Wizard flow.
- [ ] Verify that step/phase state persists across app reloads.
