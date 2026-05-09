# Step 28: Feat-Granted Ability Score Bonuses And Choice Follow-Ups - Execution Steps

## Phase 1: Feat Metadata Audit
- [ ] Inspect normalized feat `metadata.ability` shapes used by builder-selectable feats.
- [ ] Confirm deterministic shape support, such as `Actor` granting `+1 CHA`.
- [ ] Confirm choice shape support, such as `Fey Touched` granting `+1 INT/WIS/CHA`.
- [ ] Confirm selected feat IDs are already available from species, background, class ASI feat mode, and class feature feat options.
- [ ] Confirm no generated-content changes are required for the initial supported feat set.

## Phase 2: Ability-Bonus State Model
- [ ] Extend ability-bonus state so feat-owned bonuses can live inside `abilityPointsStep.bonusSelections`.
- [ ] Add `feat` as a supported `BuilderAbilityBonusSelection.sourceType` or equivalent minimal representation.
- [ ] Use stable feat-source instance IDs so the same feat selected from different sources does not collide.
- [ ] Preserve backward-compatible handling for existing local drafts that omit any new fields.

## Phase 3: Ability Metadata Normalization
- [ ] Generalize the existing normalized ability-choice utility so it can parse feat `metadata.ability`.
- [ ] Preserve existing species/background ability parsing behavior.
- [ ] Support deterministic feat bonuses.
- [ ] Support open choice feat bonuses using the same package/choice model where practical.
- [ ] Treat empty or unsupported feat ability metadata as no derived requirement.

## Phase 4: Selected Feat Requirement Derivation
- [ ] Add a utility to derive feat-owned ability requirements from currently selected feats.
- [ ] Derive requirements from species-granted feats.
- [ ] Derive requirements from background-granted feats.
- [ ] Derive requirements from class ASI feat selections.
- [ ] Derive requirements from class feature feat selections when the selected option is a feat.
- [ ] Include feat ID, feat name, source context, stable source-instance ID, and normalized ability packages.

## Phase 5: Reconciliation And Validation
- [ ] Extend `reconcileOriginAndAbilitiesPayload()` to include selected feat ability requirements.
- [ ] Auto-apply deterministic feat bonuses.
- [ ] Preserve valid feat-owned ability selections when the same requirement remains active.
- [ ] Remove feat-owned selections when the feat or source instance changes.
- [ ] Add `ability-points` checklist issues when a selected feat still needs an ability bonus choice.
- [ ] Preserve existing base-score and ASI overfill validation behavior.
- [ ] Ensure final ability scores include feat-owned bonuses.

## Phase 6: Controller And Derived Data
- [ ] Pass derived feat ability requirements into the `Ability Points` step props.
- [ ] Reuse existing ability-selection controller actions where possible.
- [ ] Add minimal new controller helpers only if feat-owned requirement identity cannot be represented with the current origin-selection actions.
- [ ] Keep updates functional where practical.

## Phase 7: Ability Points UI
- [ ] Render feat-owned ability bonus sections in `BuilderStepAbilityPoints.tsx`.
- [ ] Show deterministic feat bonuses as read-only summary rows.
- [ ] Show open feat bonus choices as ability chips/buttons.
- [ ] Show feat name and source context in each feat-bonus section.
- [ ] Keep feat-owned ability choices in `Ability Points`, not in the feat picker.
- [ ] Surface unresolved feat bonus choices with clear helper text.

## Phase 8: Feat Selection Surface Text
- [ ] Add concise helper text near selected origin/class feats when they grant an ability bonus follow-up.
- [ ] Do not add the actual feat-owned ability choice UI to feat selection surfaces.
- [ ] Keep copy short and directional, for example `Ability bonus choices continue in Ability Points`.

## Phase 9: Preview And Review Consistency
- [ ] Verify final preview ability scores reflect feat-owned bonuses.
- [ ] Preserve existing feat-name summaries in preview and source summary derivation.
- [ ] Ensure unresolved feat-owned ability choices block completion through normal review issues.

## Phase 10: Acceptance Pass
- [ ] Verify selecting `Actor` auto-applies `+1 CHA`.
- [ ] Verify selecting `Fey Touched` creates an `Ability Points` follow-up choice.
- [ ] Verify `Fey Touched` blocks completion until one legal ability is selected.
- [ ] Verify changing the selected feat clears invalid feat-owned bonus selections.
- [ ] Verify removing the feat removes its bonus from final scores.
- [ ] Verify class ASI feat mode plus a feat-owned bonus behaves correctly in the `Ability Points` step.

## Phase 11: Verification And Documentation
- [ ] Run `npm run typecheck`.
- [ ] Record any manual smoke checks completed.
- [ ] Update `.opencode/brain/Current-Development-State.md` with Step 28 results.
- [ ] Record any remaining feat-automation gaps, especially feat-granted spells, feat prerequisites, and other non-ability feat follow-ups.
