# Step 25: Wizard UX Transformation - Execution Steps

## Phase 1: Controller & Logic Enhancements
- [x] Update `useBuilderController.ts`:
    - [x] Define the 6 logical phases (`class`, `origin`, `abilities`, `inventory`, `basics`, `review`) and map internal steps to them.
    - [x] Add active phase derivation and navigation helpers (`goToPhase`, `goToNextPhase`, `goToPreviousPhase`).
    - [x] Implement `getPhaseStatus(phaseId)`:
        - `OK`: No unresolved issues associated with the phase.
        - `Fix`: At least one unresolved blocker or checklist issue in this phase.
        - `Need`: Only non-blocking notice issues in this phase.
        - `Review`: Aggregates all wizard issues, not only issues attached to the `review` step.

## Phase 2: Wizard UI Components
- [x] Create `BuilderWizardStepper.tsx`:
    - [x] Horizontal scrollable container for the 6 phases.
    - [x] Active phase indicator.
    - [x] Accessible status indicators for `OK`, `Need`, and `Fix` states.
- [x] Create `BuilderWizardNavigation.tsx`:
    - [x] Sticky bottom bar with "Back" and "Next" buttons.
    - [x] Handle "Next" -> "Finish Build" transition on the last phase.
- [x] Create `BuilderWizardSlide.tsx`:
    - [x] Layout wrapper using `Animated.View` for horizontal transitions.
    - [x] Logic to determine slide direction based on phase index change.

## Phase 3: Screen Orchestration
- [x] Modify `CharacterBuilderScreen.tsx`:
    - [x] Move minimalist header (Character Name, Save Status) to a compact top bar.
    - [x] Replace sequential component rendering with a phase-based `switch`.
    - [x] Integrate `BuilderWizardStepper` at the top and `BuilderWizardNavigation` at the bottom.
    - [x] Ensure `BuilderSpellsSection` is correctly integrated into the `Class` phase or its own sub-phase if needed (decided: part of Class phase).

## Phase 4: Polish & Success Moment
- [x] Implement Success Feedback:
    - [x] Add a simple animated success confirmation when "Finish Build" succeeds.
    - [x] Ensure smooth transition to the character preview screen.

## Phase 5: Verification
- [x] `npm run typecheck`.
- [x] Manual smoke test: Complete a character from scratch using the new Wizard flow.
- [ ] Focused follow-up check: Verify `OK` / `Need` / `Fix` status labels and Review issue aggregation after smoke-test feedback fix.
- [ ] Verify that step/phase state persists across app reloads.
