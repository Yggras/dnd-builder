# Step 7 Global Characters and Campaign Assignments Implementation Plan

## Objective
Refactor the app's character ownership model so characters become global player-owned records that can be assigned to one or more campaigns, while live play state remains isolated per campaign assignment.

This step replaces the current one-character-to-one-campaign assumption with the agreed D&D Beyond-style model:
- a player creates and owns characters independently of campaigns
- a campaign references assigned characters rather than owning them
- one character may be assigned to multiple campaigns
- one `(campaign_id, character_id)` assignment may exist at most once
- character build data is shared across campaigns
- live status and derived snapshots are scoped to the campaign assignment

This step is structural. It updates the product contract, domain types, local schema, repository boundaries, and placeholder intent so future feature work lands on the correct model. It does not implement the first real character, campaign, or DM dashboard feature slice yet.

## Confirmed Decisions
- Character ownership model: global player-owned characters.
- Campaign relationship model: campaigns reference assigned characters.
- Assignment uniqueness rule: `(campaign_id, character_id)` is unique.
- Build scope: shared per character.
- Live status scope: separate per campaign assignment.
- Snapshot scope: separate per campaign assignment.
- Migration policy: current app state is disposable, so local schema migration may prefer canonical rebuilds over preservation logic.
- Execution rule for this artifact phase: document the plan and execution sequence before any code is written.

## Product Boundary

### Included In Step 7
- Update source-of-truth docs to reflect the new ownership and assignment model.
- Refactor shared domain types to distinguish global characters from campaign assignments.
- Redesign local SQLite schema around campaign assignment records.
- Add a disposable-state migration strategy that favors canonical rebuilds.
- Refactor repository and service contracts so they no longer assume campaign-owned characters.
- Update placeholder screen intent text so the app language matches the new product model.
- Run typecheck after the structural refactor.

### Explicitly Excluded From Step 7
- Building the first real `My Characters` screen.
- Building campaign assignment UI.
- Building status editing UI.
- Building DM dashboard data flows or screens beyond placeholder-language alignment.
- Implementing realtime sync or pending-mutation replay behavior.
- Implementing builder UI beyond structural preparation.

## Feature Goals
- Character creation must no longer depend on campaign membership.
- The type system must make it difficult to confuse global character data with campaign-specific state.
- Future features should be able to reuse one character in multiple campaigns without cross-campaign HP or status leakage.
- Campaign and DM views should depend on campaign assignments, not direct character ownership.
- The codebase should stop reinforcing the old one-character-one-campaign assumption before more feature work is added.

## Target Domain Model

### Global Character Layer
Represents the long-lived player-owned entity.

Recommended responsibilities:
- identity and naming
- ownership
- level and long-lived progression markers
- shared build data

Primary record:
- `character`

Related record:
- `character_build`

### Campaign Assignment Layer
Represents a character being used inside a specific campaign.

Recommended responsibilities:
- campaign membership of the character
- assignment lifecycle
- read/write anchor for campaign-specific live play state

Primary record:
- `campaign_character`

Constraint:
- unique `(campaign_id, character_id)`

### Campaign Live State Layer
Represents mutable session state that must not leak across campaigns.

Recommended responsibilities:
- HP
- temporary HP
- AC
- spell slots
- concentration
- exhaustion
- conditions
- death saves

Primary record:
- `campaign_character_status`

### Campaign Read Model Layer
Represents a derived snapshot for player and DM viewing within a campaign context.

Recommended responsibilities:
- campaign-scoped read model for fast rendering
- campaign-safe summary of shared build plus live state

Primary record:
- `campaign_character_snapshot`

## Design Rules

### Ownership Rule
Characters are owned by users, not by campaigns.

Reason:
- this supports the intended workflow of creating a character once and assigning it to different campaigns later

### Live State Isolation Rule
Status and snapshots are assignment-scoped rather than character-scoped.

Reason:
- the same character may be played in multiple campaigns, so session state must remain isolated

### Unique Assignment Rule
Each character may appear only once in a given campaign.

Reason:
- duplicate campaign assignments of the same character would create ambiguous live-state ownership and confusing DM views

### Migration Simplicity Rule
Because current installs are disposable, prefer canonical rebuilds over compatibility-heavy table reshaping.

Reason:
- the app is still early enough that simpler migrations reduce long-term maintenance cost

## Architectural Approach

### 1. Documentation First
Update the source-of-truth product and architecture documents before structural code changes.

Primary targets:
- `.opencode/brain/product-specification.md`
- `.opencode/brain/Architecture.md`

Responsibilities:
- replace campaign-owned character language
- clarify shared build versus assignment-scoped status
- align future implementation steps with the new model

### 2. Shared Domain Type Refactor
Refactor shared types so the new distinction is explicit across the app.

Primary target:
- `src/shared/types/domain.ts`

Responsibilities:
- remove campaign ownership from `Character`
- add `CampaignCharacter`
- replace `CharacterStatus` with an assignment-scoped type
- replace `CharacterSnapshot` with an assignment-scoped type

### 3. Local Schema Refactor
Refactor SQLite schema to match the new domain shape.

Primary target:
- `src/shared/db/schema.ts`

Responsibilities:
- remove `campaign_id` from `characters`
- add `campaign_characters`
- replace old status and snapshot tables with assignment-scoped versions
- enforce unique `(campaign_id, character_id)`

### 4. Local Migration Strategy
Add a migration that resets old character-state tables into their canonical new shape.

Primary targets:
- `src/shared/db/schema-version.ts`
- `src/shared/db/migrations.ts`

Responsibilities:
- advance local schema version
- rebuild affected tables and indexes deterministically
- keep migration order clean and obvious

### 5. Repository Boundary Refactor
Refactor repository contracts so future feature work does not depend on the old ownership model.

Primary targets:
- `src/features/characters/repositories/CharacterRepository.ts`
- `src/features/campaigns/repositories/CampaignRepository.ts`
- `src/features/status/repositories/StatusRepository.ts`

Responsibilities:
- make characters globally queryable for the owner
- make campaign assignment operations campaign-scoped
- make status operations assignment-scoped

### 6. Service Boundary Refactor
Keep services aligned with the repository split.

Primary targets:
- `src/features/characters/services/CharacterService.ts`
- `src/features/campaigns/services/CampaignService.ts`
- `src/features/status/services/StatusService.ts`
- `src/features/dm-dashboard/services/DmDashboardService.ts`

Responsibilities:
- remove old campaign-owned character assumptions
- align service method names and inputs to the new model

### 7. Placeholder Language Alignment
Update placeholder screens so they describe the corrected product direction.

Primary targets:
- `src/features/characters/screens/CharactersScreen.tsx`
- `src/features/campaigns/screens/CampaignsScreen.tsx`
- `src/features/dm-dashboard/screens/DmDashboardScreen.tsx`

Responsibilities:
- make `Characters` read as a global owned-character surface
- make `Campaigns` read as an assignment surface
- make `DM Dashboard` read as a campaign-assigned overview surface

## Proposed Data Shapes

### `character`
Recommended fields:
- `id`
- `owner_user_id`
- `name`
- `level`
- `created_at`
- `updated_at`

### `character_build`
No ownership-model change is required beyond continuing to key by `character_id`.

### `campaign_character`
Recommended fields:
- `id`
- `campaign_id`
- `character_id`
- `added_by_user_id`
- `created_at`
- `updated_at`

Constraint:
- unique `(campaign_id, character_id)`

### `campaign_character_status`
Recommended fields:
- `campaign_character_id`
- `payload`
- `updated_at`

### `campaign_character_snapshot`
Recommended fields:
- `campaign_character_id`
- `payload`
- `updated_at`

## Code Areas To Change

### Documentation
- `.opencode/brain/product-specification.md`
- `.opencode/brain/Architecture.md`

### Shared Domain And Schema
- `src/shared/types/domain.ts`
- `src/shared/db/schema.ts`
- `src/shared/db/schema-version.ts`
- `src/shared/db/migrations.ts`

### Feature Contracts
- `src/features/characters/repositories/CharacterRepository.ts`
- `src/features/characters/services/CharacterService.ts`
- `src/features/campaigns/repositories/CampaignRepository.ts`
- `src/features/campaigns/services/CampaignService.ts`
- `src/features/status/repositories/StatusRepository.ts`
- `src/features/status/services/StatusService.ts`
- `src/features/dm-dashboard/services/DmDashboardService.ts`

### Placeholder Surface Language
- `src/features/characters/screens/CharactersScreen.tsx`
- `src/features/campaigns/screens/CampaignsScreen.tsx`
- `src/features/dm-dashboard/screens/DmDashboardScreen.tsx`

## Implementation Sequence
1. Update product and architecture docs.
2. Refactor shared domain types.
3. Refactor the local SQLite schema.
4. Add canonical rebuild migrations for the new ownership model.
5. Refactor repository contracts.
6. Refactor service contracts.
7. Update placeholder-language surfaces.
8. Run typecheck and structural verification.

## UX And Product Requirements
- The app should clearly imply that characters are reusable across campaigns.
- The characters area should read as a personal roster, not a campaign roster.
- Campaign language should describe assigning existing characters rather than creating characters inside a campaign.
- DM language should describe viewing campaign-assigned characters.

## Verification Plan

### Documentation Checks
- The brain docs no longer describe characters as campaign-owned.
- The docs explicitly describe shared build and assignment-scoped live state.

### Type And Contract Checks
- `Character` no longer includes `campaignId`.
- Assignment-scoped types exist for live status and snapshots.
- Repository signatures no longer rely on `listCharacters(campaignId)`.

### Schema Checks
- `characters` has no `campaign_id` column.
- `campaign_characters` exists.
- unique `(campaign_id, character_id)` is enforced.
- live state and snapshots are assignment-scoped.

### Technical Checks
- TypeScript compiles cleanly.
- No compendium or content code is changed unless required by typing fallout.
- The refactor remains structural and does not accidentally broaden feature scope.

## Risks And Tradeoffs
- This refactor touches shared types and schema, so even placeholder-only domains may require coordinated changes.
- Disposable-state migration simplifies implementation, but it assumes no local user data must be preserved.
- If assignment and live-state types are named too vaguely, the old ownership confusion may return later.
- Builder work will be cleaner after this step, but only if build remains character-scoped and status remains assignment-scoped consistently.

## Exit Criteria
Step 7 is complete when all of the following are true:
- source-of-truth docs reflect global characters and campaign assignments
- shared domain types distinguish global character data from campaign-assigned live state
- SQLite schema enforces unique campaign assignment and assignment-scoped live state
- repository and service contracts no longer assume campaign-owned characters
- placeholder surfaces describe the corrected product direction
- typecheck passes
