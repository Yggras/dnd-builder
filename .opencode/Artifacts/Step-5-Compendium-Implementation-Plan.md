# Step 5 Compendium Implementation Plan

## Objective
Implement the first real compendium UI slice for the mobile app by replacing the placeholder compendium screen with a local SQLite-backed search and results experience, plus a read-only detail screen for selected entries.

The outcome of this step is a usable offline-first compendium flow that proves the seeded content runtime can power real app screens without reading generated JSON directly in feature code.

This step intentionally focuses on read-only compendium browsing. It does not yet implement builder integration, rich tagged text rendering, saved state, or advanced filtering.

## Confirmed Decisions
- Runtime source of truth: seeded SQLite content only.
- Search source: `compendium_entries` queried through repository and service boundaries.
- Default browse behavior: empty query still shows useful local results.
- Filtering scope: one lightweight entry-type filter for the first slice.
- Detail rendering strategy: text-first rendering with simple fallback behavior.
- Offline behavior: fully local after bootstrap seeding completes.

## Product Boundary

### Included In Step 5
- Replace the placeholder compendium screen.
- Add a local search input.
- Add a minimal entry-type filter.
- Show local search results from SQLite.
- Add a compendium detail route and screen.
- Show source and edition metadata clearly.
- Keep all reads inside repository, service, and hook boundaries.

### Explicitly Excluded From Step 5
- Builder selection flows.
- Full tagged 5etools render support.
- Saved searches, recent history, or bookmarks.
- Multi-filter faceting beyond the first type filter.
- Server-backed compendium refresh logic.
- Write flows or user content.

## Feature Goals
- The user can open the compendium and immediately browse entries without typing.
- The user can search locally across seeded compendium content.
- The user can narrow results by entry type.
- The user can open a detail screen for any listed entry.
- The detail screen remains useful even before a full compendium renderer exists.

## Architectural Approach

### Search And Browse Flow
Use the existing seeded SQLite compendium dataset through the compendium repository and service layer.

Flow:
1. Compendium screen loads with an empty query.
2. The screen requests local results through a hook backed by React Query.
3. The repository queries SQLite and returns ordered results.
4. The screen updates locally as query text or type filter changes.
5. Selecting a result navigates to a detail route that fetches one entry by ID.

### Repository Strategy
Extend the compendium repository contract rather than bypassing it.

Reason:
- keeps storage details out of screens
- preserves the feature/service architecture already in place
- makes later compendium and builder work easier to build on

### Detail Rendering Strategy
Render the detail screen from plain text fields first.

Reason:
- the seeded runtime already provides stable `text`, `summary`, and metadata
- a full render engine would broaden scope too early
- text-first rendering is enough to validate data usability and navigation flow

## Code Areas To Change

### 1. Compendium Repository
Expand the repository contract to support:
- local search with optional entry-type filtering
- loading a single entry by ID

Expected responsibilities:
- expose query methods only
- hide SQL and SQLite access from feature screens

### 2. Compendium Service
Expand the service boundary to mirror the compendium repository methods.

Responsibilities:
- provide screen-friendly query methods
- remain storage-agnostic

### 3. SQLite Adapter
Extend the SQLite-backed compendium implementation to:
- search entries with optional type filtering
- fetch one entry by ID

Responsibilities:
- query only seeded SQLite tables
- preserve local-first behavior

### 4. Query Keys And Hooks
Add compendium-specific hooks backed by React Query.

Expected hooks:
- `useCompendiumSearch`
- `useCompendiumEntry`

Responsibilities:
- manage search query and selected type state
- use deferred search input where helpful
- expose loading, empty, and error states to screens cleanly

### 5. Compendium Search Screen
Replace the placeholder compendium screen with a usable search and results screen.

Expected UI elements:
- search input
- entry-type filter chips
- results list
- empty state
- inline loading and error states

### 6. Compendium Detail Screen
Add a detail route and screen for entry inspection.

Expected UI elements:
- title
- entry type
- source label
- edition label
- summary text
- body text

## Query Scope For This Step

### Search Screen Queries
The first compendium search slice should support:
- empty-query browsing
- search by text
- filter by one entry type
- stable ordering that favors 2024 and builder-visible entries first

### Detail Screen Queries
The first detail slice should support:
- load by entry ID
- display source and edition context
- render useful text without requiring a full rich renderer

## UX Requirements
- Empty query should still show useful results rather than an empty prompt.
- Edition labeling must be visible enough to distinguish `2024` from `2014`.
- The screen should stay usable offline because all queries are local.
- The first detail screen should prioritize readability over rich formatting.

## Verification Plan

### Functional Checks
- Opening the compendium shows local entries with no query required.
- Typing a query narrows results.
- Changing the entry-type filter narrows results.
- Tapping a result opens the correct detail screen.
- Returning from detail keeps the search screen usable.

### Data Checks
- Searching `Alarm` returns spell entries.
- Searching `Artificer` returns class entries.
- A `2014` entry is labeled clearly.
- A `2024` entry is labeled clearly.

### Technical Checks
- TypeScript compiles cleanly.
- Feature code does not read generated JSON directly.
- Search and detail reads come through SQLite-backed repository methods.

## Risks And Tradeoffs
- A text-first detail screen is useful sooner, but it will not yet reflect all structured compendium content richly.
- Returning the full local list for an empty query is simple and practical, but list performance may need later refinement as the UI grows.
- A single type filter keeps the first slice small, but later compendium UX will likely need richer faceting.

## Exit Criteria
Step 5 is complete when all of the following are true:
- the placeholder compendium screen is replaced with a real search/results screen
- compendium reads come from seeded SQLite data through the repository and service layers
- empty-query browsing works
- type filtering works
- detail navigation works
- detail loading by entry ID works
- source and edition labels are visible
- TypeScript and manual compendium verification pass
