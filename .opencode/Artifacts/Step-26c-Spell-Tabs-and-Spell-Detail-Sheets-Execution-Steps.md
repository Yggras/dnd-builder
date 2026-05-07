# Step 26c: Spell Tabs And Spell Detail Sheets - Execution Steps

## Phase 1: Spell Metadata And Workflow Audit
- [ ] Inspect current class/subclass spellcasting metadata used by `spellReview.ts`.
- [ ] Identify when a caster should be classified as `known`, `prepared`, or `known-prepared`.
- [ ] Define unsupported workflow fallback when metadata cannot confidently classify the caster.
- [ ] Inspect spell `ContentEntity` metadata available for level, school, casting time, range, components, duration, concentration, ritual, and text/render payload.
- [ ] Confirm compendium spell route/linking data available from spell entities.

## Phase 2: Spell Workflow Classification
- [ ] Add UI-facing spell workflow classification without weakening existing validation.
- [ ] Preserve current count/max-level/applicable-spell calculations.
- [ ] Return unsupported workflow state when metadata is insufficient.
- [ ] Keep current Review issue behavior or add clear unsupported workflow issue if needed.

## Phase 3: Spell Tabs
- [ ] Extract spell tab UI from `BuilderSpellsSection.tsx` if needed.
- [ ] Render known caster tabs: `Cantrips`, `Known`, `Browse`.
- [ ] Render prepared caster tabs: `Cantrips`, `Prepared`, `Browse`.
- [ ] Render known-prepared caster tabs: `Cantrips`, `Known`, `Prepared`, `Browse`.
- [ ] Include counters in tab labels.
- [ ] Hide tabs for non-casters and show compact explanation.
- [ ] Show unsupported spellcasting Fix card for unsupported workflow.

## Phase 4: Browse Behavior
- [ ] Limit Browse results to eligible spells only.
- [ ] Exclude cantrips from Browse.
- [ ] Add search over eligible Browse results.
- [ ] Add level filter only.
- [ ] Sort Browse by level, then name.
- [ ] Add empty state with explanation plus next action.

## Phase 5: Task Tab Lists
- [ ] Render Cantrips tab list from eligible cantrip spells and selected cantrips.
- [ ] Render Known tab list for selected known leveled spells and eligible add flow as designed.
- [ ] Render Prepared tab list for prepared leveled spells and eligible prepare flow as designed.
- [ ] Ensure each tab empty state explains next action.
- [ ] Ensure selected spells appear only in relevant task tabs, not in a separate top summary.

## Phase 6: Compact Spell Cards
- [ ] Create compact spell card component.
- [ ] Render spell name.
- [ ] Render selected/known/prepared/cantrip state badge where applicable.
- [ ] Do not render source/edition badges on compact cards.
- [ ] Do not render direct action buttons on compact cards.
- [ ] Do not render rules facts on compact cards.
- [ ] Ensure tapping card opens detail sheet.

## Phase 7: Spell Detail Sheet
- [ ] Create spell detail sheet using shared sheet shell.
- [ ] Render header with spell name, source badge, and edition badge.
- [ ] Render full Rules Snapshot first.
- [ ] Show `Unknown` / `Not structured yet` for missing structured fields.
- [ ] Render full spell rules/effect text.
- [ ] Render higher-level/upcasting text when available.
- [ ] Add secondary `Open in Compendium` action.

## Phase 8: Contextual Spell Actions
- [ ] Add contextual primary action based on active tab/workflow.
- [ ] Support `Add Cantrip`.
- [ ] Support `Add Known`.
- [ ] Support `Prepare`.
- [ ] Support `Remove`.
- [ ] Auto-close sheet after successful action.
- [ ] Ensure tab counters update after action.

## Phase 9: Limit Prevention
- [ ] Disable `Add Cantrip` when cantrip limit is reached.
- [ ] Disable `Add Known` when known spell limit is reached.
- [ ] Disable `Prepare` when prepared spell limit is reached.
- [ ] Show helper text above footer explaining disabled action.
- [ ] Do not implement replace prompt in first pass.
- [ ] Do not allow intentional over-selection from the UI.

## Phase 10: Verification
- [ ] Run `npm run typecheck`.
- [ ] Manually verify non-caster compact explanation.
- [ ] Manually verify known caster tabs and counters.
- [ ] Manually verify prepared caster tabs and counters.
- [ ] Manually verify known-prepared caster tabs and counters.
- [ ] Manually verify unsupported workflow Fix card.
- [ ] Manually verify Browse eligible-only behavior, search, level filter, and sorting.
- [ ] Manually verify compact spell card opens detail sheet.
- [ ] Manually verify spell detail rules snapshot, text, and compendium link.
- [ ] Manually verify limit prevention helper text.
- [ ] Update `.opencode/brain/Current-Development-State.md` with Step 26c results.
