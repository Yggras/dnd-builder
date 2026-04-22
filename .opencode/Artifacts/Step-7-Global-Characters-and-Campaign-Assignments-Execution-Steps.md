# Step 7 Global Characters and Campaign Assignments Execution Steps

## Goal
Execute the ownership-model refactor in a controlled sequence so the app stops assuming that a character belongs to exactly one campaign, and instead supports global player-owned characters with unique campaign assignments and campaign-scoped live play state.

## Execution Rules
- Do not implement the first real character, campaign, or DM dashboard feature slice in this step.
- Do not preserve existing local app state unless it is strictly required; current state is disposable.
- Keep character build data character-scoped.
- Keep live status and snapshots assignment-scoped.
- Enforce one assignment per `(campaign_id, character_id)`.
- Do not change compendium or content-pipeline behavior unless typing fallout makes a minimal change necessary.

## Step-By-Step Execution Sequence

### 1. Confirm The Ownership Contract
- Confirm characters are globally owned by players.
- Confirm campaigns reference assigned characters rather than owning them.
- Confirm one character may appear in multiple campaigns.
- Confirm one `(campaign_id, character_id)` assignment may exist at most once.
- Confirm build is shared while live state is per campaign assignment.

Output:
- stable ownership and assignment contract for the refactor.

### 2. Update The Source-Of-Truth Docs
- Update the product specification to remove campaign-owned character language.
- Update the architecture document to describe campaign assignments as the collaboration boundary.
- Clarify the distinction between character-scoped build data and assignment-scoped status/snapshot data.

Output:
- source-of-truth documentation aligned to the new model.

### 3. Refactor Shared Domain Types
- Remove `campaignId` from `Character`.
- Add `CampaignCharacter`.
- Replace `CharacterStatus` with an assignment-scoped live-state type.
- Replace `CharacterSnapshot` with an assignment-scoped snapshot type.
- Keep `CharacterBuild` keyed by `characterId`.

Output:
- shared domain language aligned to the new ownership model.

### 4. Refactor The Local Schema
- Remove campaign ownership from the `characters` table.
- Add the `campaign_characters` table.
- Replace old live-state and snapshot tables with assignment-scoped versions.
- Add the uniqueness constraint for `(campaign_id, character_id)`.

Output:
- canonical local table layout for global characters and campaign assignments.

### 5. Add Canonical Rebuild Migrations
- Advance the local schema version.
- Add migration steps that rebuild the affected character-related tables to the new canonical shape.
- Recreate required indexes and constraints.
- Keep migration ordering explicit: baseline tables, migrations, then content seeding.

Output:
- disposable-state migration path for the new ownership model.

### 6. Refactor Repository Contracts
- Remove campaign-owned assumptions from `CharacterRepository`.
- Add campaign-assignment responsibilities to `CampaignRepository`.
- Re-scope `StatusRepository` to assignment-scoped live state.

Output:
- repository boundaries aligned to global characters and campaign assignments.

### 7. Refactor Service Contracts
- Update character services to operate on global characters.
- Update campaign services to operate on assignment workflows.
- Update status services to operate on assignment-scoped state.
- Ensure DM dashboard services depend on campaign-assignment snapshots, not raw characters.

Output:
- service boundaries aligned to the new domain split.

### 8. Update Placeholder Language
- Update the characters placeholder to describe a personal roster of reusable characters.
- Update the campaigns placeholder to describe assigning existing characters to campaigns.
- Update the DM dashboard placeholder to describe viewing campaign-assigned characters.

Output:
- placeholder surfaces aligned to the corrected product model.

### 9. Verify Structural Consistency
- Search for remaining `campaignId` ownership assumptions on `Character`.
- Search for repository methods that still imply `listCharacters(campaignId)`.
- Check for any leftover schema or type names that imply character-scoped live state.

Output:
- refactor consistency verified across the shared contracts.

### 10. Run Technical Verification
- Run TypeScript typecheck.
- Confirm compendium and content-bootstrap behavior were not changed beyond required typing alignment.
- Confirm no new feature scope was introduced while performing the refactor.

Output:
- validated Step 7 structural baseline.

## Task List
1. Confirm the ownership and assignment contract.
2. Update product and architecture docs.
3. Refactor shared domain types.
4. Refactor the local schema.
5. Add canonical rebuild migrations.
6. Refactor repository contracts.
7. Refactor service contracts.
8. Update placeholder-language surfaces.
9. Verify structural consistency.
10. Run typecheck and final technical verification.

## Risks During Execution

### Risk 1: Old Ownership Language Persists In Shared Types Or Docs
Mitigation:
- update docs and shared domain types first so later changes follow the corrected terminology.

### Risk 2: Live State Remains Character-Scoped By Accident
Mitigation:
- rename status and snapshot types and tables explicitly around campaign assignment scope.

### Risk 3: Schema Changes Become Harder Than Necessary
Mitigation:
- use disposable-state canonical rebuild migrations instead of preservation-heavy migration logic.

### Risk 4: Repository Contracts Keep The Old Assumptions Alive
Mitigation:
- remove campaign-scoped character listing signatures during this step rather than deferring them.

### Risk 5: Step Scope Expands Into Real Feature Work
Mitigation:
- keep this step structural only and stop before building the first real character or campaign UI slice.

## Exit Criteria
Step 7 is complete when:
- the docs describe global player-owned characters and unique campaign assignments
- shared types distinguish character-scoped build data from assignment-scoped live state
- local schema supports `campaign_characters` with unique `(campaign_id, character_id)`
- status and snapshots are campaign-assignment scoped
- repository and service contracts no longer assume campaign-owned characters
- placeholder routes describe the corrected product direction
- typecheck passes
