# Step 26a: Class Cards And Class Detail Sheets - Execution Steps

## Phase 1: Metadata Audit
- [ ] Inspect current class `ContentEntity` metadata used by the builder.
- [ ] Identify available fields for hit die, primary abilities, saving throws, armor proficiencies, weapon proficiencies, skills, tools, spellcasting status, and class features.
- [ ] Decide the exact formatter behavior for missing facts: `Unknown` or `Not structured yet`.
- [ ] Confirm compendium class route/linking data available from builder content entities.

## Phase 2: Shared Sheet Foundation
- [ ] Create a reusable builder bottom-sheet shell for Class & Spells choice details.
- [ ] Add explicit Close and backdrop dismissal.
- [ ] Add scrollable body with large 80-90% mobile presentation.
- [ ] Add sticky footer support with secondary action left and primary action right.
- [ ] Add disabled primary helper text area above footer.
- [ ] Add inline loading/error state support.

## Phase 3: Class Cards
- [ ] Create class card component for unselected classes.
- [ ] Render a concise class-card header with class name and minimal badges.
- [ ] Keep unselected class cards intentionally minimal rather than rendering rules facts on the card.
- [ ] Ensure tapping a class card opens details rather than selecting directly.
- [ ] Remove direct class-selection chips from the class picker path.

## Phase 4: Class Detail Sheet
- [ ] Create class detail sheet using the shared sheet shell.
- [ ] Render class header with name and badges.
- [ ] Render relevant legacy/support/selectability warning only when needed.
- [ ] Render expanded Rules Snapshot.
- [ ] Render compact Key Levels preview from available class feature metadata.
- [ ] Render short class excerpt/summary if available.
- [ ] Add `Choose this class` primary action for unselected classes.
- [ ] Add `Open in Compendium` secondary action.
- [ ] Auto-close sheet after choosing a class.
- [ ] Support selected-state `Remove` / `Close` actions for already selected classes where applicable.

## Phase 5: Selected Class Summary Foundation
- [ ] Replace selected class allocation presentation with selected summary card/section foundation.
- [ ] Keep plus/minus level stepper around `Level X`.
- [ ] Preserve total-level cap behavior.
- [ ] Preserve remove behavior and disabled remove behavior for the last class if still required.
- [ ] Show local class status and key class facts in the selected summary.
- [ ] Show impact banner after level changes when reconciliation reports cleared choices.

## Phase 6: Add Another Class Flow
- [ ] Show class cards directly when no class is selected.
- [ ] Remove intro copy above the empty class-card list.
- [ ] Add secondary `Add another class` button after selected class sections.
- [ ] Reveal inline class-card picker below the button.
- [ ] Exclude already-selected classes from the picker.
- [ ] Auto-close picker after adding another class.
- [ ] Preserve chosen order for selected class sections.

## Phase 7: Impact Confirmation Scaffold
- [ ] Add confirmation sheet pattern for class removal impact.
- [ ] Show affected summary counts/categories when available.
- [ ] Include `Cancel` and `Confirm` actions.
- [ ] Avoid native alert dialogs.

## Phase 8: Verification
- [ ] Run `npm run typecheck`.
- [ ] Manually verify empty class-card selection flow.
- [ ] Manually verify class detail sheet choose and close behavior.
- [ ] Manually verify `Open in Compendium` route and builder return context.
- [ ] Manually verify selected class level changes and total level cap.
- [ ] Manually verify `Add another class` inline picker behavior.
- [ ] Update `.opencode/brain/Current-Development-State.md` with Step 26a results.
