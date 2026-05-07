# Step 26a: Class Cards And Class Detail Sheets - Implementation Plan

## Goal
Optimize the class-selection portion of the `Class & Spells` builder phase so beginners can make an informed rules-first class choice without relying on class-name chips.

This step covers only:
- class card picker
- selected class summary card foundation
- class detail bottom sheet
- `Add another class` picker behavior at the class level
- class change impact confirmation scaffold

This step does not implement subclass cards, feature-choice pickers, or spell tabs. Those are split into Steps 26b and 26c.

## Source Of Truth
Primary UX specification:
- `.opencode/brain/Class-and-Spells-Builder-UX-Decisions.md`

Related behavior specification:
- `.opencode/brain/Character-Builder-Behavior-Spec.md`

## User Review Required

> [!IMPORTANT]
> This step changes the Class portion of the builder from chips to rules-first cards and bottom-sheet details.
>
> It should preserve the current builder rules, save behavior, reconciliation behavior, and multiclass data model.
>
> No schema changes are expected.

## Current State
- `BuilderStepClass.tsx` currently renders selected allocations as cards but still uses chip-style class, subclass, and feature option controls.
- Class selection happens directly from class chips.
- Class details are not available inline before choosing.
- `CharacterBuilderScreen.tsx` renders Class and Spells together in the `class` wizard phase.
- Class reconciliation, level limits, subclass cleanup, and class-owned feature cleanup already exist in `classStep.ts`.

## Proposed Changes

### Shared Builder Sheet Foundation

#### [NEW] BuilderChoiceSheet shell
Create a reusable bottom-sheet-like shell for Class & Spells details and confirmations.

Expected behavior:
- large presentation, approximately 80-90% height on mobile
- explicit `Close`
- backdrop dismissal when no destructive/pending confirmation action is active
- scrollable body
- optional helper area above footer
- sticky footer with secondary action left and primary action right
- inline loading/error support in the body

Initial implementation may use React Native primitives already available in the repo. Do not add a new modal/bottom-sheet dependency unless there is a clear need.

#### [NEW] BuilderChoiceFooter or equivalent
Create reusable footer behavior for:
- primary action
- secondary action
- disabled primary helper text
- narrow-screen vertical stacking if needed

### Class Card Picker

#### [NEW] BuilderClassCard.tsx
Render compact class cards for unselected classes.

Card header:
- class name
- small source badge
- small edition badge
- small spellcasting/non-spellcasting badge

Mandatory facts:
- hit die
- primary abilities
- saving throw proficiencies
- armor proficiencies
- weapon proficiencies
- spellcasting status

Behavior:
- tapping the card opens the class detail sheet
- no direct select button on compact card
- no beginner hint sentence on the compact card
- no subclass unlock timing on the compact card
- missing metadata should show `Unknown` or `Not structured yet`
- no search/filtering in this first class-card implementation

### Class Detail Sheet

#### [NEW] BuilderClassDetailSheet.tsx
Use the shared sheet shell.

Content order:
1. Header with class name and badges.
2. Relevant warning area for legacy/support/selectability warnings only when needed.
3. Expanded `Rules Snapshot`.
4. Compact `Key Levels` preview.
5. Short class excerpt or summary if available.
6. Optional impact preview when changing/replacing an existing class.
7. Sticky footer actions.

Expanded rules snapshot:
- hit die
- primary abilities
- saving throw proficiencies
- armor proficiencies
- weapon proficiencies
- spellcasting status
- skills if available
- tools if available
- multiclass prerequisites if relevant
- subclass level note

Footer actions:
- unselected class: primary `Choose this class`, secondary `Open in Compendium`
- selected class: selected-state actions such as `Change Class`, `Remove`, or `Close` as appropriate

Do not add a beginner-explanation section in this pass.

### Selected Class Summary Foundation

#### [MODIFY] BuilderStepClass.tsx
Render selected class allocations as selected summary cards.

Required foundation behavior:
- each selected class appears as a selected summary section/card
- level controls use plus/minus stepper around `Level X`
- show current class name, level, source/edition, and local `OK` / `Need` / `Fix` state where available
- provide actions for details/change/remove where applicable
- show inline impact banner after level changes when reconciliation reports changes

Step 26a only needs the class-level selected summary foundation. Step 26b will fill in subclass and feature decision content inside each section.

### Add Another Class Behavior

#### [MODIFY] BuilderStepClass.tsx
When no class is selected:
- show class cards immediately
- do not show intro text above the class card list

After at least one class is selected:
- hide the class picker behind a secondary `Add another class` button
- place the button after selected class sections and before later spell content
- tapping the button reveals the class-card picker inline below the button
- exclude already-selected classes from the picker
- auto-close the picker after a class is added
- preserve chosen order for selected classes

### Class Change Impact Confirmation

#### [NEW] BuilderImpactConfirmationSheet.tsx or equivalent
Use the shared sheet shell for class change confirmations.

Behavior:
- use confirmation sheet, not native alert
- show affected summary, not every affected item
- examples: `Subclass will be cleared`, `2 feature choices need review`, `3 spells may be invalid`
- footer actions: `Cancel` and `Confirm`

In Step 26a, implement enough confirmation scaffolding for class replacement/removal if the UI exposes class change. Step 26b/26c may expand affected summaries once subclass/features/spells are redesigned.

## Data And Metadata Notes
Prefer existing `ContentEntity` fields and metadata. Do not change generated content in this step.

Likely metadata sources to inspect:
- `hitDie` / hit die metadata variants
- `primaryAbility`
- saving throw metadata
- armor/weapon/tool/skill proficiency metadata
- spellcasting metadata from current spell-review utilities
- class feature metadata for key-level preview
- source/edition fields on `ContentEntity`

If a field cannot be found reliably, display `Unknown` / `Not structured yet` rather than hiding it.

## Out Of Scope
- Subclass card implementation beyond placeholder/section anchor.
- Feature-choice picker implementation.
- Spell tab implementation.
- New recommendation engine or beginner playstyle quiz.
- New schema columns.
- Generated content regeneration.

## Verification Plan
- `npm run typecheck`
- Manual smoke checks:
  - empty Class & Spells phase shows class cards immediately
  - tapping a class card opens detail sheet without selecting
  - choosing from detail sheet adds selected class and closes sheet
  - selected class level stepper still respects total level cap
  - `Add another class` reveals inline class cards excluding selected classes
  - adding another class auto-closes picker and preserves selected order
  - class detail `Open in Compendium` navigates and can return to builder context
  - class change/remove confirmation appears when dependent choices may be affected
  - missing metadata appears as `Unknown` / `Not structured yet`

## Documentation Updates After Implementation
Update `.opencode/brain/Current-Development-State.md` after implementation with:
- completed Step 26a scope
- key files created/modified
- verification commands run and result
- remaining Step 26b/26c scope
