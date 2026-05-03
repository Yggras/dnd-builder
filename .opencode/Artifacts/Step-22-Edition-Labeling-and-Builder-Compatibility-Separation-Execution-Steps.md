# Step 22 Edition Labeling and Builder Compatibility Separation Execution Steps

## Preconditions
- Use `npm`, not `pnpm` or `yarn`.
- Do not change SQLite schema or migrations.
- Do not add new UI labels in this step.
- Keep compatible legacy content selectable in the builder.
- Make visible edition labels reflect actual source edition.

## Execution Checklist

### 1. Inspect Current Helper Usage
- [x] Review `scripts/5etools-importer/utils.mjs` edition helpers.
- [x] Review `scripts/5etools-importer/normalize.mjs` `createBaseRecord()`.
- [x] Confirm `COMPATIBLE_2024_SOURCES` currently affects `rulesEdition` / `isLegacy`.
- [x] Confirm builder flows use `isSelectableInBuilder` rather than `isLegacy` for selectable content filtering.

### 2. Split Edition And Compatibility Helpers
- [x] Add or rename helper for actual 2024 edition detection.
- [x] Keep explicit raw flags authoritative: `edition: 'one'`, `basicRules2024`, `srd52`.
- [x] Treat `edition: 'classic'` as actual `2014` even if the source is compatibility-listed.
- [x] Keep primary 2024 source fallback for records without explicit edition metadata.
- [x] Add or update helper for builder selectability using actual 2024 or compatible source membership.

### 3. Update Normalization
- [x] Update `createBaseRecord()` to compute actual edition independently from builder selectability.
- [x] Set `rulesEdition` from actual edition only.
- [x] Set `isLegacy` from actual edition only.
- [x] Set `isPrimary2024` from actual primary/explicit 2024 logic only.
- [x] Set `isSelectableInBuilder` from builder compatibility logic.

### 4. Extend Audit
- [x] Update `scripts/audit-5etools.mjs` with edition classification checks.
- [x] Build raw-to-normalized lookup keys for supported categories where practical.
- [x] Fail when raw `edition: 'classic'` becomes generated `rulesEdition: '2024'`.
- [x] Fail when raw `edition: 'one'` does not become generated `rulesEdition: '2024'`.
- [x] Add targeted assertions for `Artificer [TCE]`.
- [x] Add targeted assertions for `Artificer [EFA]`.
- [x] Keep out-of-scope categories informational only.

### 5. Regenerate Content
- [x] Run `npm run generate:5etools`.
- [x] Confirm generation succeeds.
- [x] Note any existing warnings, including unmatched subclass feature details.

### 6. Spot Check Generated Artificer Records
- [x] Inspect `generated/5etools/classes/artificer-tce.json`.
- [x] Confirm `Artificer [TCE]` has `rulesEdition: '2014'`.
- [x] Confirm `Artificer [TCE]` has `isLegacy: true`.
- [x] Confirm `Artificer [TCE]` has `isSelectableInBuilder: true`.
- [x] Inspect `generated/5etools/classes/artificer-efa.json`.
- [x] Confirm `Artificer [EFA]` has `rulesEdition: '2024'`.
- [x] Confirm `Artificer [EFA]` has `isLegacy: false`.
- [x] Confirm `Artificer [EFA]` has `isSelectableInBuilder: true`.

### 7. Verify Audit And Types
- [x] Run `npm run audit:5etools`.
- [x] Confirm edition classification checks pass.
- [x] Confirm Step 21 class/subclass reachability checks still pass.
- [x] Run `npm run typecheck`.
- [x] Address any TypeScript issues.

### 8. Review Final Diff Scope
- [x] Confirm no SQLite schema files changed.
- [x] Confirm no migration files changed.
- [x] Confirm no UI label changes were introduced.
- [x] Confirm generated content changes are expected from edition flag regeneration.
- [x] Summarize exact Artificer outcomes.

## Expected Commands
```bash
npm run generate:5etools
npm run audit:5etools
npm run typecheck
```

## Expected Final Outcome
- Visible edition labels reflect actual source edition.
- Builder selectability remains compatibility-aware.
- `Artificer [TCE]` is shown as legacy / `2014` but remains selectable.
- `Artificer [EFA]` is shown as `2024` and remains selectable.
- Audit protects against compatibility sources being mislabeled as actual 2024 content.
