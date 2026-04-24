# Step 9b My Characters Roster and Builder Shell Implementation Plan

## Objective
Implement the first real owned-character surface and the first usable builder shell so players can create, view, resume, and edit character drafts through the global `My Characters` roster.

This step should establish the product's first real character-management vertical slice without yet implementing the full deep rules engine for every builder step.

## Confirmed Decisions
- `My Characters` is a global owned-character roster, not a campaign roster.
- `New Character` creates a blank draft immediately.
- The builder always behaves as a resumable draft wizard.
- Name is required up front.
- The roster should show name, level, class, species, and draft/complete state.
- Completion should be visibly reflected in the roster.
- Builder persistence follows the Step 9a hybrid model: roster-friendly progress fields are explicit columns, while detailed builder state lives in `character_builds.payload`.

## Product Boundary

### Included In Step 9b
- Build the owned-character SQLite repository and service path.
- Add list, create, and load-by-id behavior.
- Add routes for roster, new-character creation, and builder entry.
- Build the first roster UI.
- Build the builder shell and step navigation scaffolding.
- Persist draft state locally.

### Explicitly Excluded From Step 9b
- Deep class rules engine.
- Deep spell rules.
- Background automation.
- Inventory and starting gear logic.
- Final completion semantics beyond shell integration.

## Feature Goals
- The player can see their characters in a real roster.
- The player can create a new draft character instantly.
- The player can enter and resume the builder.
- Draft state persists locally.

## Architectural Approach

### 1. Owned Character Repository
Implement local reads/writes for:
- list owned characters
- get one character
- create blank character
- read and write character build
- persist and read minimal explicit builder progress fields needed by roster and resume flows

### 2. Query And Hook Layer
Add hooks for:
- roster query
- character query
- create draft mutation
- save draft mutation

### 3. Roster UI
Replace the placeholder with a real owned-character roster.

Responsibilities:
- empty state
- list of character cards
- draft/complete badge
- `New Character` action

### 4. Builder Shell
Add a route and shell for the wizard.

Responsibilities:
- render step navigation
- load saved draft
- autosave draft changes
- support resume behavior
- update explicit progress columns without flattening the full builder model into top-level tables

## Verification
- The roster lists only the signed-in user's characters.
- New character creation creates a blank draft and opens the builder.
- Returning to the roster shows the created draft.
- The roster can render draft/complete state and current progress without parsing the full builder payload.
- Reloading the app preserves the draft.

## Risks And Mitigations

### Risk 1: Builder Shell Outruns State Contract
Mitigation:
- depend directly on Step 9a outputs before implementing shell behaviors

### Risk 2: UI Scope Expands Into Full Builder Logic
Mitigation:
- keep this step limited to roster and shell infrastructure

## Exit Criteria
Step 9b is complete when:
- `My Characters` is a real roster
- new draft creation works
- builder entry routes exist
- draft persistence works
- explicit builder progress columns support roster and resume behavior
- the builder shell can resume saved work
