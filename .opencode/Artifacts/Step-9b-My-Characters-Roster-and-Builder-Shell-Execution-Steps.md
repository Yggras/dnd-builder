# Step 9b My Characters Roster and Builder Shell Execution Steps

## Goal
Execute the first owned-character vertical slice so players can create a draft character, see it in a personal roster, and enter a resumable builder shell.

## Execution Rules
- Do not implement deep step logic in this step.
- Do not expand into campaign assignment.
- Keep persistence local-first.
- Keep builder state aligned to the Step 9a contract.

## Step-By-Step Execution Sequence

### 1. Confirm The Owned-Character Flow
- Confirm `My Characters` is global and player-owned.
- Confirm `New Character` creates a blank draft immediately.
- Confirm name is required up front.

Output:
- stable roster and draft-entry contract.

### 2. Implement Character Repository Foundations
- Add local list/get/create/save behavior.
- Read and write `characters` and `character_builds`.
- Persist and read the minimal explicit builder progress columns defined in Step 9a.

Output:
- working local character persistence boundary.

### 3. Add Hooks And Query Keys
- Add roster and single-character query keys.
- Add hooks for list/load/create/save behavior.

Output:
- screen-ready character state layer.

### 4. Replace The Placeholder Roster
- Build the real `My Characters` screen.
- Add empty, loading, and error states.
- Show draft/complete identity cards.
- Read roster-visible progress directly from explicit columns, not by parsing the full builder payload.

Output:
- usable owned-character roster.

### 5. Add Builder Entry Routes
- Add `new` route behavior.
- Add builder route by character id.
- Register routes in the app stack.

Output:
- navigable entry into the builder shell.

### 6. Build The Builder Shell
- Load draft state.
- Render step navigation scaffolding.
- Enable autosave-compatible shell state.
- Keep detailed state in `character_builds.payload` while updating explicit progress fields for resume behavior.

Output:
- resumable builder shell.

### 7. Verify Roster And Resume Behavior
- Create a draft.
- Return to roster.
- Re-enter builder.
- Relaunch and confirm persistence.

Output:
- validated roster and builder shell baseline.

## Exit Criteria
Step 9b is complete when:
- `My Characters` is a real roster
- drafts can be created and reopened
- builder shell routes exist
- local persistence and resume behavior work
