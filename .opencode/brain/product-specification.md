# Product Specification: Private D&D Party App

## Summary
Build a private cross-platform mobile app for a Dungeons & Dragons group that combines a guided character builder, a live character screen for in-session play, and a searchable rules compendium. The app must support shared sync so the Dungeon Master can monitor all party members’ current status in real time, while still working offline for core table use.

## Problem
D&D groups often split character data, rules lookup, and session tracking across multiple tools. That creates friction during character creation, slows down rules lookup, and makes it hard for the DM to maintain a current overview of the party during play.

## Goals
- Provide a mobile-first character builder for player characters.
- Provide a fast character screen optimized for live session use.
- Provide a searchable compendium for spells, feats, items, and related 5e content.
- Let the DM view all party characters and their live status in one place.
- Support shared sync across users and devices.
- Support offline-first core use during game sessions.

## Non-Goals
- Public redistribution of third-party rules content.
- Dice rolling, encounter tracking, chat, or combat automation in v1.
- Full in-app homebrew editing in v1.
- Public app-store distribution assumptions for bundled rules data.
- Support for multiple tabletop systems in v1.

## Users and Stakeholders
- Players who create, manage, and use their own characters.
- The DM who needs a live overview of all party characters.
- The group as a whole, which shares imported content and homebrew privately.

## Resolved Decisions
- Platform: iOS and Android mobile app.
- Collaboration model: shared sync is required.
- Permissions: players edit their own characters; DM has read-only access to all characters.
- Builder depth: guided and validated, but flexible with manual overrides.
- DM overview: includes live session status, not just static sheets.
- Offline support: offline-first for core use.
- Content model: private app for the group, with 5etools-compatible imports.
- Homebrew model: import JSON content packs rather than build a full editor in v1.

## Requirements and Approach
- Create a private campaign model with DM ownership and player membership.
- Support invite-based campaign joining.
- Authenticate users with a low-friction login flow.
- Store character build data separately from live character status.
- Represent build data for class, subclass, level progression, abilities, proficiencies, feats, spells, inventory, notes, and overrides.
- Represent live status for HP, temporary HP, AC, spell slots, conditions, exhaustion, concentration, death saves, and similar session state.
- Generate a derived character snapshot for fast rendering in character and DM views.
- Provide a step-based builder flow with validation, prerequisite warnings, and override paths.
- Provide a live character screen optimized for quick updates during play.
- Provide a DM dashboard listing all party members with current status summaries and drill-down access.
- Support import of structured JSON packs compatible with a 5etools-style content model.
- Normalize imported content into searchable compendium entries with shared fields for type, name, source, searchable text, metadata, and raw payload.
- Support campaign-scoped shared homebrew content.
- Cache compendium data and character data locally for offline use.
- Queue local edits offline and sync when connectivity returns.
- Use simple versioning or timestamps for v1 conflict handling.

## Public Interfaces and Data Shapes
- Roles: `dm`, `player`
- Core entities: `campaign`, `campaign_member`, `character`, `character_build`, `character_status`, `character_snapshot`, `content_pack`, `compendium_entry`, `import_job`
- Compendium entry minimum shape:
  - `entry_type`
  - `name`
  - `source`
  - `slug`
  - `text`
  - `metadata`
  - `raw_json`
  - `scope`
- Sync contract:
  - Client reads cached local state first.
  - Client syncs with server state when online.
  - Client subscribes to remote updates for shared campaign data.

## Constraints and Dependencies
- The app is intended for private group use, not public content distribution.
- Content ingestion must not assume licensed redistribution rights.
- Offline support is required for core session workflows.
- Shared sync requires backend auth, storage, and realtime update support.
- Builder logic must tolerate incomplete automation because imported or homebrew content may not fit rigid rules enforcement.

## Risks and Tradeoffs
- Strict rules automation would increase scope substantially, so v1 will favor guided validation plus overrides.
- Shared sync plus offline editing introduces conflict risk; v1 should prefer simple, predictable resolution over sophisticated merge behavior.
- 5etools-compatible import support increases content coverage but requires a clear private-use ingestion boundary.
- Search and compendium normalization may need iteration as imported content types expand.

## Open Questions
- Whether the target rules baseline is 5e 2014, 2024, or a hybrid compatibility model.
- Whether the DM should later gain optional edit access for assisting with leveling and maintenance.
- Whether the group will eventually want campaign notes, encounter tools, or dice features in a later phase.
- Whether import should happen only through DM tools or also through an external admin utility.

## Delivery Plan
1. Set up mobile app foundation, auth, campaign membership, and invite flow.
2. Build backend schema and sync model for characters, status, and campaigns.
3. Implement compendium import pipeline and mobile search experience.
4. Implement character domain model and guided builder flow.
5. Implement live character screen for session updates.
6. Implement DM dashboard with shared realtime status visibility.
7. Harden offline caching, sync replay, and conflict handling.

## Success Signals
- A player can create and maintain a usable character fully in the app.
- The DM can see the current state of all party characters during a session.
- Rules lookup is fast enough to replace external browsing for common use.
- Core character and compendium workflows remain usable without internet.
- Imported shared content is visible only to the intended private group.

## Assumptions
- Recommended stack: Expo/React Native with TypeScript for client, Supabase for auth/database/realtime, and local SQLite-based caching for offline support.
- Email magic-link authentication is sufficient for v1 unless stronger identity needs emerge.
- The DM is the campaign owner and primary importer of shared content.
- V1 focuses on player characters, not full NPC or monster management.

## Interview Record
- User wants a mobile app for a D&D group.
- Required pillars are character builder, character screen, and searchable rules database.
- The DM needs an overview of all characters and their current status.
- Shared sync is required.
- Offline-first behavior is required.
- 5etools-compatible content support is desired.
- The app is intended for private group use.