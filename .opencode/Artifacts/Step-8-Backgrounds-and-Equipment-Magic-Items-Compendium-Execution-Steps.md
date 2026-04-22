# Step 8 Backgrounds and Equipment Magic Items Compendium Execution Steps

## Goal
Execute the next content and compendium expansion in a controlled sequence so backgrounds become searchable app-managed content, while mundane gear and magical items are presented as separate player-facing compendium categories: `Equipment` and `Magic Items`.

## Execution Rules
- Do not bypass the existing generated-content pipeline.
- Do not read generated JSON directly from compendium screens.
- Do not introduce a separate persisted `magicitem` entity type.
- Keep compendium reads routed through repository, service, and hook boundaries.
- Preserve the current text-first compendium detail strategy.
- Do not expand into background builder behavior in this step.

## Step-By-Step Execution Sequence

### 1. Confirm The Taxonomy Contract
- Confirm backgrounds are a first-class content type and compendium entry type.
- Confirm `Equipment` means mundane non-magical item entries only.
- Confirm `Magic Items` means all magical item entries.
- Confirm badges should read `Equipment` or `Magic Item` based on item metadata.
- Confirm the canonical stored item type remains `item`.

Output:
- stable taxonomy contract for the implementation.

### 2. Expand Importer Source Inputs
- Add the 5etools backgrounds source file to the importer config.
- Load backgrounds in the top-level generation script.
- Resolve duplicate-copy behavior consistently with other content types.

Output:
- raw background records available to the generation pipeline.

### 3. Add Background Normalization
- Implement `normalizeBackgrounds`.
- Produce stable IDs and background base records.
- Capture reliable metadata for compendium use and future builder reuse.
- Include background render payload and searchable text.

Output:
- normalized background canonical records.

### 4. Preserve Compendium Metadata
- Extend generated compendium entries so metadata is retained.
- Update SQLite seed import so `compendium_entries.metadata` preserves generated metadata.
- Ensure item metadata survives into runtime search.

Output:
- metadata-aware compendium rows suitable for runtime taxonomy filtering.

### 5. Expand Generated Output
- Add background chunks to the generated content bundle.
- Add background compendium chunks.
- Update manifest counts and chunk registration.

Output:
- bundled content output includes background records and background compendium entries.

### 6. Align Shared Type Contracts
- Extend shared type unions to include `background`.
- Keep compendium entry typing compatible with the new UI filter modes.

Output:
- type system aligned to the expanded content taxonomy.

### 7. Add Repository Filter Support
- Extend local compendium search to support `background`.
- Add `equipment` filter behavior using the mundane rule.
- Add `magicitem` filter behavior using the magical rule.
- Keep `all` and existing canonical entry-type filters working.

Output:
- repository layer supports the full filter set needed by the UI.

### 8. Update Hooks And Compendium UI
- Add `Backgrounds`, `Equipment`, and `Magic Items` to the filter sheet.
- Rename mundane `Items` copy to `Equipment`.
- Update result and detail badge labels.
- Keep screen navigation and search behavior intact.

Output:
- compendium UI aligned to the new taxonomy.

### 9. Regenerate Bundled Content
- Run the 5etools generation script.
- Review generated manifest counts and chunk output.
- Ensure generated registry includes the new background chunks.

Output:
- fresh bundled content consistent with the new implementation.

### 10. Verify End-To-End Behavior
- Run TypeScript typecheck.
- Bootstrap the app so SQLite reseeds from the new bundle.
- Search for a known background.
- Open the `Backgrounds` filter.
- Open the `Equipment` filter and confirm it shows mundane gear only.
- Open the `Magic Items` filter and confirm it shows magical items only.
- Open one mundane item and one magical item detail view to confirm badge labels.

Output:
- validated local-first compendium behavior for the expanded taxonomy.

## Task List
1. Confirm the taxonomy and labeling contract.
2. Add background source inputs to the importer.
3. Normalize backgrounds.
4. Preserve metadata on compendium rows.
5. Expand generated bundle output.
6. Align shared types.
7. Add repository filter support.
8. Update compendium hooks and screens.
9. Regenerate bundled content.
10. Run typecheck and end-to-end verification.

## Risks During Execution

### Risk 1: Background Data Normalization Becomes Too Builder-Oriented
Mitigation:
- normalize enough for compendium search and future reuse, but stop short of builder workflow logic

### Risk 2: `Equipment` And `Magic Items` Drift Apart Between Pipeline And Runtime
Mitigation:
- use the same rarity/category-based classification rule in generation, seeding, filtering, and labeling

### Risk 3: SQLite Compendium Search Lacks Metadata For Taxonomy Filtering
Mitigation:
- preserve metadata before attempting the new runtime filters

### Risk 4: New Filter Modes Break Existing Query Flow
Mitigation:
- add the new filters as an extension of the current search path rather than replacing canonical entry-type filtering logic

### Risk 5: Generated Content Changes Cause Bootstrap Regressions
Mitigation:
- regenerate bundle, verify registry output, and confirm the app reseeds successfully before calling the step complete

## Exit Criteria
Step 8 is complete when:
- backgrounds are imported, normalized, generated, seeded, and searchable
- `Equipment` replaces the mundane item compendium surface
- `Magic Items` exists as a distinct compendium filter
- item badges show `Equipment` or `Magic Item` consistently
- compendium metadata preservation is in place
- generated content and typecheck verification pass
