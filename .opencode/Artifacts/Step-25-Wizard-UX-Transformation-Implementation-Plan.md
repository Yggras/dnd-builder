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
