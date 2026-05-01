# Step 19 Background Detail Screen Optimization Execution Steps

## Goal
Execute the background detail screen optimization so background pages include a useful overview, avoid duplicated starting equipment, and expose tappable feat/equipment links through the existing Details renderer.

## Execution Rules
- Do not change generated content.
- Do not run `npm run generate:5etools` for this step.
- Do not change SQLite schema or migrations.
- Do not change character builder behavior.
- Do not add new compendium categories.
- Keep the Starting Equipment content in Details, not in a separate section.
- Prefer minimal renderer improvements over background-only custom link UI.

## Step-By-Step Execution Sequence

### 1. Reconfirm Source Shapes
- Inspect one 2024 background entry with mechanical list rows.
- Inspect one legacy background entry with narrative feature prose.
- Confirm feat and equipment references live in `renderPayload.entries`.

Output:
- Representative source shapes are known before editing.

### 2. Add Overview Extraction Helper
- Add a small helper in `BackgroundDetailView.tsx` or nearby local scope.
- Extract the first useful prose paragraph from `entry.renderPayload.entries`.
- Skip the initial mechanical list block when possible.
- Fall back to `entry.summary` if no prose paragraph exists.

Output:
- `BackgroundDetailView` can produce overview text without changing generated data.

### 3. Render Overview Section
- Render a `DetailSection` titled `Overview` under `CompendiumDetailHeader`.
- Use existing rich text rendering if inline tags might appear.
- Keep the section hidden if no overview text is available.

Output:
- Background pages show a readable info/description block.

### 4. Remove Duplicate Starting Equipment Section
- Delete the explicit `Starting Equipment` section from `BackgroundDetailView.tsx`.
- Remove equipment-summary tokenization and reference-target code.
- Remove imports that become unused.

Output:
- Starting equipment is no longer duplicated above Details.

### 5. Preserve Inline Tags For Object List Items
- Update `detailBlocks.ts` list-item parsing.
- For object items with `name` and `entry`, format text as `<name> <entry>` while keeping raw inline tags in `entry`.
- Pass that raw formatted string directly to `parseInlineText()`.
- Keep `extractReadableText()` fallback for unsupported item shapes.

Output:
- Background `Feat:` and `Equipment:` rows produce reference tokens rather than plain text only.

### 6. Confirm Existing Resolver Handles New Tokens
- Do not add a new resolver path unless needed.
- Confirm existing inline reference support covers `feat` and `item` tags.
- Confirm unresolved or ambiguous references remain non-clickable.

Output:
- Links rely on existing shared inline navigation behavior.

### 7. Run TypeScript Verification
- Run `npm run typecheck`.
- Fix any introduced type errors.

Output:
- Typecheck passes.

### 8. Manual Smoke Checks
- Open a modern background such as `Aberrant Heir`.
- Confirm overview appears.
- Confirm no separate Starting Equipment section appears.
- Confirm Details still contains Equipment text.
- Confirm Details feat reference is tappable when resolved.
- Confirm Details item references are tappable when resolved.
- Open a legacy background such as `Acolyte`.
- Confirm narrative/feature prose is readable.
- Confirm Details still renders list/table content safely.

Output:
- User-facing behavior matches requested background detail changes.

### 9. Review Scope And Diff
- Confirm no files under `generated/5etools/**` changed.
- Confirm no schema or migration files changed.
- Confirm no builder files changed.
- Confirm only runtime compendium detail/rendering code changed.

Output:
- Implementation remains inside Step 19 boundaries.

## Task List
1. Reconfirm representative background source shapes.
2. Add overview extraction helper.
3. Render background overview section.
4. Remove duplicate Starting Equipment section.
5. Preserve inline references in object-style list items.
6. Confirm existing resolver supports feat/item tokens.
7. Run `npm run typecheck`.
8. Smoke-check modern and legacy background pages.
9. Review final diff for scope.

## Verification Details

### Required Commands
- `npm run typecheck`

### Commands Not Required
- `npm run generate:5etools`

### Required Runtime Checks
- Background overview is visible when available.
- Separate Starting Equipment section is gone.
- Starting equipment remains in Details.
- Feat links in Details navigate when resolved.
- Equipment links in Details navigate when resolved.
- Unsupported inline tags remain non-clickable and readable.

## Risks During Execution

### Risk 1: Some Backgrounds Have No Narrative Description
Mitigation:
- Use `entry.summary` as fallback.
- Do not invent description content.

### Risk 2: Shared List Parsing Affects Other Compendium Types
Mitigation:
- Only preserve raw inline tags for object-style list items.
- Keep existing fallback extraction for unusual values.

### Risk 3: Existing Resolver Cannot Resolve Some Item Names
Mitigation:
- Leave ambiguous refs non-clickable.
- Do not add fuzzy matching in this step.

## Exit Criteria
Step 19 is complete when:
- Requested background detail changes are implemented.
- Details section is the only place where starting equipment appears.
- Existing inline navigation resolves background feat and equipment links where possible.
- No generated content, schema, migration, or builder changes are included.
- `npm run typecheck` succeeds.
