# Compendium Category Browse and Per-Category Filters Execution Steps

## Goal
Execute the compendium redesign in a controlled sequence so the app moves from one mixed search page to six separated category browse experiences with category-specific search, filters, and sorts.

## Execution Rules
- Do not keep the old mixed-root compendium UX as the primary experience.
- Do not collapse all categories back into one generic search/filter implementation.
- Keep the root compendium page limited to the six category tiles.
- Keep category screens compact and utility-oriented.
- Treat spell role tags as importer-owned app metadata, not UI-only heuristics.
- Keep subclasses inside the class experience rather than exposing them as a top-level category.

## Step-By-Step Execution Sequence

### 1. Confirm The Category Contract
- Confirm the compendium root is category-only.
- Confirm the six top-level categories:
  - `Classes`
  - `Backgrounds`
  - `Feats`
  - `Items`
  - `Species`
  - `Spells`
- Confirm each category opens directly into a result list.
- Confirm category screens are clean browsing tools.

Output:
- stable compendium category contract.

### 2. Define The Category Registry
- Add one authoritative category definition object.
- Define route keys, labels, default sorts, supported filters, and empty-state copy.
- Define which category owns which browse query.

Output:
- reusable category registry.

### 3. Introduce Category Routes And Home Screen
- Replace the current compendium root with the six-category home.
- Add category routes that do not conflict with entry-detail routes.
- Keep entry detail pages accessible.

Output:
- working compendium home plus category navigation.

### 4. Build The Shared Category Browse Shell
- Create the compact browse layout used by all categories.
- Add:
  - title row
  - search field
  - filter action
  - sort action
  - active filter chips
  - result list
- Keep the shell generic while allowing category-specific controls.

Output:
- reusable category browse shell.

### 5. Replace Generic Search State With Category-Owned Browse State
- Retire the current single-search-plus-entry-type model from the main compendium UX.
- Add category-scoped state for:
  - query
  - filters
  - sorts
  - active chips

Output:
- category-owned browse hooks/state.

### 6. Add Category-Specific Repository And Service Queries
- Add explicit browse methods for:
  - classes
  - backgrounds
  - feats
  - items
  - species
  - spells
- Keep filtering and sorting in SQLite where practical.
- Reuse the improved spell metadata/query groundwork from the latest spell-handling commit.

Output:
- category-specific data-access contract.

### 7. Implement Light Categories First
- Implement `Species`, `Backgrounds`, and `Classes` using:
  - scoped search
  - source filter
  - edition filter
  - agreed sorts
- For `Classes`, keep the top-level list class-only.

Output:
- validated baseline category implementation.

### 8. Implement The Classes Inner Flow
- Add selected-class experience for class-specific browsing.
- Expose subclasses only inside the class flow.
- Keep subclass discovery separate from the top-level class list.

Output:
- working class-to-subclass browse path.

### 9. Implement Feat Browse And Filtering
- Add feat search.
- Add feat-type filter.
- Add source and edition filters.
- Add feat-specific sorting.
- Normalize feat-type labels from underlying metadata.

Output:
- real `Feats` category experience.

### 10. Implement Item Browse And Filtering
- Add item search.
- Add mundane-vs-magic filter.
- Add rarity, item type, weapon category, armor type, damage type, source, and edition filters.
- Add agreed item sorting.
- Normalize raw item metadata into user-facing labels where needed.

Output:
- real `Items` category experience.

### 11. Extend Spell Metadata With Role Tags
- Add derived `roleTags` during importer normalization.
- Support multiple roles per spell.
- Use the agreed role taxonomy:
  - `Combat`
  - `Buff`
  - `Debuff`
  - `Control`
  - `Healing`
  - `Utility`
  - `Summoning`
  - `Defense`
- Regenerate the bundled spell content once the importer is updated.

Output:
- spell metadata supports role-based compendium filters.

### 12. Implement Spell Browse And Filtering
- Add spell search.
- Add filters for:
  - level
  - school
  - role tags
  - ritual
  - concentration
  - source
  - edition
- Add agreed spell sorting.
- Use the latest spell metadata improvements as the base contract rather than reverting to generic compendium search.

Output:
- real `Spells` category experience.

### 13. Run UX Verification Across All Categories
- Verify the root compendium no longer behaves like a mixed search screen.
- Verify each category opens into immediate results.
- Verify search stays scoped to the active category.
- Verify chips and sheet state stay consistent.
- Verify classes and subclasses follow the agreed layered flow.
- Verify items remain one category.
- Verify spells support multi-role filtering.

Output:
- validated category-first compendium baseline.

## Suggested Delivery Order
1. Category registry plus routing
2. Home screen plus browse shell
3. Species, backgrounds, classes
4. Classes inner subclass flow
5. Feats
6. Items
7. Spell role-tag normalization
8. Spells

This sequence establishes the new architecture before the highest-complexity category lands.

## Verification Checklist
- `Compendium` root shows only six category tiles.
- Category browse screens are separated and scoped.
- Search never crosses category boundaries.
- Category filter sheets show only relevant controls.
- Active chips summarize the current filter state clearly.
- Sort behavior is category-appropriate.
- Classes do not mix subclasses into the root list.
- Items do not split into two top-level categories.
- Spells support role tags plus rules metadata filters.

## Exit Criteria
This execution is complete when:
- the compendium home is category-first
- the six top-level categories are implemented
- each category supports its agreed search/filter/sort behavior
- the class experience contains subclass browsing internally
- spell role tags are normalized and usable
- the old single mixed-search model is no longer the primary compendium UX
