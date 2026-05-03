# Step 23 Builder Stabilization Implementation Plan

## Objective
Stabilize the character builder's persistence and derived-state foundations before larger UX, step-splitting, or deeper rules work.

This step is intentionally narrow. It addresses autosave safety, reconciliation correctness, and inventory drift while preserving the current builder payload shape as much as practical and avoiding broad UI refactors.

## Confirmed Decisions
- Start with the first chunk from `.opencode/brain/next.md`: Builder Stabilization.
- Do not split `CharacterBuilderScreen.tsx` into step components in this step.
- Do not redesign the wizard UI in this step.
- Do not deepen spellcasting rules beyond preserving stable validation behavior.
- Do not change SQLite schema or migrations unless a blocker is discovered.
- Use conservative inventory behavior after class/background changes:
  - preserve existing seeded gear
  - preserve manually added canonical items
  - show a checklist issue requiring review or reseed
  - let the user decide afterwards whether this feels right

## Current State Summary

### Autosave Risks
Current autosave lives in `src/features/builder/hooks/useBuilderDraftState.ts`.

Observed risks:
- Autosaves are debounced but not serialized.
- Multiple saves can overlap.
- Older save results can update React Query after newer local edits exist.
- `draftBuild` can be reset from stale query data in the data-sync effect.
- `SQLiteCharacterRepository.saveBuild()` computes `nextRevision = build.revision + 1` from the incoming build, so stale callers can overwrite newer persisted data.

### Reconciliation Risks
Current reconciliation lives in `src/features/builder/hooks/useBuilderReconciliation.ts` with helpers in:
- `src/features/builder/utils/classStep.ts`
- `src/features/builder/utils/originAndAbilities.ts`
- `src/features/builder/utils/spellReview.ts`

Observed risks:
- Class reconciliation compares only `review.issues` before deciding whether to apply changes.
- `reconcileClassStepPayload()` can clear subclass selections or feature choices without changing issues, causing sanitized payload changes to be dropped.
- Reconciliation effects use captured `draftBuild` values and direct object setters, increasing stale-closure risk.

### Inventory Drift Risks
Current inventory behavior lives in `src/features/builder/utils/inventory.ts` and `CharacterBuilderScreen.tsx`.

Observed risks:
- Inventory validation issues are only generated when `seedStartingEquipment()` runs.
- Class or background changes can make starting-equipment selections stale.
- Seeded inventory entries, selected starting-equipment choices, currency, and unresolved gear state can drift away from the current class/background context.
- There is no explicit persisted marker for which class/background context was last reviewed or seeded.

## Product Boundary

### Included In Step 23
- Safer autosave flow for local builder drafts.
- Stale revision protection for local build saves.
- Better handling of React Query updates so stale saved data does not clobber newer local edits.
- Reconciliation fixes for class payload sanitization.
- Functional reconciliation updates where they reduce stale-state risk.
- Non-destructive inventory reconciliation that flags stale starting equipment for review.
- Minimal save-state feedback surfaced through the existing builder header.
- TypeScript verification.

### Explicitly Excluded From Step 23
- Full builder screen decomposition.
- New step wizard UI.
- Large visual redesign.
- New database schema or migration work unless unavoidable.
- Campaign assignment, live sheet, or DM dashboard work.
- Supabase sync implementation.
- Deep spell rules rewrite.
- Generated content changes.

## Implementation Strategy

### 1. Stabilize Autosave Flow
Update `useBuilderDraftState.ts` so autosave has a single authoritative local flow.

Desired behavior:
- Only one save is in flight at a time.
- If edits happen while a save is in flight, queue only the latest draft snapshot.
- When the in-flight save finishes, save the latest queued draft next if it differs from the saved result.
- Save success updates saved metadata such as `revision`, `updatedAt`, and `completionUpdatedAt` without losing newer local payload changes.
- Save errors leave the draft dirty and expose an error state.
- Incoming query data should initialize the draft, but should not overwrite a locally dirty or newer draft.

Recommended hook return additions:
- `saveStatus`: `idle | dirty | saving | error` or equivalent
- `saveError`: user-safe error state if needed
- a method or internal path for explicit completion saves if necessary

Exact naming can vary, but the behavior should be explicit and testable by manual smoke checks.

### 2. Add Local Revision Guard
Update the character save path:
- `src/features/characters/repositories/CharacterRepository.ts`
- `src/features/characters/services/CharacterService.ts` if needed
- `src/features/characters/adapters/SQLiteCharacterRepository.ts`
- `src/features/characters/hooks/useSaveCharacterBuild.ts`

Desired behavior:
- A build save should not overwrite a persisted row if the incoming revision is older than the current persisted revision.
- The repository should return the authoritative saved build after a successful update.
- Stale-save handling should be deterministic and not silently pretend success.

Possible approach:
- Read the current build row inside the save transaction.
- Reject the save if `incoming.revision < current.revision`.
- Accept equal-revision saves as the normal local autosave path.
- Increment revision from the persisted current revision, not blindly from the incoming object.

Important nuance:
- Because this is local SQLite and not remote sync yet, avoid overbuilding a conflict system. The goal is to prevent old in-flight autosaves from overwriting newer local data.

### 3. Fix Class Reconciliation Application
Update `useBuilderReconciliation.ts` and possibly helper snapshots.

Desired behavior:
- Apply reconciled class payload changes whenever `classStep` changes, not only when `review.issues` changes.
- Compare relevant slices explicitly:
  - `classStep`
  - class-owned `review.issues`
- Use functional state updates so reconciliation operates on the latest draft state.
- Preserve idempotence to avoid infinite effect loops.

Primary bug to eliminate:
- A subclass or feature choice cleared by `reconcileClassStepPayload()` must actually be written into `draftBuild` even if the issue list is unchanged.

### 4. Keep Origin And Spell Reconciliation Stable
Do not redesign origin or spell rules in this step.

Targeted improvements only:
- Prefer functional state updates where practical.
- Preserve existing completion regression behavior.
- Avoid applying stale reconciliation output over newer user edits.
- Keep current origin ability, granted-feat, and spell issue semantics unless needed for consistency with autosave/reconciliation safety.

### 5. Add Non-Destructive Inventory Reconciliation
Extend `src/features/builder/utils/inventory.ts` with a reconciliation helper separate from `seedStartingEquipment()`.

Desired behavior:
- Compute a stable signature for current starting-equipment sources based on selected class/background context.
- Track the last reviewed or seeded signature in the builder payload if practical.
- If the current signature differs from the last reviewed/seeded signature, add a checklist issue requiring inventory review/reseed.
- Preserve current inventory entries.
- Preserve current currency and unresolved gear until the user explicitly reseeds.
- Preserve manual item entries during explicit reseed.

Potential payload metadata:
- Add an optional field inside `inventoryStep`, for example `startingEquipmentReviewKey` or `startingEquipmentSourceKey`.
- This is JSON payload evolution only and should not require SQLite schema changes.
- `isBuilderDraftPayload()` currently only checks `version`, so older payloads can tolerate optional fields if code supplies defaults safely.

Conservative inventory policy:
- Class/background changes should not automatically delete seeded gear.
- The builder should tell the user that inventory may no longer match the current class/background.
- Pressing reseed should refresh starting-equipment entries for the current context and preserve manual-selection entries.

### 6. Minimal Save Feedback
Update only the existing builder header copy/status.

Desired behavior:
- Show whether the draft is saved, dirty, saving, or failed to autosave.
- Do not redesign layout.
- Keep completion blocked or clearly warned when a save is in flight or failed.

### 7. Verification
Run:
- `npm run typecheck`

Manual smoke checks:
- Rapidly edit character name and confirm final value persists.
- Rapidly change class levels and confirm older values do not reappear.
- Select a subclass, lower class level below subclass unlock, and confirm subclass clears.
- Select class feature choices, lower class level below grant, and confirm invalid choices clear.
- Select species/background ability choices, switch origin, and confirm stale selections clear.
- Seed inventory, change class or background, and confirm inventory is flagged for review.
- Reseed inventory and confirm manual items are preserved.
- Complete a valid build, then make it invalid, and confirm it returns to draft.

## Acceptance Criteria
- Autosave serializes or otherwise safely supersedes overlapping draft saves.
- Stale save/query results do not overwrite newer local draft edits.
- Repository save behavior prevents older revisions from silently overwriting newer saved rows.
- Reconciliation applies actual sanitized class payload changes.
- Inventory drift after class/background changes is surfaced as a checklist issue.
- Explicit reseed refreshes starting equipment for the current context and preserves manual items.
- Existing builder behavior remains otherwise intact.
- `npm run typecheck` passes.
- No generated content changes are included.
- No SQLite schema or migration changes are included unless explicitly justified.

## Risks And Mitigations

### Risk 1: Autosave Changes Create Lost Local Edits
Mitigation:
- Treat latest local draft as authoritative.
- Queue only the latest dirty snapshot while a save is in flight.
- Do not reset local state from query data once the user has a dirty or newer local draft.

### Risk 2: Revision Guard Rejects Valid Saves
Mitigation:
- Keep the guard simple for local SQLite: reject only strictly older revisions.
- Accept equal revisions as normal local save attempts.
- Return the authoritative saved build metadata after success.

### Risk 3: Reconciliation Effects Loop
Mitigation:
- Compare stable JSON snapshots of affected slices before setting state.
- Keep reconciliation helpers idempotent.
- Avoid adding broad dependencies that change identity every render without need.

### Risk 4: Inventory Review Feels Too Conservative
Mitigation:
- Preserve user data first.
- Let the user review the implemented behavior after this step.
- Adjust later if automatic reseeding feels better in practice.

### Risk 5: Payload Optional Field Compatibility
Mitigation:
- Add optional inventory metadata defensively.
- Ensure missing fields in older drafts default to a safe `null` or equivalent.
- Avoid increasing payload `version` unless the code truly requires a migration path.

## Exit Criteria
Step 23 is complete when:
- builder autosave is latest-write safe
- local saves have stale revision protection
- reconciliation applies sanitized class state reliably
- inventory drift is detected non-destructively
- minimal save status is visible in the builder header
- typecheck passes
- manual smoke checks match the conservative stabilization policy
