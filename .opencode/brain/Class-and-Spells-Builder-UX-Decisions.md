# Class And Spells Builder UX Decisions

## Purpose
This document records the agreed UX direction for optimizing the `Class & Spells` phase of the character builder.

The target user can be completely new to D&D. The UI must not assume that a class, subclass, feature, or spell name is enough context to choose well. Builder choices should expose enough rules information to support informed decisions while still linking to the compendium for full reference reading.

## High-Level Direction
- The `Class & Spells` phase should be an informational, rules-first builder surface.
- The primary picker UI should use full-width cards rather than chips for major choices.
- Cards should remain concise by default, with detail available through bottom sheets.
- The compendium remains the full rules/reference destination and should be available as a secondary action from builder details.
- The phase should stay neutral and informational for now, not opinionated or recommendation-driven.

## Agreed Decisions

### Entry Experience
- The first thing a beginner sees should be class cards first.
- Do not start with a fantasy questionnaire or a long explanation-first screen.
- When no class is selected, show class cards immediately with no intro text above them.

### Overall Phase Layout
- After at least one class is selected, the phase should render selected class sections first.
- Show the spell subpanel after all selected class sections.
- Do not add a sticky summary bar in the first implementation.
- Use natural vertical scrolling with clear section headers on mobile.
- Do not use accordions by default in the first implementation.
- Do not move large sections into nested screens in the first implementation.

Expected phase order with selected classes:
1. Selected class sections.
2. Secondary `Add another class` control.
3. Inline class-card picker when `Add another class` is active.
4. Spell subpanel after all class sections.

Inline issue placement:
- `Fix` / `Need` messages should appear near their owning section or card only.
- Do not add a top-level Class & Spells issue summary in the first implementation.

### Class Cards
- Class cards should stay intentionally minimal.
- Cards should be minimal and should not become dense beginner essays.
- Tapping a class card should open a detail bottom sheet.
- The card itself only needs to be enough to scan the class list; it is not expected to explain the class.
- Compact class cards should not include plain-language beginner hint sentences.
- Class cards should not show subclass unlock timing because 2024 subclasses are always level 3.
- No search or filtering is needed for class cards in the first implementation because the class list is small.
- Class cards do not need an explicit `View details` hint; tapping the card consistently opens details.
- Do not expand unselected class cards into mini fact sheets.

Expected class-card header:
- class name
- small edition badge when helpful

### Class Detail
- Class details should open in an in-builder bottom sheet.
- The bottom sheet should include a primary `Choose this class` action.
- The bottom sheet should include a secondary `Open in Compendium` action.
- Detail copy should be rules-first rather than beginner-explanation-first.
- Do not include a beginner-explanation section in the first pass.
- Class selection should happen from the detail bottom sheet, not directly from the compact card.
- The bottom-sheet header should emphasize class name plus badges.
- The first content section after the header should be `Rules Snapshot`.
- Source/edition/support warnings should appear only when relevant.
- Missing structured metadata should appear inline as `Unknown` or `Not structured yet`.
- If the detail sheet is opened for an already selected class, the primary actions should change to selected-state actions such as `Remove` or `Close` instead of showing the normal `Choose this class` CTA.
- On mobile, the bottom sheet should be large, roughly 80-90% height, with internal scrolling.

Expected class-detail header:
- class name
- source badge
- edition badge
- spellcasting/non-spellcasting badge

Expected expanded rules snapshot:
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

Expected class-detail content order:
1. Header with class name and badges.
2. Relevant warning area for legacy/support/selectability warnings only when needed.
3. Expanded `Rules Snapshot`.
4. Compact `Key Levels` preview.
5. Short class excerpt or summary if available.
6. Sticky footer actions.

Expected key-level preview:
- show only compact, decision-relevant level highlights
- include level 1 class-defining features where available
- include level 3 subclass timing
- defer full level-by-level progression to the compendium

Expected sticky footer actions:
- primary: `Choose this class` for unselected classes
- primary selected-state actions: `Remove` or `Close` as appropriate
- secondary: `Open in Compendium`

### Selected Class Summary
- Once a class is selected, it should appear as a selected summary card at the top of the phase.
- The selected summary card should show current level controls, current `OK` / `Need` / `Fix` state, and actions for details/remove where applicable.
- Level controls should use a plus/minus stepper around `Level X`.
- Level controls should include a short explanation of total level constraints and the impact of changing level.
- When a level change introduces new obligations or unlocks, show an inline change banner near the selected class summary card.
- Example change banner content: `Subclass choice now required` or `2 feature choices unlocked`.
- Multiclass builds should use stacked selected class sections.
- Selected class sections should stay in the order the user added them.
- The first selected class is treated as primary by position.
- Each selected class section owns its subclass and class-owned feature choices.

Decision ordering inside each selected class section:
- order subclass and feature decisions by level
- if subclass and feature choices occur at the same level, show subclass first, then class-owned feature choices
- show subclass/feature issues near the affected decision, not in a separate top summary

### Multiclassing
- Multiclassing should unlock after the first class has been selected.
- Do not show multiclass allocation as the first visible decision for a blank build.
- When no class is selected, show class cards directly.
- Once a first class exists, hide the class card picker behind an `Add another class` action.
- Do not show a multiclass warning or long explanation before opening the class-card picker for an additional class.
- Multiclass validation can still surface inline `Fix` messages when prerequisites or total-level rules are not satisfied.
- The `Add another class` control should appear as a secondary button after selected class sections and before the spell subpanel.
- Tapping `Add another class` should reveal the class-card picker inline below the button.
- The multiclass picker should exclude already selected classes.
- The picker should auto-close after a class is added and the new selected class section should appear in the stack.

### Subclasses
- Subclass choices should use cards, not chips.
- Once a class reaches its subclass level, show subclass cards as selectable choices.
- Before a subclass is unlocked, show locked preview cards.
- Locked subclass preview cards should communicate the unlock level and allow reading details, but not allow selection yet.
- Subclass cards/details should explain enough to compare subclass rules impact without requiring immediate compendium navigation.
- The selected class summary should show a subclass preview section immediately, even before level 3.
- The subclass preview section should be visibly locked until level 3 but still allow users to read subclass details.
- Subclass cards should live inside the selected class summary/section so the relationship to that class is clear.
- In multiclass builds, each selected class should own its own subclass cards and subclass issues.
- Subclass-related `Fix` messages should appear near that class's subclass card list.

Expected locked subclass card:
- subclass name
- source badge
- edition badge
- `Unlocks at level 3`
- no extra rules facts on the locked card

Locked subclass interaction:
- tapping a locked subclass card opens a bottom sheet
- the bottom sheet includes a disabled choose button
- disabled choose helper text should explain `Available at class level 3`
- `Open in Compendium` remains enabled

Expected unlocked subclass card:
- subclass name
- source badge
- edition badge
- selected status when selected
- no dense rules snapshot on the card

Unlocked subclass interaction:
- tapping an unlocked subclass card opens a subclass detail bottom sheet
- selection happens from the bottom sheet
- the selected subclass remains visible in place with active styling and a selected badge

Expected subclass detail sheet:
- open as an in-builder bottom sheet
- first content focus should be feature preview, not generic descriptive text
- show key subclass features only
- full subclass progression stays in the compendium
- no beginner-explanation section in this pass
- include `Choose` or `Change` action as appropriate
- include secondary `Open in Compendium` action

Changing subclass:
- changing a selected subclass should require impact confirmation when subclass-dependent feature choices or spells may be cleared or invalidated

### Class-Owned Feature Choices
- Class-owned feature choices such as fighting styles, invocations, maneuvers, or similar options should use a compact picker.
- Tapping a feature option should open details first.
- Selection should happen from the detail view, not blind-tapping the compact option name.
- Feature details should also provide access to the compendium when full reference text is needed.
- Feature-choice groups should be grouped by grant source.
- Example group labels: `Fighting Style, level 1`, `Eldritch Invocations, level 2`.
- Feature-choice group headers should show title plus progress, such as `Choose 1 of 6` or `1/2 selected`.
- Compact option rows should show option name and selected status only.
- Compact option rows should not show source/edition badges; badges belong in the detail sheet.
- Tapping a feature option opens a feature detail bottom sheet.
- Do not select feature options directly from the compact list.
- Feature option lists do not need search/filtering in the first implementation.
- Completed feature-choice groups should stay expanded rather than auto-collapsing.
- Selected feature options should remain inline in the option list with active styling and a selected badge.
- Feature-choice `Fix` messages should appear under the group header before the options.

Expected feature-choice group header:
- grant/source feature title
- class/level context where available
- progress count
- local `OK` / `Need` / `Fix` state when useful

Expected compact feature option row:
- option name
- selected badge/state when selected
- no source/edition badges in the compact row

Expected feature option detail sheet:
- option name
- source badge
- edition badge
- rules text or benefit text first
- grant context after rules, such as `This satisfies Fighting Style, choose 1`
- sticky footer actions

Expected feature detail sticky footer:
- primary: `Choose option` when unselected
- primary: `Remove selection` when selected
- secondary: `Open in Compendium`

Feature-choice limits:
- prevent selecting beyond the allowed count
- when a group is full, disable `Choose option`
- explain which existing selections must be removed before choosing another option
- do not allow over-selection just to create a later `Fix` state

Unsupported feature grants:
- show an inline `Fix` card when a grant has no structured options
- explain that no structured builder options exist yet
- include `Open in Compendium`
- reserve a future override path for when the override workflow exists
- do not hide unsupported grants
- do not use a freeform manual note as the first-pass solution

### Spell Placement
- Spells should remain in the same `Class & Spells` phase.
- Spells should render as a distinct subpanel within the phase.
- The spell subpanel should only become substantial when the selected class/subclass actually requires spell choices.
- Non-casters should see a compact explanation that the current build does not require spell selection.
- The spell subpanel should appear after all selected class sections, not inside individual class sections.
- This keeps multiclass spellcasting behavior centralized because spell rules can depend on the whole build.

### Spell List Organization
- Spell selection should use task-based tabs or segments.
- Preferred tabs are based on the kind of decision being made, such as `Cantrips`, `Known`, `Prepared`, and `Browse`.
- The UI should make it clear whether the user is choosing permanent known spells, prepared spells, cantrips, or browsing eligible options.
- Spell tabs should be shown based on class-specific spellcasting rules.
- If spell workflow metadata is unknown or cannot be modeled confidently, show an inline `Fix` / unsupported spellcasting card instead of guessing a workflow.
- Tab counters should be displayed in the tab labels.
- Example tab counters: `Cantrips 2/3`, `Known 4/4`, `Prepared 3/5`.

Known caster tabs:
- `Cantrips`
- `Known`
- `Browse`

Prepared-only caster tabs:
- `Cantrips`
- `Prepared`
- `Browse`

Tracked plus prepared caster tabs:
- `Cantrips`
- `Known`
- `Prepared`
- `Browse`
- Use `Known`, not `Book`, for consistency across caster types.

Browse behavior:
- show eligible spells only
- hide unavailable spells in the first implementation
- search only within eligible spells
- include a level filter only in the first implementation
- sort by spell level first, then name
- do not duplicate cantrips in `Browse`; cantrip choices live in the `Cantrips` tab only

Empty spell tabs:
- show explanation plus next action
- example: `No known spells selected. Browse eligible spells to add known spells.`

Non-caster behavior:
- show a compact explanation that the selected build does not currently require spell choices
- hide spell tabs for non-casters

### Spell Cards
- Spell cards should prioritize combat/rules facts.
- Spell cards should not rely on names alone.
- Updated compact-card decision: compact spell cards should stay minimal and move rules facts to the detail sheet.
- Tapping a spell card opens a spell detail bottom sheet.
- Compact spell cards should not include direct action buttons.
- Compact spell cards should not show source/edition badges.
- Compact spell cards should not show rules facts in the first implementation.

Expected spell-card direction:
- spell name
- selected/known/prepared/cantrip state badge where applicable

### Spell Detail
- Tapping a spell card should open an in-builder bottom sheet.
- The spell detail bottom sheet should provide choose/prepare actions as appropriate.
- It should include a secondary `Open in Compendium` action.
- Detail copy should be rules-first.
- The detail header should show spell name, source badge, and edition badge.
- The first content section should be a full `Rules Snapshot`.
- Missing structured spell fields should appear inline as `Unknown` or `Not structured yet`.
- The detail sheet should include full spell rules text because spell choice requires understanding the actual effect.
- Higher-level/upcasting text should be included when available.
- Spell detail actions should live in a sticky footer.
- Primary actions should be contextual based on active tab/workflow.
- Secondary action should be `Open in Compendium`.
- Selected spells should appear only in their task tabs for now; do not add a separate selected-spell summary above tabs in the first implementation.

Expected spell-detail header:
- spell name
- source badge
- edition badge

Expected spell rules snapshot:
- level
- school
- casting time
- range
- components
- duration
- concentration
- ritual

Expected spell detail sticky footer actions:
- `Add Cantrip`
- `Add Known`
- `Prepare`
- `Remove`
- secondary `Open in Compendium`

Spell action limits:
- when a limit is reached, disable the primary action
- show helper text such as `Cantrip limit reached. Remove one cantrip first.`
- do not implement a replace prompt in the first pass

### Spell Limits
- Spell overfill should be prevented where the builder can reliably enforce the limit.
- Once a cantrip, known-spell, or prepared-spell limit is reached, additional selections should be disabled rather than allowing an avoidable `Fix` state.
- The UI should explain why another spell cannot be selected.

### Compendium Integration
- Builder details should include a secondary compendium link.
- The builder should provide enough detail to choose without forcing compendium navigation.
- The compendium remains the full reference surface for deeper rules reading.
- The agreed pattern is `Choose` as the primary builder action and `Open in Compendium` as the secondary reference action.
- `Open in Compendium` should navigate with enough builder return context to return to the same builder and phase.
- After returning from compendium, the original detail sheet should reopen automatically.

### Issue Placement
- Class & Spells issues should appear inline near the decision that caused them.
- Do not rely only on the Review phase to explain class/spell problems.
- Examples:
  - subclass-required issues should appear near subclass selection
  - feature-selection issues should appear near the relevant feature picker
  - spell-limit issues should appear near the relevant spell tab/count/action

### Selection Summary
- Do not add a sticky or persistent Class & Spells summary bar.
- Keep context inside the selected class sections and spell subpanel instead of introducing a separate summary surface.

### Recommendations Policy
- Do not add strong class or spell recommendations yet.
- Do not implement a beginner recommendation engine in this pass.
- The phase should stay neutral and informational.
- Soft recommendation labels can be reconsidered later only if the app has reliable curated or derived data.

### Shared Bottom Sheet Standard
- Use one shared bottom-sheet shell for builder details and confirmations.
- Applicable sheets include class details, subclass details, feature option details, spell details, and impact confirmations.
- Bottom sheets should open as large sheets, roughly 80-90% height, with internal scrolling.
- Sheets should support explicit `Close` and backdrop-tap dismissal when no destructive or pending confirmation action is in progress.
- After a user chooses a class, subclass, feature option, or spell action, apply the choice, auto-close the sheet, and reveal the updated builder section.
- If the choice causes impact or validation changes, show the relevant impact banner or inline issue after the sheet closes.
- Sheets should support inline loading and error states for compendium-backed details.
- `Close` should remain available during loading/error states.

Expected shared sheet structure:
1. Header.
2. Scrollable content body.
3. Optional disabled-action/helper text area.
4. Sticky footer.

Expected sticky footer layout:
- secondary action on the left
- primary action on the right
- stack vertically on narrow screens if needed

Disabled primary actions:
- keep the primary action visibly disabled
- show helper text above the footer explaining why the action is unavailable
- example: `Available at class level 3`
- example: `Cantrip limit reached. Remove one cantrip first.`

Impact confirmations:
- use confirmation bottom sheets, not native alert dialogs
- show affected summaries rather than every affected item
- examples: `Subclass will be cleared`, `2 feature choices need review`, `3 spells may be invalid`
- use clear `Cancel` and `Confirm` actions in the footer

## Implementation Implications
- Replace class/subclass chips with richer cards.
- Replace unselected class chips with compact minimal class cards.
- Add selected class summary cards with level steppers and impact banners.
- Show the class picker directly only for empty builds; after the first class, move it behind `Add another class`.
- Render multiclass builds as stacked selected class sections in chosen order.
- Render subclass and class-owned feature decisions inside each selected class section by level order.
- Place the spell subpanel after all selected class sections and after the optional inline multiclass picker.
- Keep Class & Spells issue messages local to their owner sections/cards rather than adding a phase-level issue summary.
- Introduce reusable builder choice detail bottom sheets or equivalent focused overlays.
- Prefer a shared bottom-sheet shell for all Class & Spells details and impact confirmations.
- Add `Choose` and `Open in Compendium` actions to class, subclass, feature, and spell details.
- Keep class editing as remove-plus-add rather than introducing a direct class replacement flow.
- Replace class-owned feature chips with grant-source grouped compact pickers.
- Add feature option detail bottom sheets with rules text first, grant context after rules, and sticky choose/remove actions.
- Prevent feature-choice over-selection and explain limit conflicts inline.
- Show unsupported feature grants as inline `Fix` cards with compendium access.
- Add spell task tabs for cantrips/known/prepared/browse.
- Prevent spell overfill instead of relying on later validation where possible.
- Move Class & Spells validation messages inline near the responsible decision.
- Keep the existing compendium as the deeper reference surface rather than duplicating all reference behavior inside the builder.

## Open Follow-Up Decisions
- Exact bottom-sheet content structure for class, subclass, feature, and spell details.
- How builder-originated compendium navigation should preserve return position and builder context.
- How to implement automatic reopening of the original detail sheet after returning from compendium.
- Whether bottom sheet bodies should reuse compendium renderer components or only curated builder summaries plus facts.
- Exact layout and wording for the selected class summary card.
- Exact confirmation copy for class removal and subclass changes that clear or invalidate dependent choices.
- Exact visual layout for feature-choice group headers and unsupported grant `Fix` cards.
- Exact visual treatment for stacked multiclass selected class sections.
