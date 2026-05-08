# Step 27: Class Starting Proficiencies And ASI/Feat Choices - Implementation Plan

## Goal
Add first-class builder support for two missing class-feature categories that are currently visible in content metadata but not modeled in the builder:
- class starting skill proficiency choices, such as Sorcerer level 1 choosing 2 skills
- class Ability Score Improvement feature instances, including choosing either ability increases or a feat

This step covers:
- class-owned skill proficiency choice derivation
- class-owned skill choice state, reconciliation, and validation
- ASI feature instance derivation from class features
- per-ASI choice between ability improvement and feat
- ASI-point availability derived from chosen ASI instances rather than all ASI features automatically
- feat selection for ASI/Feat instances
- review/source summary inclusion for selected feats

## Source Of Truth
Current class metadata:
- `generated/5etools/classes/*.json`
- `metadata.startingProficiencies`
- `metadata.classFeatures`

Current builder class feature logic:
- `src/features/builder/types/index.ts`
- `src/features/builder/utils/classStep.ts`
- `src/features/builder/hooks/useBuilderController.ts`
- `src/features/builder/components/BuilderStepClass.tsx`

Current ASI ability logic:
- `src/features/builder/utils/originAndAbilities.ts`
- `src/features/builder/components/BuilderStepAbilityPoints.tsx`

Current content-backed feature choice logic:
- `src/shared/types/domain.ts`
- `src/features/builder/components/BuilderFeatureChoiceGroup.tsx`
- `src/features/builder/components/BuilderFeatureOptionDetailSheet.tsx`
- `src/features/builder/hooks/useCharacterBuilderContent.ts`

## User Review Required

> [!IMPORTANT]
> This step should not try to solve every class feature type.
>
> Implement only class starting skill choices and ASI/Feat feature instances. Tool/language choices, weapon mastery, expertise, fighting style changes beyond existing grants, and advanced prerequisite handling remain separate work unless they fall out trivially from the same model.

## Confirmed Decisions
- Starting class skill choices apply to every selected class allocation in the first pass.
- The builder does not yet model “first class” versus later multiclass proficiency rules.
- Duplicate proficiencies across class/background/species are allowed for now.
- Each ASI feature instance lets the user choose either ability increases or a feat.
- First-pass feat eligibility for ASI/Feat choices should use builder-selectable general feats.
- Feat prerequisite enforcement is deferred.
- The same ASI/Feat behavior should support 2024 and 2014 classes.
- No payload migration is required; current single-user development can discard old incomplete selections.

## Current State
- `ChoiceGrantKind` only supports `feat` and `optionalfeature`.
- Generated `choice_grants` are built from `featProgression` and `optionalfeatureProgression` only.
- Sorcerer XPHB level 1 skill choices are present in generated metadata at `metadata.startingProficiencies.skills[0].choose`.
- Sorcerer XPHB Metamagic works because it is generated from `optionalfeatureProgression` into `choice_grants`.
- Sorcerer XPHB subclass choice works through class allocation/subclass timing logic.
- Sorcerer XPHB ASI feature refs are present in `metadata.classFeatures`, but the builder does not model an ASI/Feat decision per feature instance.
- `countAvailableAsiPoints()` currently grants ASI points from all qualifying ASI feature refs automatically.
- `BuilderStepAbilityPoints.tsx` exposes raw `+` / `-` ASI point controls but not the ASI-vs-feat decision.

## Proposed Changes

### Class Feature Requirement Model

#### [NEW] class feature requirement utility
Add a builder utility that derives class-owned feature requirements from selected class allocations.

Requirement categories for this step:
- `class-skill-proficiency`: level 1 starting skill choices from `metadata.startingProficiencies.skills`
- `class-asi-feat`: feature refs named `Ability Score Improvement|...|<level>` at or below allocation level

Each derived requirement should include:
- stable requirement ID
- class allocation ID
- class ID
- class name
- source feature/ref label
- level
- kind
- required count/options where applicable

Use allocation IDs in requirement IDs so multiclass allocations remain independently selectable.

### Builder Payload State

#### [MODIFY] BuilderDraftPayload
Add structured state for class-owned non-content feature selections.

Proposed shape:

```ts
classFeatureSelections: {
  skillProficiencies: Array<{
    requirementId: string;
    classAllocationId: string;
    classId: string;
    selectedSkills: string[];
  }>;
  asiFeatChoices: Array<{
    requirementId: string;
    classAllocationId: string;
    classId: string;
    mode: 'asi' | 'feat' | null;
    selectedFeatId: string | null;
  }>;
}
```

Notes:
- Keep existing `classStep.featureChoices` for current `choice_grants` like Metamagic and Epic Boon.
- Do not extend `ChoiceGrantKind` for skills in this pass unless the implementation shows it is smaller than dedicated class feature state.
- Keep class starting proficiencies in the class step, not origin/ability steps.

### Class Skill Proficiency Choices

#### [NEW] skill choice derivation
Parse starting skill choices from class metadata.

Supported first-pass shape:

```json
{
  "choose": {
    "from": ["arcana", "deception", "insight"],
    "count": 2
  }
}
```

Behavior:
- render one choice group per derived requirement
- allow selecting up to `count` skills
- block completion until exactly `count` skills are selected
- remove invalid selections when class, allocation, or options change
- allow duplicates against background/species for now
- prevent duplicates inside the same requirement

Sorcerer expected behavior:
- level 1 Sorcerer XPHB shows a class-owned skill choice group
- choices are Arcana, Deception, Insight, Intimidation, Persuasion, Religion
- exactly 2 must be selected

### ASI/Feat Choice Instances

#### [NEW] ASI requirement derivation
Parse class feature refs named `Ability Score Improvement|...|<level>` from class metadata.

Behavior:
- each qualifying ASI feature becomes a separate requirement
- each requirement must choose one mode: `Ability Score Improvement` or `Feat`
- missing mode creates a checklist issue
- if mode is `asi`, the requirement contributes 2 ASI points
- if mode is `feat`, the requirement contributes no ASI points and requires one selected feat
- if level drops below a feature level, its selection is removed

### Ability Point Integration

#### [MODIFY] originAndAbilities.ts
Update ASI point counting so it is derived from selected ASI-mode class feature choices.

Behavior:
- `availableAsiPoints = selected ASI-mode feature instances * 2`
- existing `asi-overfill` validation remains
- base score validation remains
- origin ability package logic remains unchanged
- final score calculation continues to sum base + origin bonuses + ASI selections

### Feat Integration

#### [MODIFY] builder content loading
Provide ASI feat options to the class step.

First-pass option set:
- builder-selectable general feats

Behavior:
- no prerequisite enforcement in this step
- selected ASI feats are persisted in `classFeatureSelections.asiFeatChoices`
- selected ASI feats are included in source summary
- selected ASI feats appear in preview feat summary if practical

### Class Step UI

#### [MODIFY] BuilderStepClass.tsx or extracted components
Add class feature requirement cards inside each selected class section.

Skill choice card:
- title: `Skill Proficiencies`
- meta: `Level 1 • 0/2 selected`
- skill chips
- status `OK` / `Fix`

ASI/Feat card:
- title: `Ability Score Improvement`
- meta: `Level 4`
- mode chips: `Ability Increase`, `Feat`
- if `Ability Increase`, explain that 2 ASI points are available in Ability Points
- if `Feat`, show feat option rows or compact cards
- selected feat can be removed or changed

UI constraints:
- Keep cards compact and consistent with existing class/subclass/feature choice visual language.
- Do not add detail sheets for skill chips in this pass.
- Reuse feature option detail sheet for feat choice if easy; otherwise compact row selection is acceptable.

### Reconciliation And Review Issues

#### [MODIFY] classStep.ts
Add reconciliation for new class feature selection state.

Rules:
- remove selections for removed allocations/classes
- remove selections for requirement IDs that are no longer applicable
- filter skill selections to valid options and max count
- filter feat selections to valid feat option IDs
- issue checklist when required skills are incomplete
- issue checklist when ASI/Feat mode is missing
- issue checklist when feat mode lacks a selected feat
- keep existing `choice_grants` validation unchanged

### Preview And Source Summary

#### [MODIFY] spellReview.ts and CharacterPreviewScreen.tsx if needed
Include selected ASI feats in source summary and preview feat summary.

Source summary should include:
- species/background granted feats
- existing class `featureChoices`
- selected ASI/Feat feat IDs

## Out Of Scope
- Full first-class proficiency system across the whole character sheet.
- Duplicate proficiency replacement rules.
- First-class multiclass starting proficiency rules.
- Tool, language, armor, weapon, and weapon mastery choices.
- Expertise choices.
- Feat prerequisite enforcement.
- Homebrew or custom feature choices.
- Content regeneration, unless generated metadata is proven insufficient.

## Verification Plan
- `npm run typecheck`
- Manual smoke checks:
  - Sorcerer level 1 shows skill proficiency choices
  - Sorcerer level 1 requires exactly 2 skill choices before completion
  - selecting/removing skill chips updates status and review issues
  - raising Sorcerer to level 2 keeps Metamagic behavior working
  - raising Sorcerer to level 3 keeps subclass requirement working
  - raising Sorcerer to level 4 shows one ASI/Feat requirement
  - choosing Ability Increase gives 2 available ASI points
  - changing from Ability Increase to Feat removes available ASI points and requires a feat
  - choosing a feat satisfies the ASI/Feat requirement
  - lowering below level 4 removes the ASI/Feat requirement and invalid selections
  - removing the class clears its skill and ASI/Feat selections
  - selected ASI feats appear in source summary/preview if implemented in this pass

## Documentation Updates After Implementation
Update `.opencode/brain/Current-Development-State.md` after implementation with:
- completed Step 27 scope
- key files created/modified
- verification commands run and result
- remaining class feature gaps
