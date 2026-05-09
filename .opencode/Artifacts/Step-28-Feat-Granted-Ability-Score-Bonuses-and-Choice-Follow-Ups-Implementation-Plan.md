# Step 28: Feat-Granted Ability Score Bonuses And Choice Follow-Ups - Implementation Plan

## Goal
Add first-class builder support for feat-owned ability score improvements so selected feats can:
- contribute deterministic ability bonuses such as `Actor` granting `+1 Charisma`
- require explicit ability-choice follow-up when the feat grants an open choice such as `Fey Touched` granting `+1 Intelligence`, `Wisdom`, or `Charisma`
- resolve those ability choices in the `Ability Points` phase rather than directly in the feat picker

This step covers:
- feat ability metadata derivation from normalized feat entities
- deterministic feat bonus application into final ability scores
- explicit ability-choice follow-up for selected feats with open bonus choices
- ability-step UI for resolving feat-owned bonus choices
- reconciliation and validation when selected feats change or become invalid
- concise builder text that tells the user a selected feat has an ability bonus or pending ability choice

## Source Of Truth
Feat metadata already present in generated content:
- `generated/5etools/feats/*.json`
- `metadata.ability`

Current feat selection and ability logic:
- `src/features/builder/types/index.ts`
- `src/features/builder/utils/originAndAbilities.ts`
- `src/features/builder/hooks/useBuilderController.ts`
- `src/features/builder/components/BuilderStepOrigin.tsx`
- `src/features/builder/components/BuilderStepClass.tsx`
- `src/features/builder/components/BuilderStepAbilityPoints.tsx`

Relevant selected-feat sources already modeled in payload:
- `speciesStep.grantedFeatSelections`
- `backgroundStep.grantedFeatSelections`
- `classStep.asiFeatChoices`
- `classStep.featureChoices`

## User Review Required

> [!IMPORTANT]
> This step resolves feat-owned ability bonuses in the `Ability Points` phase after the feat has been selected.
>
> Do not add a second feat-choice UI for these bonuses inside the feat picker itself.
>
> The feat picker may show concise helper text that the selected feat grants an ability bonus, but the actual ability assignment belongs in `Ability Points`.

## Confirmed Decisions
- Feat-owned ability bonus choices should be resolved in the `Ability Points` phase.
- Deterministic feat bonuses should auto-apply.
- Open feat bonus choices should block completion until resolved.
- The builder should reuse the existing normalized ability-choice model where practical instead of inventing a second parallel parser.
- This step should support at least the currently selected feat sources already represented in payload: species-granted feats, background-granted feats, class ASI feat selections, and class feature feat options when the selected option is a feat.
- Feat prerequisite enforcement remains deferred.
- Feat-granted spells, spellcasting ability choices, and deeper feat automation remain separate work.
- No generated content regeneration is expected in this step because the required feat ability metadata is already present.

## Current State
- Normalized feat entities already contain structured `metadata.ability` values.
- Example deterministic shape exists for feats like `Actor`: `[{ "cha": 1 }]`.
- Example choice shape exists for feats like `Fey Touched`: `[{ choose: { from: ['int', 'wis', 'cha'], amount: 1 } }]`.
- The builder currently stores only selected feat IDs for granted feats and ASI-feat mode.
- `BuilderAbilityBonusSelection.sourceType` only supports `species`, `background`, and `asi`.
- `reconcileOriginAndAbilitiesPayload()` currently applies species/background entity ability metadata plus manual ASI allocations, but it never derives ability bonuses from selected feat entities.
- `BuilderStepAbilityPoints.tsx` renders origin ability packages and ASI points only; it has no UI for feat-owned ability bonuses.
- `BuilderStepOrigin.tsx` and `BuilderStepClass.tsx` let the user choose feats, but they do not surface feat-owned ability bonus follow-up.

## Proposed Changes

### Feat Ability Requirement Model

#### [NEW] selected feat ability requirement derivation
Add a builder utility that derives ability bonus requirements from selected feat entities.

Supported source instances in this step:
- species-granted feat selections
- background-granted feat selections
- class ASI feat selections where mode is `feat`
- class feature feat selections where the chosen option entity is a feat

Each derived requirement should include:
- stable requirement/source instance ID
- feat ID
- feat name
- source context label
- normalized ability packages built from `metadata.ability`
- resolution step ownership: `ability-points`

Use source-instance IDs rather than raw feat IDs so repeatable feats or the same feat selected from multiple sources do not collide.

### Ability Metadata Normalization

#### [MODIFY] `normalizeAbilityChoices()` and helpers
Generalize the existing origin ability parser so it can normalize feat `metadata.ability` using the same package/choice model.

Supported first-pass feat shapes:

```json
[{ "cha": 1 }]
```

```json
[{ "choose": { "from": ["int", "wis", "cha"], "amount": 1 } }]
```

Behavior:
- deterministic feat bonuses become `deterministicBonuses`
- open feat choices become `choices`
- unsupported or empty ability metadata produces no requirement

### Builder Payload State

#### [MODIFY] `BuilderAbilityBonusSelection`
Extend ability bonus selections so feat-owned ability bonuses can be stored in the existing ability-bonus state.

Recommended direction:
- add `feat` as a supported `sourceType`
- use `sourceId` as a stable feat-source instance key, not just the feat ID

Notes:
- Do not add a separate top-level feat-bonus state if the existing `bonusSelections` model can represent feat-owned deterministic and chosen bonuses cleanly.
- Preserve existing origin and ASI behavior.

### Reconciliation And Validation

#### [MODIFY] `reconcileOriginAndAbilitiesPayload()`
Extend origin/ability reconciliation so selected feat entities contribute ability requirements and final-score bonuses.

Behavior:
- rebuild non-ASI bonus state from the currently selected species/background/feat sources
- auto-apply deterministic feat bonuses every pass
- preserve valid previously selected feat bonus choices when the same feat requirement remains active
- remove feat-owned selections when the selected feat, source instance, or available options change
- add `ability-points` checklist issues when a selected feat still needs an ability bonus choice
- keep base-score validation and existing ASI overfill validation unchanged

Issue examples:
- `Actor` selected: no checklist issue, `+1 CHA` auto-applies
- `Fey Touched` selected: unresolved until one of `INT`, `WIS`, or `CHA` is chosen

### Ability Points UI

#### [MODIFY] `BuilderStepAbilityPoints.tsx`
Render feat-owned ability bonus sections in the `Ability Points` phase.

Expected behavior:
- deterministic feat bonuses show as read-only summary rows
- open feat bonus choices show ability chips/buttons using the same interaction style as origin choices
- each section shows feat name plus source context
- unresolved feat bonus choices show clear helper text and checklist-state visibility

Example section directions:
- `Actor: grants +1 CHA`
- `Fey Touched: choose 1 ability for +1`
- `ASI Feat - Fey Touched: choose 1 ability for +1`

### Feat Selection Surface Text

#### [MODIFY] origin/class feat selection surfaces
Add concise text where feats are chosen so the user can tell when a feat has an ability bonus follow-up.

Accepted first-pass behavior:
- show selected feat name and short helper text such as `Ability bonus choices continue in Ability Points` when relevant
- do not move the actual choice UI out of `Ability Points`

Likely files:
- `src/features/builder/components/BuilderStepOrigin.tsx`
- `src/features/builder/components/BuilderStepClass.tsx`
- shared feat detail/row components only if the smallest implementation needs them

### Final Score And Preview Integration

#### [MODIFY] ability score calculation and preview behavior
Keep final scores driven by `abilityPointsStep.bonusSelections`, now including feat-owned bonuses.

Behavior:
- ability score preview and final completion continue to read from final `scores`
- existing feat-name summaries in preview can remain, but final ability totals must now include selected feat bonuses correctly

## Out Of Scope
- Feat prerequisite enforcement.
- Feat-granted spell selection or feat-granted spellcasting ability choices.
- Homebrew or custom feat authoring.
- Reworking the full feat picker UX into detail sheets if not required for the smallest correct fix.
- Generated content regeneration unless the current normalized feat metadata proves insufficient.

## Verification Plan
- `npm run typecheck`
- Manual smoke checks:
  - select a deterministic-bonus feat such as `Actor` and verify `+1 CHA` auto-applies to final ability scores
  - select a choice-bonus feat such as `Fey Touched` and verify completion is blocked until the ability choice is resolved
  - verify `Fey Touched` ability choice appears in `Ability Points`, not in the feat picker
  - verify changing from one feat to another clears invalid feat-owned bonus selections
  - verify removing the feat removes its ability bonus from final scores
  - verify class ASI feat mode respects feat-owned bonuses after the feat is selected
  - verify selected feat names still appear in preview/source summary as before

## Documentation Updates After Implementation
Update `.opencode/brain/Current-Development-State.md` after implementation with:
- completed Step 28 scope
- key files created/modified
- verification commands run and result
- any remaining feat-automation gaps
