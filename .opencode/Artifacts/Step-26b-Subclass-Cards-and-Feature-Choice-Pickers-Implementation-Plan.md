# Step 26b: Subclass Cards And Feature Choice Pickers - Implementation Plan

## Goal
Optimize subclass and class-owned feature decisions inside the `Class & Spells` phase after Step 26a establishes class cards, selected class sections, and shared detail sheets.

This step covers:
- subclass cards inside selected class sections
- locked subclass preview behavior
- subclass detail bottom sheet
- feature-choice groups by grant source
- feature option detail bottom sheet
- inline subclass/feature issue placement
- unsupported feature grant presentation

This step does not rework spell tabs or spell detail sheets. Spell work is Step 26c.

## Source Of Truth
Primary UX specification:
- `.opencode/brain/Class-and-Spells-Builder-UX-Decisions.md`

Related behavior specification:
- `.opencode/brain/Character-Builder-Behavior-Spec.md`

Dependency:
- Step 26a shared sheet shell and selected class section foundation should exist before or during this work.

## User Review Required

> [!IMPORTANT]
> This step turns subclass and class-owned feature choices from chips into read-first cards/pickers.
>
> Subclasses and feature options should not be selected blindly from compact names. Tapping opens detail first, then selection happens from the detail sheet.

## Current State
- `BuilderStepClass.tsx` currently renders subclass options as chips inside each allocation card.
- Class-owned feature choices render as chip groups under a separate feature choice section.
- Feature choices are already reconciled and validated by `classStep.ts`.
- Choice grant data is already loaded through `useCharacterBuilderContent.ts`.
- Subclass options are already loaded by selected class ID.

## Proposed Changes

### Selected Class Section Decision Ordering

#### [MODIFY] BuilderStepClass.tsx and extracted selected class components
Inside each selected class section:
- order subclass and feature decisions by level
- if subclass and feature decisions occur at the same level, show subclass first
- keep issue messages near their owning decision
- do not add a top-level Class & Spells issue summary

For multiclass builds:
- each selected class section owns its own subclass cards and class-owned feature choices
- classes remain stacked in chosen order from Step 26a

### Subclass Cards

#### [NEW] BuilderSubclassCard.tsx
Render subclass cards inside the selected class section.

Locked subclass card:
- subclass name
- source badge
- edition badge
- `Unlocks at level 3`
- no extra rules facts

Unlocked subclass card:
- subclass name
- source badge
- edition badge
- selected status when selected
- no dense rules snapshot on card

Behavior:
- tapping locked or unlocked cards opens subclass detail bottom sheet
- locked cards allow reading details but not selecting
- selected subclass remains visible in place with active styling and selected badge

### Subclass Detail Sheet

#### [NEW] BuilderSubclassDetailSheet.tsx
Use the shared sheet shell from Step 26a.

Content behavior:
- first content focus is feature preview
- show key subclass features only
- full subclass progression remains in compendium
- no beginner-explanation section
- include secondary `Open in Compendium`

Footer behavior:
- locked subclass: disabled primary choose action with helper `Available at class level 3`
- unlocked unselected subclass: primary `Choose subclass`
- selected subclass: primary selected-state action such as `Change subclass`, `Remove subclass`, or `Close` as appropriate

Changing selected subclass:
- use impact confirmation sheet if subclass-dependent feature choices or spells may be cleared or invalidated
- show affected summary, not every item

### Feature Choice Groups

#### [NEW] BuilderFeatureChoiceGroup.tsx
Group class-owned feature choices by grant source.

Group header:
- grant/source feature title
- class/level context where available
- progress count, e.g. `Choose 1 of 6` or `1/2 selected`
- local `OK` / `Need` / `Fix` state when useful

Group behavior:
- completed groups stay expanded
- selected options remain inline with active styling and selected badge
- no search/filtering in first implementation

### Feature Option Rows

#### [NEW] BuilderFeatureOptionRow.tsx
Compact row content:
- option name
- selected badge/state when selected
- no source/edition badges in compact row

Behavior:
- tapping opens feature option detail bottom sheet
- no direct selection from compact row

### Feature Option Detail Sheet

#### [NEW] BuilderFeatureOptionDetailSheet.tsx
Use shared sheet shell.

Content order:
1. Option name and badges.
2. Rules text or benefit text first.
3. Grant context after rules, e.g. `This satisfies Fighting Style, choose 1`.
4. Sticky footer actions.

Footer behavior:
- unselected option: primary `Choose option`
- selected option: primary `Remove selection`
- secondary `Open in Compendium`

Limit behavior:
- prevent selecting beyond allowed count
- if group is full, disable `Choose option`
- helper text should explain which existing selections must be removed first
- do not allow over-selection just to create a later `Fix` state

### Unsupported Feature Grants

#### [NEW] UnsupportedFeatureGrantCard or equivalent
When a grant has no structured options:
- show inline `Fix` card under the grant header
- explain no structured builder options exist yet
- include `Open in Compendium`
- reserve future override path for when explicit override workflow exists
- do not hide unsupported grants
- do not use freeform notes as first-pass solution

### Inline Issue Placement
Subclass and feature issues should render near the owning section:
- subclass-required issues near that class's subclass card list
- feature-selection issues under the relevant feature-choice group header
- unsupported grant issues in the unsupported grant card

## Data And Metadata Notes
Prefer existing `ContentEntity`, `ChoiceGrant`, and grant option metadata.

Likely data sources:
- subclass `ContentEntity` fields and `metadata.featureIdsByLevel` / feature metadata variants if available
- `ChoiceGrant.sourceName`, `ChoiceGrant.atLevel`, `ChoiceGrant.count`, `ChoiceGrant.chooseKind`, `ChoiceGrant.categoryFilter`
- grant options already resolved in `grantOptionsByGrantId`
- option `renderPayload`, `summary`, `text`, or metadata for rules/benefit text

If rich detail is unavailable, show available name/source/edition and `Open in Compendium`.

## Out Of Scope
- Spell tabs and spell detail sheets.
- New override workflow implementation.
- New generated content fields or regeneration.
- Search/filtering inside feature-choice groups.
- Strong recommendations or beginner playstyle labels.

## Verification Plan
- `npm run typecheck`
- Manual smoke checks:
  - locked subclass cards appear before level 3 and open read-only detail sheet
  - unlocked subclass cards can be selected from detail sheet
  - selected subclass stays active in place
  - subclass issue appears near subclass cards
  - feature choices group by grant source with progress count
  - feature option tap opens detail sheet before selection
  - feature option limit prevents over-selection with helper text
  - unsupported grants show inline Fix card with compendium access
  - changing subclass prompts impact confirmation when dependent choices may be affected

## Documentation Updates After Implementation
Update `.opencode/brain/Current-Development-State.md` after implementation with:
- completed Step 26b scope
- key files created/modified
- verification commands run and result
- remaining Step 26c scope
