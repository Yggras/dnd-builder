# Architecture: Private D&D Party App v1

## Overview
This document proposes a first-pass technical architecture for the private D&D party app described in `product-specification.md`. It is intended as a discussion starter, not a locked implementation contract.

For the agreed v1 content scope and rules policy, see `Content-Strategy.md`. Where the two documents overlap, `Content-Strategy.md` is the more specific source of truth for 5e data handling.

The app targets iOS and Android and combines three core surfaces:
- a guided character builder
- a live character screen for in-session play
- a searchable compendium for preloaded 5e-compatible content

The most important architectural requirement is the combination of offline-first core use and shared sync so the DM can monitor live party state.

## Goals
- Support iOS and Android from a single mobile codebase.
- Provide a guided but flexible character builder.
- Provide a fast live character screen optimized for play at the table.
- Provide searchable compendium access to preloaded 5e-compatible content.
- Support shared sync across players and the DM.
- Keep core character and compendium workflows usable offline.

## Non-Goals
- Public redistribution of third-party rules content.
- Dice rolling, combat automation, encounter tools, or chat in v1.
- Full in-app homebrew authoring in v1.
- Multi-system tabletop support in v1.

## Inferred Product and Technical Requirements
- The product is a private mobile app, not a public rules distribution platform.
- The DM owns campaigns and has read-only visibility into characters assigned to their campaign in v1.
- Players edit only their own characters.
- Characters are player-owned global records that can be assigned to multiple campaigns.
- Character build data must be stored separately from assignment-scoped live status data.
- A derived assignment snapshot is needed for fast rendering in player and DM views.
- Content is prepared ahead of time from 5eTools-style source data and shipped as a curated preloaded dataset.
- Offline reads and writes are required for core table workflows.
- Remote changes must flow back to devices in near real time when online.

## Recommended Stack
These align with the assumptions already captured in the product spec.

- Client: Expo + React Native + TypeScript
- State/query layer: React Query plus feature-local state
- Local persistence: SQLite on device
- Backend platform: Supabase
- Primary database: PostgreSQL
- Auth: Supabase Auth with email/password login for manually provisioned users
- Realtime: Supabase Realtime subscriptions
- Server-side logic: TypeScript edge/server functions for snapshot generation, guarded mutations, and content version/bootstrap workflows

## Architectural Decisions
### Project Structure
Feature-first.

Reason: the domain is naturally segmented into auth, campaigns, characters, compendium, content, and sync. This will scale better than separating files only by technical layer.

### Service Type
Full-stack mobile app with managed backend services.

Reason: the repo is greenfield and the product scope does not justify microservices. A managed backend keeps v1 smaller and better matched to the app's real-time and auth needs.

### Data Stores
PostgreSQL in Supabase plus SQLite on-device.

Reason: the product needs a server-side source of truth and a local offline cache with queued writes.

### Integration Style
Typed service layer over REST-style endpoints and Supabase SDK access.

Reason: this keeps the client simple, avoids over-committing to a tightly coupled RPC pattern, and works well for mobile.

### Real-Time Method
Supabase Realtime subscriptions.

Reason: the DM dashboard and shared campaign state need near-live updates without building a custom WebSocket layer in v1.

### Auth Strategy
Supabase session auth with email and password for manually provisioned users.

Reason: the app is private and admin-managed, so login-only email/password auth keeps access control simple without adding registration or email-link flows.

### Error Handling
Typed domain errors plus consistent user-safe client error mapping.

Reason: sync, content bootstrap, and validation failures need stable error codes that the client can present clearly without exposing internals.

## High-Level Architecture
The system is split into five main areas:
- auth and membership
- campaigns and invites
- characters
- compendium and content
- sync and offline reconciliation

High-level flow:
1. The mobile client reads from SQLite first.
2. When online, it refreshes state from the backend.
3. Local writes update the UI immediately and are added to a pending mutation queue.
4. The sync layer replays queued mutations when connectivity is available.
5. Realtime subscriptions patch shared campaign data into the local cache.
6. The server regenerates campaign character snapshots after relevant build or status changes.

## Domain Model
Core entities from the product spec:
- `campaign`
- `campaign_member`
- `character`
- `character_build`
- `campaign_character`
- `campaign_character_status`
- `campaign_character_snapshot`
- `compendium_entry`

Additional supporting entities recommended for implementation:
- `user`
- `campaign_invite`
- `content_bundle`
- `content_version`
- `pending_mutation` on client only
- `sync_cursor` or `sync_metadata` on client only

### Character Data Separation
The separation between build, status, and snapshot should remain a central design decision.

- `character_build`: long-lived progression and configuration choices
- `campaign_character_status`: fast-changing session state such as HP, slots, conditions, concentration, death saves for one campaign assignment
- `campaign_character_snapshot`: a derived, read-optimized projection used by the live character screen and DM dashboard within one campaign

This keeps high-frequency session updates from being entangled with builder workflows and prevents live state from leaking across campaigns.

## Data Storage Design
### Server-Side PostgreSQL
Suggested tables:
- `users`
- `campaigns`
- `campaign_members`
- `campaign_invites`
- `characters`
- `character_builds`
- `campaign_characters`
- `campaign_character_statuses`
- `campaign_character_snapshots`
- `content_bundles`
- `content_versions`
- `compendium_entries`

Recommended storage rules:
- use row-level security for campaign scoping
- use `created_at`, `updated_at`, and version or revision columns on mutable records
- keep source content lineage and content version metadata for traceability and reprocessing
- store searchable text and structured metadata separately for compendium entries

### Client-Side SQLite
Suggested local tables:
- `campaigns`
- `campaign_members`
- `characters`
- `character_builds`
- `campaign_characters`
- `campaign_character_statuses`
- `campaign_character_snapshots`
- `compendium_entries`
- `pending_mutations`
- `sync_metadata`

Recommended local rules:
- boot the app from local cache first
- mark records with sync status where needed
- keep the mutation queue durable across app restarts

## Permissions Model
Roles:
- `dm`
- `player`

Access rules:
- the DM owns a campaign
- the DM can view all characters assigned to their campaign
- players can only create and edit their own characters
- v1 rules content is globally available to authenticated users as a preloaded dataset
- the DM is read-only over player characters assigned to their campaign in v1

This access model should be enforced in the database and not trusted to the client alone.

## Client Architecture
Recommended top-level client modules:
- `auth`
- `campaigns`
- `invites`
- `characters`
- `builder`
- `status`
- `dm-dashboard`
- `compendium`
- `content`
- `sync`
- `shared`

Recommended client layering inside each feature:
- screens
- hooks or use-cases
- repositories
- local SQLite adapters
- remote API and realtime adapters
- domain types and mappers

## Backend Responsibilities
Even with Supabase as the platform, some server-owned logic is still needed:
- campaign invite issuance and acceptance rules
- guarded character mutations and campaign assignment rules
- content bootstrap and version negotiation
- normalization pipeline execution outside runtime app flows
- snapshot generation after build or status changes
- audit logging for membership and major content version changes

## API and Service Surface
The mobile client should not talk directly to every table operation. Some workflows should be exposed through explicit service boundaries.

Suggested service areas:
- auth and session
- campaigns
- invites
- characters
- character status
- compendium
- content bootstrap
- sync bootstrap

Representative endpoints or service operations:
- `POST /campaigns`
- `POST /campaigns/:id/invites`
- `POST /invites/accept`
- `GET /campaigns/:id/bootstrap`
- `GET /campaigns/:id/characters`
- `POST /campaigns/:id/characters`
- `PUT /characters/:id/build`
- `PATCH /campaign-characters/:id/status`
- `GET /compendium/search`
- `GET /content/bootstrap`
- `GET /content/version`

## Offline and Sync Model
### Read Path
- app launches from SQLite cache
- background sync refreshes campaign, character, and compendium data
- realtime updates patch shared records while online

### Write Path
- local changes are applied optimistically
- each mutation is written to `pending_mutations`
- the sync engine retries queued mutations when online
- successful writes clear the queue entry and update local metadata
- failed writes remain queued with retry state and surfaced diagnostics

### v1 Conflict Strategy
Use simple versioning or timestamps as described in the product spec.

Recommended approach:
- `campaign_character_status`: last-write-wins with version or `updated_at`
- `character_build`: reject stale writes and ask client to refresh before retrying
- `campaign_character_snapshot`: always regenerated from canonical server state

This keeps conflict handling predictable and narrow in v1.

## Realtime Design
Subscribe at the campaign scope to changes in:
- `character_status`
- `character_snapshot`
- `campaign_member`
- optional content version announcement events

Realtime is an acceleration layer, not the source of truth.

If a realtime event is missed, the client should recover through background sync and bootstrap refresh.

## Character System Design
### Builder Flow
Suggested guided steps:
1. campaign and character identity
2. species or ancestry
3. class and subclass
4. abilities
5. proficiencies
6. feats
7. spells
8. inventory
9. notes and manual overrides

Validation rules:
- validate prerequisites where the preprocessed content model is structured enough
- show warnings when automation is uncertain
- allow manual overrides with explicit override metadata

### Live Character Screen
The live screen should optimize for the most frequently changed session fields:
- HP and temporary HP
- AC
- spell slots
- conditions
- exhaustion
- concentration
- death saves
- notes

### Snapshot Projection
The snapshot should be persisted rather than computed on every view load.

Reason:
- it simplifies DM dashboard reads
- it gives a single fast render shape for mobile
- it reduces repeated client-side derivation from multiple sources

## Compendium and Content Pipeline
### Input Model
The system uses a preprocessed curated dataset derived from 5eTools-style source content. There is no user-facing import flow in v1.

### Preprocessing Stages
1. collect supported source data ahead of runtime
2. validate and normalize supported entity types
3. derive builder-oriented records
4. generate searchable compendium records
5. version the resulting content bundle
6. ship or publish the content bundle for app/bootstrap use

### Compendium Entry Shape
Minimum fields from the product spec:
- `entry_type`
- `name`
- `slug`
- `source_code`
- `source_name`
- `rules_edition`
- `is_legacy`
- `summary`
- `text`
- `search_text`
- `metadata`
- `render_payload`

### Search Approach
Start with:
- local text search over cached entries
- faceted filtering by type and source
- server refresh for uncached or updated bundled content

Avoid semantic or vector search in v1.

### Content Scope
V1 content scope is intentionally curated and should follow `Content-Strategy.md`:
- Builder-ready: classes, subclasses, species/races, backgrounds, feats, spells, items, optional features
- Builder-light: languages as a selectable list
- Reference-only: conditions, variant rules, tables
- Excluded from v1: boons, monsters/creatures, NPC stat blocks, hazards, objects, vehicles, cults, rewards, diseases, deities, and all homebrew workflows

### Edition Policy
V1 is 2024-first with legacy 2014 content allowed.

That means:
- all campaigns behave as 2024 campaigns
- legacy 2014 content remains available
- legacy content must be clearly labeled in compendium and builder flows
- no 2014-only campaign mode in v1
- no automatic conversion between 2014 and 2024 rules

## Security and Content Boundaries
- all shared data must be campaign-scoped
- row-level security should back every access rule
- preloaded rules content is app-managed rather than user-imported in v1
- no public browsing or anonymous content APIs
- homebrew and user-imported content are explicitly deferred to v2

## Observability
Track at minimum:
- auth success and failure
- invite acceptance flow completion
- content bootstrap success and failure rate
- snapshot generation latency
- sync success and failure rate
- pending mutation queue depth
- compendium search latency
- realtime connection and reconnect health

## Delivery Plan
### Phase 1
- mobile app foundation
- auth flow
- campaign model
- invites and membership
- local SQLite foundation

### Phase 2
- backend schema for campaigns and characters
- sync bootstrap flow
- character build and status storage
- snapshot generation pipeline

### Phase 3
- guided builder flow
- live character screen
- DM dashboard with party overview

### Phase 4
- content normalization pipeline
- content bundle generation
- local compendium cache and search

### Phase 5
- offline queue hardening
- conflict handling polish
- realtime reliability and instrumentation

## Risks and Tradeoffs
- offline plus shared realtime sync is the main technical risk
- supporting both 2024 and legacy 2014 content adds builder and labeling complexity
- rigid builder automation would expand scope too much, so v1 should prefer guidance plus overrides
- preprocessed content must remain clearly separate from any future homebrew/import path
- snapshot generation may become expensive if recalculated too broadly

## Open Questions
- Should the DM remain read-only in v1, or should assisted edits be included early?
- Should snapshot regeneration happen synchronously on writes or via background jobs?
- How much builder validation should block progression versus show warnings?

## Proposed Next Discussion Topics
1. Confirm the stack: Expo, Supabase, PostgreSQL, SQLite.
2. Confirm that server state is canonical and clients replay queued local mutations.
3. Confirm that `character_snapshot` is a persisted projection.
4. Confirm the v1 permissions boundary for DM read-only access.
5. Define the normalized data model for the included v1 content types.
