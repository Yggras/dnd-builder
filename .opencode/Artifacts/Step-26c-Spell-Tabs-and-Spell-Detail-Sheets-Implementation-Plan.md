# Step 26c: Spell Tabs And Spell Detail Sheets - Implementation Plan

## Goal
Optimize the spell-selection portion of the `Class & Spells` phase with class-specific spell workflows, task tabs, compact spell cards, rules-first spell detail sheets, and limit prevention.

This step covers:
- spell workflow classification
- spell tabs by caster type
- Browse behavior and filtering
- compact spell cards
- spell detail bottom sheet
- contextual spell actions
- limit prevention and disabled helper text
- non-caster and unsupported spellcasting states

This step assumes Step 26a/26b have established the selected class section layout and shared bottom-sheet shell, or it should reuse/create those primitives if still absent.

## Source Of Truth
Primary UX specification:
- `.opencode/brain/Class-and-Spells-Builder-UX-Decisions.md`

Related behavior specification:
- `.opencode/brain/Character-Builder-Behavior-Spec.md`

Current rules logic:
- `src/features/builder/utils/spellReview.ts`

## User Review Required

> [!IMPORTANT]
> This step should not weaken spell validation.
>
> Spell UI should be clearer and more beginner-safe, but strict cantrip/known/prepared/max-level enforcement must remain intact.

## Current State
- `BuilderSpellsSection.tsx` currently shows a simple search list of applicable spells.
- Spell cards currently show limited facts and direct Known/Prepared action buttons.
- `spellReview.ts` already computes caster status, counts, max spell level, applicable spells, and validation issues.
- Spell content is eagerly loaded through `useCharacterBuilderContent.ts`.
- Builder currently distinguishes known/prepared limits by metadata but does not expose class-specific workflow tabs.

## Proposed Changes

### Spell Workflow Classification

#### [MODIFY] spell review/controller utilities
Introduce a UI-facing spell workflow classification derived from normalized class/subclass metadata.

Workflow types:
- `none`: non-caster, no spell choices needed
- `known`: known caster
- `prepared`: prepared-only caster
- `known-prepared`: tracked/known plus prepared caster, wizard-style but labeled `Known`
- `unsupported`: metadata cannot confidently determine workflow

Behavior:
- use class-specific rules from normalized metadata
- if workflow cannot be modeled confidently, show inline `Fix` / unsupported spellcasting card instead of guessing
- do not default unknown workflow to prepared-only

### Spell Tab Sets

#### [MODIFY] BuilderSpellsSection.tsx or extracted spell components
Render task-specific tabs based on workflow.

Known caster tabs:
- `Cantrips`
- `Known`
- `Browse`

Prepared-only caster tabs:
- `Cantrips`
- `Prepared`
- `Browse`

Known plus prepared caster tabs:
- `Cantrips`
- `Known`
- `Prepared`
- `Browse`

Use `Known`, not `Book`, for consistency.

Tab labels should include counters:
- `Cantrips 2/3`
- `Known 4/4`
- `Prepared 3/5`

Non-casters:
- show compact explanation that the selected build does not currently require spell choices
- hide tabs

Unsupported workflow:
- show inline `Fix` card explaining unsupported/unknown spellcasting workflow
- preserve Review gating behavior

### Browse Behavior
Browse tab behavior:
- show eligible spells only
- hide unavailable spells in first implementation
- search only within eligible spells
- include level filter only in first implementation
- sort by spell level first, then name
- do not duplicate cantrips in Browse; cantrip choices live in `Cantrips` tab only

### Empty States
Empty tabs should show explanation plus next action.

Examples:
- `No known spells selected. Browse eligible spells to add known spells.`
- `No prepared spells selected. Browse eligible spells to prepare spells.`
- `No cantrips selected. Choose cantrips from this tab.`

### Compact Spell Cards

#### [NEW] BuilderSpellCard.tsx
Compact spell cards should show:
- spell name
- selected/known/prepared/cantrip state badge where applicable

Do not show on compact spell cards:
- direct action buttons
- source/edition badges
- rules facts

Behavior:
- tapping opens spell detail bottom sheet
- no direct choose/prepare/remove from compact card

### Spell Detail Sheet

#### [NEW] BuilderSpellDetailSheet.tsx
Use shared sheet shell.

Header:
- spell name
- source badge
- edition badge

First content section:
- full `Rules Snapshot`

Rules snapshot fields:
- level
- school
- casting time
- range
- components
- duration
- concentration
- ritual

Missing structured fields:
- show `Unknown` or `Not structured yet` inline

Rules text:
- include full spell rules/effect text in the builder detail sheet
- include higher-level/upcasting text when available

Footer actions:
- contextual primary action based on active tab/workflow
- secondary `Open in Compendium`

Contextual primary actions:
- `Add Cantrip`
- `Add Known`
- `Prepare`
- `Remove`

### Limit Prevention
Prevent avoidable overfill in UI where rules are reliable.

Behavior:
- when cantrip limit is reached, disable adding more cantrips
- when known spell limit is reached, disable adding more known spells
- when prepared spell limit is reached, disable preparing more spells
- show helper text above sticky footer explaining the disabled action
- example: `Cantrip limit reached. Remove one cantrip first.`
- do not implement a replace prompt in the first pass
- do not allow over-selection just to create a later `Fix` state

### Selected Spell Display
Selected spells appear only in task tabs for now.

Do not add:
- selected-spell summary above tabs
- sticky selected-spell summary
- expandable selected-spell summary

## Data And Metadata Notes
Prefer existing spell metadata.

Likely metadata fields:
- `level`
- `school`
- `range`
- `components`
- `duration`
- `ritual`
- `concentration`
- class/subclass IDs
- text/render payload for spell description

Known gaps:
- Current development state notes spell detail facts attempt to read casting time, but spell normalization may not persist casting time yet.
- Do not run `npm run generate:5etools` casually.
- If casting time is missing, show `Unknown` / `Not structured yet` rather than changing the content pipeline in this step.

## Out Of Scope
- Content regeneration.
- Adding missing spell metadata to the importer.
- Replace-flow UI when limits are reached.
- Unavailable spell browsing with reasons.
- Advanced recommendation tags or beginner-friendly spell labels.
- Moving spell content loading to on-demand. That remains a separate performance task unless trivial during implementation.

## Verification Plan
- `npm run typecheck`
- Manual smoke checks:
  - non-caster shows compact no-spells explanation and no tabs
  - known caster gets Cantrips/Known/Browse tabs
  - prepared caster gets Cantrips/Prepared/Browse tabs
  - known-prepared caster gets Cantrips/Known/Prepared/Browse tabs
  - unsupported workflow shows inline Fix card
  - tab counters update after add/remove actions
  - Browse shows eligible spells only and excludes cantrips
  - Browse level filter and search work on eligible spells
  - tapping spell card opens detail sheet
  - detail sheet shows full rules snapshot and text
  - limits disable actions with helper text
  - selected spells appear in task tabs only

## Documentation Updates After Implementation
Update `.opencode/brain/Current-Development-State.md` after implementation with:
- completed Step 26c scope
- key files created/modified
- verification commands run and result
- any remaining Class & Spells UX gaps
