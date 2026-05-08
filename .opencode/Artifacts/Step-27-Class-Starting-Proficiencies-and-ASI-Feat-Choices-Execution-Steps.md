# Step 27: Class Starting Proficiencies And ASI/Feat Choices - Execution Steps

## Phase 1: Data Shape Audit
- [x] Inspect `metadata.startingProficiencies` for all builder-selectable primary classes.
- [x] Confirm first-pass supported skill choice shape: `{ choose: { from, count } }`.
- [x] Inspect `metadata.classFeatures` for `Ability Score Improvement|...|<level>` refs across 2014 and 2024 classes.
- [x] Confirm General feat category tags available through `contentService.listFeats('G')` or equivalent generated category.
- [x] Confirm selected ASI feats can be indexed in `allEntitiesById` for source summaries.

## Phase 2: Payload Model
- [x] Add class-owned feature selection state to `BuilderDraftPayload`.
- [x] Initialize new selection state in `createEmptyBuilderDraftPayload()`.
- [x] Keep existing `classStep.featureChoices` for `choice_grants` unchanged.
- [x] Use allocation-scoped IDs so multiclass selections do not collide.
- [x] Add defensive handling for missing new state because existing local drafts may omit it.

## Phase 3: Requirement Derivation Utility
- [x] Add utility to derive class feature requirements from payload allocations and class metadata.
- [x] Derive skill proficiency requirements from supported `startingProficiencies.skills` choice entries.
- [x] Derive ASI/Feat requirements from qualifying `Ability Score Improvement` class feature refs.
- [x] Include class allocation ID, class ID, class name, feature level, and stable requirement ID.
- [x] Add small formatting helpers for skill labels and requirement titles if needed.

## Phase 4: Reconciliation And Validation
- [x] Reconcile skill proficiency selections against derived requirements.
- [x] Reconcile ASI/Feat selections against derived requirements.
- [x] Remove selections tied to removed classes or level-gated requirements no longer applicable.
- [x] Filter skill selections to valid skill options and max count.
- [x] Filter selected feats to valid ASI feat options.
- [x] Add class-step checklist issues for incomplete skill choices.
- [x] Add class-step checklist issues for missing ASI/Feat mode.
- [x] Add class-step checklist issues for feat mode without selected feat.
- [x] Preserve existing subclass, multiclass, and `choice_grants` validation behavior.
- [x] Include cleared selection counts in class impact summary.

## Phase 5: Controller Actions
- [x] Add action to toggle a class skill proficiency choice.
- [x] Prevent duplicate skills inside the same skill requirement.
- [x] Add action to choose ASI/Feat mode for a requirement.
- [x] Add action to select or remove the feat for an ASI/Feat requirement.
- [x] Ensure changing ASI/Feat mode clears incompatible state.
- [x] Keep all actions as functional state updates where practical.

## Phase 6: Class Step UI
- [x] Pass derived requirements and new controller actions into `BuilderStepClass`.
- [x] Render class skill proficiency choice groups inside the owning selected class section.
- [x] Render skill chips with selected state and progress count.
- [x] Render ASI/Feat requirement cards inside the owning selected class section.
- [x] Render mode chips: `Ability Increase` and `Feat`.
- [x] Render concise helper text when `Ability Increase` mode contributes ASI points.
- [x] Render eligible General feat options when `Feat` mode is selected.
- [x] Show `OK` / `Fix` status based on requirement-specific issues.
- [x] Keep existing Metamagic/subclass/feature choice UI unchanged.

## Phase 7: Ability Points Integration
- [x] Replace automatic ASI point availability from class feature count with selected ASI-mode requirements.
- [x] Preserve existing ASI point spending controls.
- [x] Preserve `asi-overfill` validation.
- [x] Ensure switching an ASI/Feat requirement from Ability Increase to Feat can create overfill until points are removed, rather than silently deleting user ASI allocations.
- [x] Ensure switching back to Ability Increase restores available points.

## Phase 8: Feat Source And Preview Integration
- [x] Include selected ASI feat IDs in source summary derivation.
- [x] Include selected ASI feats in preview feat summary if straightforward.
- [x] Ensure selected feats remain content-backed IDs.
- [x] Do not enforce feat prerequisites in this step.

## Phase 9: Sorcerer Acceptance Pass
- [ ] Verify Sorcerer XPHB level 1 shows skill choices: Arcana, Deception, Insight, Intimidation, Persuasion, Religion.
- [ ] Verify Sorcerer XPHB level 1 requires exactly 2 selected skills.
- [ ] Verify Sorcerer XPHB level 2 Metamagic still appears and works.
- [ ] Verify Sorcerer XPHB level 3 subclass requirement still appears and works.
- [ ] Verify Sorcerer XPHB level 4 shows one ASI/Feat card.
- [ ] Verify choosing Ability Increase grants 2 ASI points.
- [ ] Verify choosing Feat requires selecting one General feat.
- [ ] Verify lowering Sorcerer below level 4 clears the ASI/Feat requirement.
- [ ] Verify removing Sorcerer clears skill and ASI/Feat selections.

## Phase 10: Verification And Documentation
- [x] Run `npm run typecheck`.
- [ ] Record any manual smoke checks completed.
- [x] Update `.opencode/brain/Current-Development-State.md` with Step 27 results.
- [x] Record remaining class feature gaps, especially multiclass proficiency rules, duplicate replacement rules, weapon mastery, tools, languages, expertise, and feat prerequisites.
