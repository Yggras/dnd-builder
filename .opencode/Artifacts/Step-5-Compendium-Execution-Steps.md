# Step 5 Compendium Execution Steps

## Goal
Execute the first compendium UI phase in a controlled sequence so the app gains a real local-first compendium search and detail flow, without jumping ahead into builder integration or a full rich-content renderer.

## Execution Rules
- Do not read generated JSON directly from compendium screens.
- Do not bypass repository and service boundaries.
- Keep the first compendium slice read-only.
- Prefer the smallest useful search and detail flow over broad compendium feature creep.
- Verify SQLite-backed behavior before considering richer rendering work.

## Step-By-Step Execution Sequence

### 1. Confirm The Runtime Compendium Contract
- Confirm `compendium_entries` is the only runtime source for the compendium screens.
- Confirm the compendium screen should work with empty-query browsing.
- Confirm type filtering stays lightweight in this step.

Output:
- stable UI contract for the first compendium slice.

### 2. Expand The Compendium Repository Contract
- Add search with optional entry-type filtering.
- Add fetch-by-ID support for detail navigation.

Output:
- compendium repository boundary aligned to the new UI needs.

### 3. Expand The Compendium Service
- Mirror the repository methods at the service level.
- Keep the service screen-friendly and storage-agnostic.

Output:
- simple compendium service interface for hooks and screens.

### 4. Extend The SQLite-Backed Compendium Adapter
- Implement filtered search over seeded SQLite data.
- Implement entry lookup by ID.
- Preserve local ordering that favors 2024-first results.

Output:
- local data adapter ready for real compendium UI reads.

### 5. Add Query Keys And Hooks
- Add compendium search query keys.
- Add a hook for search and filter state.
- Add a hook for detail loading by ID.

Output:
- screen-ready compendium state layer.

### 6. Replace The Placeholder Search Screen
- Remove the placeholder compendium screen.
- Add a search input.
- Add entry-type filter chips.
- Render local results.
- Add empty, error, and loading states.

Output:
- usable local compendium browse and search screen.

### 7. Add The Detail Route And Screen
- Add a route under `/(app)/compendium/[entryId]`.
- Load the selected entry by ID.
- Render title, metadata, summary, and text-first detail content.

Output:
- usable read-only compendium detail screen.

### 8. Wire Navigation Into The Authenticated App Stack
- Register the new detail route in the app stack.
- Ensure result taps navigate correctly.

Output:
- compendium navigation path integrated into the app shell.

### 9. Verify Search And Detail Behavior
- Open the compendium with no query and confirm local results appear.
- Search `Alarm` and confirm spell results appear.
- Search `Artificer` and confirm class results appear.
- Apply a type filter and confirm results narrow correctly.
- Open at least one detail screen from results.

Output:
- compendium UI behavior verified against local data.

### 10. Run Technical Verification
- Run TypeScript typecheck.
- Confirm no feature code reads generated JSON directly.
- Confirm repository and service boundaries remain intact.

Output:
- validated Step 5 compendium baseline.

## Task List
1. Confirm the runtime compendium contract.
2. Expand the compendium repository contract.
3. Expand the compendium service layer.
4. Implement SQLite-backed search and fetch-by-ID behavior.
5. Add query keys and compendium hooks.
6. Replace the placeholder compendium screen.
7. Add the detail route and detail screen.
8. Wire the route into the authenticated app stack.
9. Verify local search, filtering, and detail behavior.
10. Run typecheck and final technical verification.

## Risks During Execution

### Risk 1: Screen Code Starts Bypassing The Compendium Boundary
Mitigation:
- keep all reads routed through repository, service, and hook layers.

### Risk 2: Empty-Query Browsing Returns Too Much Data Too Abruptly
Mitigation:
- keep the first result presentation lightweight and ordered, then refine later if performance demands it.

### Risk 3: Detail Rendering Scope Grows Too Quickly
Mitigation:
- stop at text-first rendering for this step and defer rich structured rendering.

### Risk 4: Search UX Feels Too Empty Or Too Strict
Mitigation:
- show useful local results by default and keep filtering simple.

## Exit Criteria
Step 5 is complete when:
- the compendium screen is no longer a placeholder
- local SQLite-backed compendium search is working
- empty-query browsing works
- entry-type filtering works
- detail navigation works
- detail loading by ID works
- source and edition labels are visible
- typecheck and manual compendium verification pass
