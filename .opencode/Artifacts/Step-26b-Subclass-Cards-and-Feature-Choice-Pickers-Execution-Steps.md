# Step 26b: Subclass Cards And Feature Choice Pickers - Execution Steps

## Phase 1: Dependency Check
- [ ] Confirm Step 26a selected class section foundation exists.
- [ ] Confirm shared bottom-sheet shell exists or create only if Step 26a did not complete it.
- [ ] Confirm subclass data and grant option data are still loaded by `useCharacterBuilderContent.ts`.
- [ ] Confirm current class reconciliation still produces subclass and feature-choice issues.

## Phase 2: Subclass Metadata Audit
- [ ] Inspect subclass `ContentEntity` metadata available to the builder.
- [ ] Identify fields available for parent class, source/edition, feature preview, and compendium route.
- [ ] Decide fallback display when key subclass features are unavailable.

## Phase 3: Subclass Cards
- [ ] Create reusable subclass card component.
- [ ] Render locked subclass cards before level 3 with name, badges, and `Unlocks at level 3`.
- [ ] Render unlocked subclass cards with name, badges, and selected status.
- [ ] Ensure locked and unlocked cards open subclass detail sheet on tap.
- [ ] Keep selected subclass active in place with selected badge.
- [ ] Place subclass card list inside the owning selected class section.

## Phase 4: Subclass Detail Sheet
- [ ] Create subclass detail sheet using shared sheet shell.
- [ ] Render feature preview first.
- [ ] Show key subclass features only.
- [ ] Add `Open in Compendium` secondary action.
- [ ] For locked subclass, disable Choose with helper `Available at class level 3`.
- [ ] For unlocked subclass, choose/change from sticky footer.
- [ ] Auto-close sheet after choosing/changing subclass.

## Phase 5: Subclass Impact Confirmation
- [ ] Add confirmation sheet for changing/removing selected subclass when dependent choices may be affected.
- [ ] Show affected summary categories/counts when available.
- [ ] Confirm action applies change and closes confirmation.
- [ ] Cancel action preserves current subclass.

## Phase 6: Feature Grouping
- [ ] Create feature-choice group component grouped by grant source.
- [ ] Render group header with source title, class/level context, and progress count.
- [ ] Keep completed groups expanded.
- [ ] Render feature-choice issues under the group header.
- [ ] Keep feature groups inside the owning selected class section.
- [ ] Order subclass and feature decisions by level; same-level subclass appears first.

## Phase 7: Feature Option Rows
- [ ] Create compact feature option row component.
- [ ] Render option name and selected status only.
- [ ] Omit source/edition badges from compact rows.
- [ ] Ensure tapping row opens detail sheet, not direct selection.
- [ ] Keep selected rows active inline.

## Phase 8: Feature Option Detail Sheet
- [ ] Create feature option detail sheet using shared sheet shell.
- [ ] Render option name and badges.
- [ ] Render rules/benefit text first.
- [ ] Render grant context after rules.
- [ ] Add sticky footer with `Choose option` / `Remove selection` and `Open in Compendium`.
- [ ] Disable `Choose option` when selection limit is reached.
- [ ] Show helper text explaining existing selections must be removed before choosing another option.
- [ ] Auto-close sheet after choosing/removing option.

## Phase 9: Unsupported Grants
- [ ] Create inline unsupported grant Fix card.
- [ ] Show Fix card when a grant has no structured options.
- [ ] Include explanation and `Open in Compendium` action.
- [ ] Do not hide unsupported grants.
- [ ] Do not add freeform manual note input.

## Phase 10: Verification
- [ ] Run `npm run typecheck`.
- [ ] Manually verify locked subclass preview and disabled Choose helper.
- [ ] Manually verify unlocked subclass selection and active state.
- [ ] Manually verify subclass change confirmation.
- [ ] Manually verify feature groups by grant source and progress counts.
- [ ] Manually verify feature detail selection/removal flow.
- [ ] Manually verify feature-choice limit prevention.
- [ ] Manually verify unsupported grant Fix card.
- [ ] Update `.opencode/brain/Current-Development-State.md` with Step 26b results.
