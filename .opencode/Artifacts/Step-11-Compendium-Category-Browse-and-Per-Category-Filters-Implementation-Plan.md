# Compendium Category Browse and Per-Category Filters Implementation Plan

## Objective
Redesign the compendium from a single mixed search surface into a category-first browsing experience with six separated content areas and category-specific search, filter, and sort behavior.

The compendium should stop behaving like one generic result list with a coarse entry-type filter. Instead, it should feel like a clean browsing tool where each top-level category owns its own interaction model.

## Confirmed Decisions
- The compendium root is a category home, not a mixed result list.
- The root shows exactly six top-level categories:
  - `Classes`
  - `Backgrounds`
  - `Feats`
  - `Items`
  - `Species`
  - `Spells`
- Opening a category should immediately show entries; users do not need to search first.
- Each category has its own search field, filters, and sort options.
- Search is always scoped to the current category.
- Filters are presented through a filter sheet plus active filter chips on the screen.
- Multi-select is allowed where sensible.
- `Items` remains one top-level category rather than splitting `Equipment` and `Magic Items` into separate top-level destinations.
- `Classes` remains one top-level category; subclasses are browsed inside the class experience rather than as a top-level category.
- Category screens should feel like a clean browsing tool rather than a decorative section landing page.
- Source and edition should both be filterable where requested, not only visible as labels.
- Spell role tags are app-owned derived tags, not source-truth fields.
- A spell may have multiple role tags.

## Product Boundary

### Included In This Feature
- Replace the current compendium home with a six-category browse home.
- Add category routes and category browse screens.
- Add category-scoped search for each top-level category.
- Add category-specific filter models.
- Add category-specific sorting models.
- Add class-to-subclass browse flow inside the `Classes` category experience.
- Extend normalized spell metadata with derived spell role tags.
- Rework repository and service query surfaces to support category-specific browse behavior.

### Explicitly Excluded From This Feature
- Reworking the detailed entry rendering format.
- Adding top-level `Subclasses` as a separate compendium category.
- Global cross-category search on the compendium home screen.
- Featured, recent, or curated home-screen sections.
- Homebrew content or user-defined compendium filters.
- Builder behavior changes unrelated to sharing reusable content metadata.

## Feature Goals
- The compendium home clearly separates the six supported content areas.
- Each category feels intentionally designed for that content type rather than constrained by a generic search UI.
- Users can narrow large datasets through appropriate filters without needing to understand the underlying content model.
- The `Spells` category supports practical tactical browsing through rules metadata plus app-owned role tags.
- The `Items` category supports one shared surface with filters that distinguish mundane versus magic content.
- The `Classes` category supports a browse flow where subclasses are discovered inside the class experience.

## Agreed Category Contracts

### Classes
- Top-level category: `Classes`
- Opening behavior: show class entries immediately
- Search: scoped to classes only
- Filters:
  - source
  - edition
- Sorts:
  - name
  - source
  - edition
- Subclass behavior:
  - subclasses are not top-level
  - browse flow is `class list -> class detail/subclass browsing`

### Backgrounds
- Search: scoped to backgrounds only
- Filters:
  - source
  - edition
- Sorts:
  - name
  - source
  - edition

### Feats
- Search: scoped to feats only
- Filters:
  - feat type
  - source
  - edition
- Sorts:
  - name
  - feat type
  - source
  - edition

### Items
- Search: scoped to items only
- Filters:
  - mundane vs magic
  - rarity
  - item type
  - weapon category
  - armor type
  - damage type
  - source
  - edition
- Sorts:
  - name
  - rarity
  - type
  - source
  - edition

### Species
- Search: scoped to species only
- Filters:
  - source
  - edition
- Sorts:
  - name
  - source
  - edition

### Spells
- Search: scoped to spells only
- Filters:
  - level
  - school
  - role tags
  - ritual
  - concentration
  - source
  - edition
- Sorts:
  - name
  - level
  - school
  - source
  - edition
- Role taxonomy:
  - `Combat`
  - `Buff`
  - `Debuff`
  - `Control`
  - `Healing`
  - `Utility`
  - `Summoning`
  - `Defense`

## Architectural Approach

### 1. Replace The Generic Compendium Entry Point
The existing compendium screen should stop acting as a mixed list with one entry-type modal.

Responsibilities:
- make `/(app)/compendium/index` the category home
- remove the root mixed search result UX from the main path
- preserve entry detail routes

Recommended routing shape:
- `/(app)/compendium/index`
- `/(app)/compendium/category/[category]`
- `/(app)/compendium/[entryId]`

This avoids route conflict between category keys and entry IDs.

### 2. Introduce A Category Registry
Create one authoritative category contract object for the six categories.

Responsibilities:
- define category labels and route keys
- define supported filters and sorts per category
- define default sort behavior
- define empty-state copy
- define which repository query path each category uses

This prevents category-specific behavior from being scattered across screen conditionals.

### 3. Create A Shared Browse Shell With Category-Owned Controls
Use one clean browsing layout shared across categories.

Responsibilities:
- title row
- scoped search field
- filter action
- sort action
- active chips row
- results list

Each category then injects its own filter definitions, sort options, and row annotations.

### 4. Replace Generic Search Hooks With Category Browse Hooks
The current `useCompendiumSearch()` hook is too coarse for the agreed UX.

Responsibilities:
- hold query text per category screen
- hold category-specific filter state
- hold category-specific sort state
- derive active chips and result summaries
- request data through category-specific repository methods

### 5. Move To Category-Specific Repository Queries
The current `searchCompendiumEntries(query, entryType?)` interface is useful for generic lookup, but it is not a sufficient browse contract for the new compendium UX.

Recommended additions:
- `browseClasses(...)`
- `browseBackgrounds(...)`
- `browseFeats(...)`
- `browseItems(...)`
- `browseSpecies(...)`
- `browseSpells(...)`

Responsibilities:
- support category-scoped text search
- support category-specific filtering
- support category-specific sorting
- keep filtering in SQLite where possible rather than doing broad client-side scans

### 6. Reuse Existing Spell Applicability Groundwork
The latest builder-oriented spell work has already improved spell metadata and query capabilities.

Reusable improvements now available:
- normalized `classIds` on spells
- normalized `subclassIds` on spells
- `listSpells` already supports `classId`, `subclassId`, `level`, and `query`

This does not replace the compendium redesign, but it reduces future spell-category implementation risk and provides a stronger spell metadata baseline than before.

### 7. Extend Spell Metadata With Derived Role Tags
The agreed spell role filter requires importer work.

Responsibilities:
- add app-owned `roleTags` to normalized spell metadata
- allow multiple roles per spell
- keep the role taxonomy explicit and stable
- derive tags conservatively so the first version is predictable and debuggable

This should be implemented in the importer normalization step rather than improvised in the UI.

### 8. Normalize Filter Labels For Human-Friendly UI
Some existing metadata is coded or too raw for direct UI display.

Responsibilities:
- map spell school codes to readable names
- map feat category codes to readable feat types
- expose mundane vs magic item distinctions consistently
- map edition/source values into stable chip and sheet labels

### 9. Keep Class And Subclass Discovery Layered
`Classes` should remain the top-level category, with subclasses inside the class experience.

Recommended behavior:
- class list screen uses class filters/sorts only
- selecting a class opens a class-specific browse/detail surface
- that surface can show:
  - class summary/details
  - subclass list for that class
  - subclass search if needed later

This avoids polluting the main classes list with mixed class and subclass rows.

## Data And Query Notes

### Data Already Available
- `Spells`: level, school, ritual, classIds, subclassIds, source, edition
- `Feats`: category and feature metadata already support feat-type mapping
- `Items`: rarity, type, category, weapon category, armor-related fields, damage type
- `Species`, `Backgrounds`, `Classes`: source and edition already exist as shared metadata

### Data Still Needed
- `Spells`: derived `roleTags`
- `Spells`: concentration metadata may need explicit normalization if not already present
- `Items`: item-type display mapping may need a UI normalization layer depending on raw values
- `Feats`: feat-type label mapping for readable filtering and sorting

### Query Strategy
- prefer SQLite-backed filtering/sorting for larger datasets, especially `Items` and `Spells`
- keep `searchCompendiumEntries(...)` only for generic lookup or transitional fallback use
- avoid shipping the new category UX on top of one generic mixed search function

## Verification
- The compendium home shows six category tiles and no mixed root results.
- Opening any category immediately shows results.
- Search is scoped to the active category only.
- Each category exposes only its agreed filters and sorts.
- Active filter chips reflect the current category state clearly.
- `Items` remains one category while still distinguishing mundane versus magic through filters.
- `Classes` does not mix subclasses into the top-level list; subclass discovery happens inside the class experience.
- `Spells` supports level, school, ritual, concentration, source, edition, and role-tag filtering.
- Spell role tags can be applied in multi-tag combinations.

## Risks And Mitigations

### Risk 1: Generic Search Architecture Leaks Back Into The New UX
Mitigation:
- establish a category registry and category-specific browse queries before rewriting screens

### Risk 2: Spell Role Tags Become Arbitrary Or Inconsistent
Mitigation:
- keep the first role taxonomy fixed and derive roles conservatively in normalization
- document the derivation logic in code so future refinements remain intentional

### Risk 3: Classes Experience Gets Confused By Subclass Placement
Mitigation:
- keep the top-level class list pure
- place subclass browsing only in the selected-class flow

### Risk 4: Item Filters Become Too Raw Or Technical
Mitigation:
- add UI-facing label normalization for item type, rarity, and damage/armor fields before exposing them directly

### Risk 5: SQLite Query Complexity Grows Unevenly Across Categories
Mitigation:
- phase the work by category and keep repository APIs explicit rather than building one overloaded mega-query type

## Exit Criteria
This feature is complete when:
- the compendium home is a six-category browse home
- all six categories have separated browse screens
- each category has its agreed search, filter, and sort behavior
- classes and subclasses follow the agreed layered browse flow
- items remain one category with suitable internal distinctions
- spell role tags exist and power the `Spells` filters
- the category UX behaves like a clean browsing tool rather than a generic search page
