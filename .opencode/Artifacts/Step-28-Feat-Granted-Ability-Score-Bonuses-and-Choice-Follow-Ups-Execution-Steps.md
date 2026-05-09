# Step 28: Feat-Granted Ability Score Bonuses And Choice Follow-Ups - Execution Steps

## Phase 1: Feat Metadata Audit
- [x] Inspect normalized feat `metadata.ability` shapes used by builder-selectable feats.
- [x] Confirm deterministic shape support, such as `Actor` granting `+1 CHA`.
- [x] Confirm choice shape support, such as `Fey Touched` granting `+1 INT/WIS/CHA`.
- [x] Confirm selected feat IDs are already available from species, background, class ASI feat mode, and class feature feat options.
- [x] Confirm no generated-content changes are required for the initial supported feat set.

## Phase 2: Ability-Bonus State Model
- [x] Extend ability-bonus state so feat-owned bonuses can live inside `abilityPointsStep.bonusSelections`.
- [x] Add `feat` as a supported `BuilderAbilityBonusSelection.sourceType` or equivalent minimal representation.
- [x] Use stable feat-source instance IDs so the same feat selected from different sources does not collide.
- [x] Preserve backward-compatible handling for existing local drafts that omit any new fields.

## Phase 3: Ability Metadata Normalization
- [x] Generalize the existing normalized ability-choice utility so it can parse feat `metadata.ability`.
- [x] Preserve existing species/background ability parsing behavior.
- [x] Support deterministic feat bonuses.
- [x] Support open choice feat bonuses using the same package/choice model where practical.
- [x] Treat empty or unsupported feat ability metadata as no derived requirement.

## Phase 4: Selected Feat Requirement Derivation
- [x] Add a utility to derive feat-owned ability requirements from currently selected feats.
- [x] Derive requirements from species-granted feats.
- [x] Derive requirements from background-granted feats.
- [x] Derive requirements from class ASI feat selections.
- [x] Derive requirements from class feature feat selections when the selected option is a feat.
- [x] Include feat ID, feat name, source context, stable source-instance ID, and normalized ability packages.

## Phase 5: Reconciliation And Validation
- [x] Extend `reconcileOriginAndAbilitiesPayload()` to include selected feat ability requirements.
- [x] Auto-apply deterministic feat bonuses.
- [x] Preserve valid feat-owned ability selections when the same requirement remains active.
- [x] Remove feat-owned selections when the feat or source instance changes.
- [x] Add `ability-points` checklist issues when a selected feat still needs an ability bonus choice.
- [x] Preserve existing base-score and ASI overfill validation behavior.
- [x] Ensure final ability scores include feat-owned bonuses.

## Phase 6: Controller And Derived Data
- [x] Pass derived feat ability requirements into the `Ability Points` step props.
- [x] Reuse existing ability-selection controller actions where possible.
- [x] Add minimal new controller helpers only if feat-owned requirement identity cannot be represented with the current origin-selection actions.
- [x] Keep updates functional where practical.

## Phase 7: Ability Points UI
- [x] Render feat-owned ability bonus sections in `BuilderStepAbilityPoints.tsx`.
- [x] Show deterministic feat bonuses as read-only summary rows.
- [x] Show open feat bonus choices as ability chips/buttons.
- [x] Show feat name and source context in each feat-bonus section.
- [x] Keep feat-owned ability choices in `Ability Points`, not in the feat picker.
- [x] Surface unresolved feat bonus choices with clear helper text.

## Phase 8: Feat Selection Surface Text
- [x] Add concise helper text near selected origin/class feats when they grant an ability bonus follow-up.
- [x] Do not add the actual feat-owned ability choice UI to feat selection surfaces.
- [x] Keep copy short and directional, for example `Ability bonus choices continue in Ability Points`.

## Phase 9: Preview And Review Consistency
- [x] Verify final preview ability scores reflect feat-owned bonuses.
- [x] Preserve existing feat-name summaries in preview and source summary derivation.
- [x] Ensure unresolved feat-owned ability choices block completion through normal review issues.

## Phase 10: Acceptance Pass
- [ ] Verify selecting `Actor` auto-applies `+1 CHA`.
- [ ] Verify selecting `Fey Touched` creates an `Ability Points` follow-up choice.
- [ ] Verify `Fey Touched` blocks completion until one legal ability is selected.
- [ ] Verify changing the selected feat clears invalid feat-owned bonus selections.
- [ ] Verify removing the feat removes its bonus from final scores.
- [ ] Verify class ASI feat mode plus a feat-owned bonus behaves correctly in the `Ability Points` step.

## Phase 11: Verification And Documentation
- [x] Run `npm run typecheck`.
- [ ] Record any manual smoke checks completed.
- [x] Update `.opencode/brain/Current-Development-State.md` with Step 28 results.
- [ ] Record any remaining feat-automation gaps, especially feat-granted spells, feat prerequisites, and other non-ability feat follow-ups.
