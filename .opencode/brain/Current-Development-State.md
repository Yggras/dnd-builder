# Current Development State

## Purpose
This is the living implementation overview for AI agents working on this project. Update this document after every feature implementation, meaningful refactor, schema/content-pipeline change, or verification pass that changes the project state.

This document answers:
- what has already been implemented
- where the important code lives
- what is intentionally deferred or still incomplete
- which commands verify the current implementation
- what future agents should not accidentally redo

## Update Policy
After each completed feature or implementation step:
- Update the relevant implemented/incomplete sections below.
- Add or revise important file references.
- Record verification commands run and their result.
- If a feature supersedes an older artifact plan, say so explicitly.
- If work is only partially complete, describe the exact remaining gap.
- Keep this file factual and current; do not use it as a speculative roadmap.

## Project Snapshot
- Product: Private mobile D&D party app for a guided character builder, live character/session surfaces, and searchable rules compendium.
- Platform: Expo Router, React Native, TypeScript.
- Backend direction: Supabase for auth/database/realtime; only auth is substantially wired in the client today.
- Local-first storage: SQLite on native via Expo SQLite.
- Content model: pre-generated, bundled 5e-compatible content from a curated 5etools-style pipeline.
- Current development focus: character builder stabilization and next builder UX/maintainability chunks.

## Verification Commands
Use `npm`, not `pnpm` or `yarn`.

Current verification commands:
- `npm run typecheck`
- `npm run audit:5etools`

Current status as of 2026-05-03:
- `npm run typecheck` passes.
- `npm run audit:5etools` passes.
- The 5etools audit reports 8 unmatched subclass feature details out of 1332 as a non-failing diagnostic.

Do not run `npm run generate:5etools` casually. It rewrites generated content and stamps generated timestamps.

## Startup And App Shell
Implemented:
- Root startup is `app/_layout.tsx` -> `AppProviders` -> `AppBootstrapGate` -> route stack.
- `AppProviders` wires gesture handling, safe area, React Query, and auth context.
- `AppBootstrapGate` blocks rendering until local database and bundled content bootstrap complete.
- `useAppBootstrap()` initializes SQLite first, then calls bundled content bootstrap.
- Native SQLite lives in `src/shared/db/sqlite.native.ts`.
- Web/non-native persistence remains a stub/in-memory path and does not exercise native seeding behavior.

Key files:
- `app/_layout.tsx`
- `src/shared/providers/AppProviders.tsx`
- `src/shared/providers/AppBootstrapGate.tsx`
- `src/shared/hooks/useAppBootstrap.ts`
- `src/shared/db/sqlite.native.ts`
- `src/shared/db/sqlite.ts`

## Runtime Configuration
Implemented:
- Public environment validation exists in `src/shared/config/env.ts`.
- Required variables are documented in `.env.example`.
- Supabase credentials are not supplied by `app.json`; local env files or runtime env are required.

Important behavior:
- Missing env vars fail early at import/startup.

## Auth
Implemented:
- Supabase email/password sign-in for manually provisioned users.
- No sign-up flow in app UI.
- No password reset flow in app UI.
- Auth context exposes session, user, loading state, `signInWithPassword`, and `signOut`.
- Route groups redirect based on session state.

Key files:
- `src/shared/supabase/client.ts`
- `src/features/auth/adapters/SupabaseAuthRepository.ts`
- `src/features/auth/services/AuthService.ts`
- `src/shared/providers/AuthProvider.tsx`
- `src/features/auth/screens/SignInScreen.tsx`
- `app/(auth)/_layout.tsx`
- `app/(app)/_layout.tsx`

External verification still needed:
- Confirm Supabase dashboard has self-signup disabled.
- Confirm manually created users are confirmed or otherwise able to log in.

## Local SQLite Schema And Migrations
Implemented:
- Fresh schema in `src/shared/db/schema.ts`.
- Migration runner in `src/shared/db/migrations.ts`.
- Schema version helpers in `src/shared/db/schema-version.ts`.
- Current local tables include campaigns, campaign members, global characters, character builds, campaign character assignments, assignment-scoped statuses/snapshots, content entities, compendium entries, choice grants, seed metadata, pending mutations, and sync metadata.

Important schema rules:
- Fresh installs use `schema.ts`.
- Existing installs upgrade through `migrations.ts`.
- If local DB structure changes, update `schema.ts`, add a migration, and bump `LATEST_LOCAL_SCHEMA_VERSION`.

Known state:
- `character_builds` has explicit `build_state`, `current_step`, `revision`, timestamps, and JSON `payload`.
- Roster-visible labels such as class/species are still derived from payload, not explicit columns.

## Bundled Content Pipeline
Implemented:
- Generator entry point: `scripts/generate-5etools.mjs`.
- Importer modules under `scripts/5etools-importer/`.
- Generated content is checked in under `generated/5etools/`.
- Typed generated registry is `src/shared/content/generated/5etoolsRegistry.ts`.
- Native bootstrap seeds generated chunks into SQLite and skips reseed when content version matches.
- Content versioning is automatic/deterministic from generated content, not a manual version bump.
- Audit script validates generated coverage and selected content-policy rules.

Supported generated content:
- Builder-ready/reference content: classes, subclasses, species, backgrounds, feats, spells, items, optional features.
- Builder-light/reference support: action, condition, variant rule content exists in compendium pipeline.
- Item property and item mastery rule pages are generated as `variantrule` records.

Important commands:
- `npm run generate:5etools`
- `npm run audit:5etools`

Key files:
- `scripts/generate-5etools.mjs`
- `scripts/audit-5etools.mjs`
- `scripts/5etools-importer/config.mjs`
- `scripts/5etools-importer/normalize.mjs`
- `scripts/5etools-importer/write.mjs`
- `src/shared/content/bootstrap.native.ts`
- `src/shared/content/generated/5etoolsRegistry.ts`

Known diagnostics:
- 8 unmatched subclass feature details are reported by audit but do not fail the audit.

## Edition And Builder Compatibility Policy
Implemented:
- Actual visible edition is separated from builder selectability.
- `rulesEdition` and `isLegacy` reflect actual source edition.
- Builder availability uses `isSelectableInBuilder`.
- Compatible legacy content can be selectable while still displaying as `2014` / legacy.
- Audit covers raw `classic` / `one` markers and targeted Artificer records.

Important supersession:
- Older Step 5c expectations that compatible supplement sources should display as `2024` are superseded by Step 22. Do not reintroduce compatibility-driven visible edition labels unless product policy changes.

Key files:
- `scripts/5etools-importer/utils.mjs`
- `scripts/5etools-importer/normalize.mjs`
- `scripts/audit-5etools.mjs`
- `src/features/content/adapters/SQLiteContentRepository.ts`

## Content Repository And Services
Implemented:
- SQLite content repository implements content browsing, builder-selectable listing, compendium search/detail, reference lookup, and choice grants.
- Content service exposes builder-oriented methods and browse-oriented methods.
- Builder list methods default to `onlySelectableInBuilder = true`.
- Browse methods include legacy/non-builder-selectable content.

Key files:
- `src/features/content/adapters/SQLiteContentRepository.ts`
- `src/features/content/services/ContentService.ts`
- `src/features/content/repositories/ContentRepository.ts`
- `src/features/compendium/repositories/CompendiumRepository.ts`
- `src/features/compendium/services/CompendiumService.ts`

## Compendium
Implemented:
- Category-first compendium home.
- Category browse route: `app/(app)/compendium/category/[category].tsx`.
- Detail route: `app/(app)/compendium/[entryId].tsx`.
- Class route: `app/(app)/compendium/class/[classId].tsx`.
- Local SQLite-backed search and detail loading through repository/service/hook boundaries.
- Detail views for spells, items, feats, species, backgrounds, subclasses, classes, and generic entries.
- Rich block renderer handles common structured entries, lists, tables, and inline text.
- Inline references resolve and navigate for supported content types.
- Reference-only content such as actions, conditions, and variant rules is searchable and readable.
- Weapon item facts show range, readable/clickable properties, and weapon mastery links.

Key files:
- `src/features/compendium/screens/CompendiumHomeScreen.tsx`
- `src/features/compendium/screens/CompendiumCategoryScreen.tsx`
- `src/features/compendium/screens/CompendiumDetailScreen.tsx`
- `src/features/compendium/screens/CompendiumClassScreen.tsx`
- `src/features/compendium/hooks/useCompendiumCategoryBrowse.ts`
- `src/features/compendium/utils/catalog.ts`
- `src/features/compendium/utils/detailFacts.ts`
- `src/features/compendium/utils/detailBlocks.ts`
- `src/features/compendium/utils/inlineText.ts`
- `src/features/compendium/utils/inlineReferences.ts`
- `src/features/compendium/components/RenderBlockList.tsx`
- `src/features/compendium/components/RichTextLine.tsx`
- `src/features/compendium/components/DetailFactGrid.tsx`

Known compendium gaps:
- The app has an `Items` category with mundane/magic filtering, not separate top-level `Equipment` and `Magic Items` categories.
- There is no single authoritative category registry; category behavior is split across catalog and browse utilities.
- Most category filtering/sorting is done in JavaScript after broad repository reads rather than directly in SQLite.
- Spell detail facts attempt to read `metadata.time`, but spell normalization does not currently persist spell casting time.
- Background equipment summary is not elevated into the background fact grid.
- Inline reference links are underlined but do not have explicit pressed-state feedback.
- Spell filter order differs from one historical execution plan; functionality exists.

## Characters And Roster
Implemented:
- Characters are global player-owned records, not campaign-owned records.
- New character flow creates a draft character and `character_build`.
- Owned character roster exists with loading, empty, error, draft/complete states, and navigation into builder/preview.
- Character build saves update character name and level from builder payload.
- Character build save path has local stale-revision protection.

Key files:
- `src/features/characters/screens/CharactersScreen.tsx`
- `src/features/characters/screens/NewCharacterScreen.tsx`
- `src/features/characters/hooks/useOwnedCharacters.ts`
- `src/features/characters/hooks/useCharacterRecord.ts`
- `src/features/characters/hooks/useCreateCharacterDraft.ts`
- `src/features/characters/hooks/useSaveCharacterBuild.ts`
- `src/features/characters/adapters/SQLiteCharacterRepository.ts`
- `src/features/characters/services/CharacterService.ts`

Known roster gaps:
- Roster class/species labels are still derived by parsing build payload.
- Preview/roster labels are not fully content-backed everywhere and may derive labels from IDs in some paths.

## Campaigns, Assignments, Status, And Sync
Implemented structurally:
- Domain model separates global characters from campaign assignments.
- Local schema includes `campaign_characters`, `campaign_character_statuses`, and `campaign_character_snapshots`.
- Campaign assignment uniqueness is enforced locally with `UNIQUE(campaign_id, character_id)`.
- Basic repository/service scaffolding exists for campaigns, status, and sync.

Not yet implemented as full product behavior:
- Invite-based campaign joining.
- Real DM dashboard with live party status.
- Realtime campaign subscriptions beyond scaffolding.
- Offline pending mutation replay against Supabase.
- Server-generated campaign character snapshots.
- Assignment-scoped live character screen with HP/slots/conditions/death saves.

Key files:
- `src/features/campaigns/*`
- `src/features/status/*`
- `src/features/sync/*`
- `src/shared/supabase/realtime.ts`

## Character Builder
Implemented:
- Builder state model with steps: class, spells, species, background, ability-points, inventory, characteristics, notes, review.
- Draft/complete lifecycle exists.
- Autosave exists and has been stabilized with latest-write-safe serialized saves.
- Save state is exposed as saved/dirty/saving/error and shown in the builder header.
- Completion save is explicit and guarded against in-flight/error saves.
- Local save rejects stale revisions and increments from persisted revision.
- Query/cache save handling avoids overwriting newer local draft state with older saved results.
- Reconciliation effects use functional updates for class, origin/abilities, inventory, and spell/source summaries.
- Completed builds regress to draft when reconciliation introduces unresolved blocking/checklist issues.
- Class allocations support multiclass allocation, class levels, subclass timing, and class-owned feature choices.
- Species/background selection exists with deterministic applied summaries and granted-feat follow-up choices.
- Ability score UI supports manual base score entry, origin ability packages, and ASI point controls.
- Spell step supports selected/known/prepared spell state, strict overfill/max-level checks, applicable spell filtering, and manual exception notes.
- Inventory step supports starting equipment option choices, seeding canonical items/currency/unresolved gear, adding canonical items, editing quantity/equipped/attuned, and preserving manual items on reseed.
- Inventory reconciliation flags stale starting equipment context after class/background changes.
- Review section groups blockers, checklist items, notices, and overrides.
- Completion routes to a lightweight preview.

Key files:
- `src/features/builder/types/index.ts`
- `src/features/builder/services/BuilderService.ts`
- `src/features/builder/screens/CharacterBuilderScreen.tsx`
- `src/features/builder/screens/CharacterPreviewScreen.tsx`
- `src/features/builder/hooks/useBuilderDraftState.ts`
- `src/features/builder/hooks/useBuilderReconciliation.ts`
- `src/features/builder/hooks/useCharacterBuilderContent.ts`
- `src/features/builder/components/BuilderSpellsSection.tsx`
- `src/features/builder/components/BuilderReviewSection.tsx`
- `src/features/builder/utils/classStep.ts`
- `src/features/builder/utils/originAndAbilities.ts`
- `src/features/builder/utils/spellReview.ts`
- `src/features/builder/utils/inventory.ts`
- `src/features/builder/utils/review.ts`

Known builder gaps:
- `CharacterBuilderScreen.tsx` is still large and renders most sections at once; it is not yet a true active-step wizard.
- Several handlers in `CharacterBuilderScreen.tsx` still use captured `draftBuild` / `payload` with direct object setters, which remains a stale-state risk during rapid edits or reconciliation.
- There is no separate `review without reseed` action for starting equipment context.
- Manual Step 23 builder smoke checks are still needed.
- Content loading in the builder is eager for all items and all spells; later performance work should make these more on-demand.
- Override workflow is not yet a full advanced, explicit, per-issue workflow with required reasons.

## UI And Design System
Implemented:
- Shared theme tokens exist.
- Shared primitives exist for screen shell, cards, buttons, loading, empty, error, and feature placeholders.
- Auth, home, compendium, details, roster, builder, and preview use the shared visual language.

Key files:
- `src/shared/ui/theme.ts`
- `src/shared/ui/Screen.tsx`
- `src/shared/ui/SurfaceCard.tsx`
- `src/shared/ui/PrimaryButton.tsx`
- `src/shared/ui/LoadingState.tsx`
- `src/shared/ui/ErrorState.tsx`
- `src/shared/ui/EmptyState.tsx`
- `src/shared/ui/FeaturePlaceholder.tsx`

## Important Historical Artifact Status
- Step 21 import coverage audit and class variant reachability: implemented; only historical pre-fix baseline audit remains unchecked.
- Step 22 edition labeling and builder compatibility separation: implemented.
- Step 23 weapon item facts/range/properties/mastery links: implemented.
- Step 23 builder stabilization: implemented; remaining unchecked items are manual smoke checks.
- Full execution-step gap audit is documented in `.opencode/brain/Execution-Step-Implementation-Gaps.md`.

## Do Not Rebuild Accidentally
- Do not reintroduce compatibility-driven visible `2024` labels for legacy-compatible content; Step 22 intentionally separated labels from selectability.
- Do not add user-facing homebrew/import workflows for v1.
- Do not add custom/manual inventory items for v1; inventory items should reference canonical content.
- Do not add a global top-level `Subclasses` compendium category unless product direction changes; subclass discovery is class-scoped.
- Do not assume `npm run web` validates native SQLite seeding/persistence.
- Do not run generated content regeneration unless the task requires content pipeline changes.

## Recommended Next Technical Work
Keep this list current as implementation progresses.

Near-term candidates:
- Finish Step 23 builder stabilization acceptance by running manual smoke checks.
- Convert builder UI into a true active-step wizard with previous/next navigation and per-step completion/issue state (Step 25).
- Reduce eager builder content loading for spells and items.
- Make preview and roster labels content-backed.

Longer-term product areas:
- Assignment-scoped live character screen.
- DM dashboard with live party status.
- Supabase-backed campaign membership/invites.
- Offline pending mutation replay and conflict handling.
- Realtime subscriptions for campaign status/snapshots.
