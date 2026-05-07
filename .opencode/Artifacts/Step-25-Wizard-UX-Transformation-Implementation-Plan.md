# Step 25: Wizard UX Transformation - Implementation Plan

The goal is to transform the monolithic builder into a premium, focused Wizard UX. This change establishes a spatial, logical flow while allowing free exploration and clear validation feedback.

## User Review Required

> [!IMPORTANT]
> **1. Navigation Strategy: Free Explorative**
> Users can jump to any step at any time via the Stepper. This supports the iterative nature of D&D character building.
> 
> **2. Logical Grouping: 6 Phases**
> We will consolidate the builder steps into 6 clear phases to reduce cognitive load:
> - **Class**: Core class allocation and spellcasting selection.
> - **Origin**: Species and Background choices.
> - **Abilities**: Ability score generation and ASI allocation.
> - **Inventory**: Equipment seeding and manual additions.
> - **Basics**: Character name and optional notes.
> - **Review**: Comprehensive summary and final completion.
>
> **3. Transitions: Horizontal Sliding**
> Moving between steps will use horizontal sliding animations to provide a spatial sense of progress.
>
> **4. Validation: Status Icons**
> The Stepper will display discrete icons (Check/Warning/Blocker) to communicate the status of each phase in real-time.

## Proposed Changes

## Implementation Status

Source implementation is complete as of 2026-05-07.

- `useBuilderController.ts` defines the six wizard phases, derives the active phase from `currentStep`, exposes Back/Next/direct phase navigation, and returns phase statuses as `OK`, `Need`, or `Fix`.
- Phase status policy: `Fix` means unresolved blockers/checklist items, `Need` means non-blocking notices only, and `OK` means no unresolved issues. Review aggregates all wizard issues rather than only issues attached to the `review` step.
- `CharacterBuilderScreen.tsx` renders only the active phase through a phase switch and wires the top stepper, slide wrapper, and bottom navigation.
- `BuilderWizardStepper.tsx`, `BuilderWizardNavigation.tsx`, and `BuilderWizardSlide.tsx` are implemented.
- The Review phase no longer has a second completion button; final completion is handled by the bottom wizard action.
- Completion shows animated success feedback before navigating to preview.

Smoke-test feedback addressed:

- Removed the `Start` status after manual review; the stepper now uses only `OK`, `Need`, and `Fix`.
- Fixed Review status so it reflects issues anywhere in the wizard.

Remaining acceptance work:

- Focused manual check: verify simplified status labels and Review aggregation after the follow-up change.
- Manual reload check: verify the active step/phase persists as expected across app reloads.

### Controller & Logic

#### [MODIFY] [useBuilderController.ts](file:///home/yggras/Development/dnd/dnd-builder/src/features/builder/hooks/useBuilderController.ts)
- Implement `getWizardPhases()` helper to map raw steps to the 6 logical phases.
- Add transition logic helpers (`goToNextPhase`, `goToPreviousPhase`).
- Implement status derivation for each phase by aggregating issues from the `review` payload.

### UI Components

#### [NEW] [BuilderWizardStepper.tsx](file:///home/yggras/Development/dnd/dnd-builder/src/features/builder/components/BuilderWizardStepper.tsx)
- A sticky horizontal stepper displaying the 6 logical phases.
- Shows labels and status icons (Check, Warning triangle, Error circle).
- Supports direct navigation clicks.

#### [NEW] [BuilderWizardNavigation.tsx](file:///home/yggras/Development/dnd/dnd-builder/src/features/builder/components/BuilderWizardNavigation.tsx)
- Bottom-fixed "Back" and "Next" buttons with slide-aware logic.
- "Next" transforms into "Finish Build" on the Review step if all conditions are met.

#### [NEW] [BuilderWizardSlide.tsx](file:///home/yggras/Development/dnd/dnd-builder/src/features/builder/components/BuilderWizardSlide.tsx)
- A container component using `Animated` or `Reanimated` to handle the horizontal entry/exit of step components.

### Screen Refactoring

#### [MODIFY] [CharacterBuilderScreen.tsx](file:///home/yggras/Development/dnd/dnd-builder/src/features/builder/screens/CharacterBuilderScreen.tsx)
- Replace sequential rendering with the animated Wizard container.
- Integrate `BuilderWizardStepper` and `BuilderWizardNavigation`.
- Simplify the header to be minimalist and let the content take center stage.

## Verification Plan

### Automated Tests
- `npm run typecheck` to ensure prop contracts remain valid.

### Manual Verification
- Verify navigation flow (Previous/Next/Jump).
- Verify status icon accuracy.
- Verify success animation on build completion.
