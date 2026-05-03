# Step 23 Builder Stabilization Execution Steps

## Goal
Execute a correctness-first stabilization pass for the character builder before larger UX refactors.

## Execution Rules
- Use `npm`, not `pnpm` or `yarn`.
- Do not split `CharacterBuilderScreen.tsx` into step components in this step.
- Do not redesign the builder UI.
- Do not change SQLite schema or migrations unless a hard blocker is discovered.
- Do not run `npm run generate:5etools` for this step.
- Preserve manually added inventory items when reseeding starting equipment.
- Prefer preserving user-entered data over automatic destructive cleanup.

## Execution Checklist

### 1. Inspect Current Save Flow
- [ ] Review `src/features/builder/hooks/useBuilderDraftState.ts` autosave behavior.
- [ ] Review `src/features/characters/hooks/useSaveCharacterBuild.ts` mutation behavior.
- [ ] Review `src/features/characters/adapters/SQLiteCharacterRepository.ts` revision update behavior.
- [ ] Confirm where `lastSavedSnapshot` is used by completion and autosave paths.

Output:
- exact stale-save and stale-query overwrite points are confirmed before editing.

### 2. Implement Latest-Write Autosave Flow
- [ ] Update `useBuilderDraftState.ts` so only one autosave runs at a time.
- [ ] Queue only the latest dirty draft while a save is in flight.
- [ ] Save the queued latest draft after the current save completes if it still differs.
- [ ] Preserve newer local payload edits when an older save succeeds.
- [ ] Keep failed saves dirty and expose an error state.
- [ ] Ensure incoming query data initializes the draft but does not clobber dirty/newer local state.

Output:
- builder draft autosave is serialized or safely superseded.

### 3. Add Save Status Contract
- [ ] Return minimal save state from `useBuilderDraftState.ts`.
- [ ] Include at least saved/dirty/saving/error semantics, using exact names chosen during implementation.
- [ ] Preserve the existing completion-specific state.
- [ ] Keep the hook API small enough that later controller extraction remains easy.

Output:
- the builder screen can show accurate save status without a UI redesign.

### 4. Add Local Revision Guard
- [ ] Update `SQLiteCharacterRepository.saveBuild()` to read the current persisted revision during save.
- [ ] Reject or fail deterministicly when incoming build revision is older than persisted revision.
- [ ] Increment from the persisted revision, not blindly from incoming `build.revision`.
- [ ] Return authoritative saved build metadata after success.
- [ ] Update service or repository types only if necessary.

Output:
- older local saves cannot silently overwrite newer saved rows.

### 5. Update Save Mutation Cache Handling
- [ ] Update `useSaveCharacterBuild.ts` so successful saves do not blindly overwrite newer local draft state.
- [ ] Keep roster invalidation so character list ordering and labels refresh.
- [ ] Preserve existing character detail query shape.
- [ ] Ensure stale revision errors can be handled by the builder autosave flow.

Output:
- React Query cache updates support the safer autosave model.

### 6. Fix Class Reconciliation Application
- [ ] Update `useBuilderReconciliation.ts` class reconciliation effect.
- [ ] Compare `classStep` snapshots in addition to class-owned review issues.
- [ ] Apply reconciled class payload when subclass or feature-choice cleanup changes the payload.
- [ ] Use functional `setDraftBuild` where it prevents stale closure writes.
- [ ] Keep the reconciliation effect idempotent.

Output:
- sanitized class state is no longer dropped when issue lists are unchanged.

### 7. Stabilize Other Reconciliation Effects
- [ ] Review origin/ability reconciliation effect for stale direct object writes.
- [ ] Review spell/source-summary reconciliation effect for stale direct object writes.
- [ ] Convert to functional updates where safe and useful.
- [ ] Preserve existing validation semantics.
- [ ] Confirm complete builds still revert to draft when unresolved blockers/checklist items appear.

Output:
- reconciliation updates apply to the latest local draft without broad rules changes.

### 8. Add Inventory Source Signature Helper
- [ ] Add a helper in `src/features/builder/utils/inventory.ts` to compute current starting-equipment source identity.
- [ ] Base the signature on the selected primary class and selected background sources that contribute starting equipment.
- [ ] Keep the signature stable and deterministic.
- [ ] Avoid depending on display-only labels.

Output:
- inventory can detect whether current class/background context differs from last reviewed/seeding context.

### 9. Track Last Reviewed Or Seeded Inventory Context
- [ ] Add optional JSON payload metadata under `inventoryStep` if needed.
- [ ] Make missing metadata safe for existing drafts.
- [ ] Update explicit `seedStartingEquipment()` to stamp the current starting-equipment source signature.
- [ ] Do not change SQLite schema.

Output:
- the builder knows which starting-equipment context was last explicitly seeded/reviewed.

### 10. Add Non-Destructive Inventory Reconciliation
- [ ] Add an inventory reconciliation helper separate from `seedStartingEquipment()`.
- [ ] Preserve current inventory entries, currency, selected options, and unresolved gear when context is stale.
- [ ] Add a checklist issue when starting equipment needs review or reseed.
- [ ] Preserve existing inventory issues only where still valid.
- [ ] Keep manual-selection entries preserved during explicit reseed.

Output:
- class/background changes surface inventory drift without deleting user data.

### 11. Wire Inventory Reconciliation Into Builder
- [ ] Call inventory reconciliation from `useBuilderReconciliation.ts` after class/background content needed for inventory is available.
- [ ] Compare affected inventory and review slices before setting state.
- [ ] Keep the effect idempotent.
- [ ] Avoid requiring all item content unless the user explicitly reseeds.

Output:
- inventory review state remains aligned with the current build context.

### 12. Surface Minimal Save Feedback
- [ ] Update the existing builder header status text in `CharacterBuilderScreen.tsx`.
- [ ] Show saved/dirty/saving/error semantics from the draft hook.
- [ ] Keep layout and styling changes minimal.
- [ ] Keep completion blocked or guarded while saving or in save-error state.

Output:
- users can tell whether the local draft is saved, dirty, saving, or failed.

### 13. Verify TypeScript
- [ ] Run `npm run typecheck`.
- [ ] Fix any TypeScript regressions.
- [ ] If typecheck fails only because generated 5etools JSON imports are missing, run `npm run generate:5etools` and rerun `npm run typecheck`.
- [ ] Otherwise, do not run content generation.

Output:
- typecheck passes.

### 14. Manual Smoke Checks
- [ ] Rapidly edit character name and confirm final value persists.
- [ ] Rapidly change class levels and confirm old values do not reappear.
- [ ] Select a subclass, lower class level below subclass unlock, and confirm subclass clears.
- [ ] Select class feature choices, lower class level below grant, and confirm invalid choices clear.
- [ ] Select species/background ability choices, switch origin, and confirm stale selections clear.
- [ ] Seed inventory, change class or background, and confirm inventory is flagged for review.
- [ ] Reseed inventory and confirm manual items are preserved.
- [ ] Complete a valid build, then make it invalid, and confirm it returns to draft.

Output:
- stabilization behavior matches the intended conservative policy.

### 15. Review Final Diff Scope
- [ ] Confirm no generated content changed.
- [ ] Confirm no SQLite schema file changed unless explicitly justified.
- [ ] Confirm no migration file changed unless explicitly justified.
- [ ] Confirm no broad step-component extraction occurred.
- [ ] Confirm UI changes are limited to minimal save feedback.

Output:
- final diff remains inside Step 23 boundaries.

## Expected Commands
```bash
npm run typecheck
```

## Expected Final Outcome
- Autosave is latest-write safe.
- Stale local saves cannot silently overwrite newer saved rows.
- Stale query/cache updates do not clobber newer local drafts.
- Class reconciliation applies sanitized subclass and feature-choice cleanup.
- Inventory drift is detected after class/background changes without deleting user inventory.
- Explicit reseed refreshes starting equipment and preserves manual items.
- Save state is visible in the existing builder header.
- `npm run typecheck` passes.

## Exit Criteria
Step 23 is complete when:
- all checklist items above are implemented or intentionally deferred with notes
- typecheck passes
- smoke checks pass or any limitations are documented
- final diff excludes generated content and broad UI refactors
