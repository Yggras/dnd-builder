# Step 22 Edition Labeling and Builder Compatibility Separation Execution Steps

## Preconditions
- Use `npm`, not `pnpm` or `yarn`.
- Do not change SQLite schema or migrations.
- Do not add new UI labels in this step.
- Keep compatible legacy content selectable in the builder.
- Make visible edition labels reflect actual source edition.

## Execution Checklist

### 1. Inspect Current Helper Usage
- [ ] Review `scripts/5etools-importer/utils.mjs` edition helpers.
- [ ] Review `scripts/5etools-importer/normalize.mjs` `createBaseRecord()`.
- [ ] Confirm `COMPATIBLE_2024_SOURCES` currently affects `rulesEdition` / `isLegacy`.
- [ ] Confirm builder flows use `isSelectableInBuilder` rather than `isLegacy` for selectable content filtering.

### 2. Split Edition And Compatibility Helpers
- [ ] Add or rename helper for actual 2024 edition detection.
- [ ] Keep explicit raw flags authoritative: `edition: 'one'`, `basicRules2024`, `srd52`.
- [ ] Treat `edition: 'classic'` as actual `2014` even if the source is compatibility-listed.
- [ ] Keep primary 2024 source fallback for records without explicit edition metadata.
- [ ] Add or update helper for builder selectability using actual 2024 or compatible source membership.

### 3. Update Normalization
- [ ] Update `createBaseRecord()` to compute actual edition independently from builder selectability.
- [ ] Set `rulesEdition` from actual edition only.
- [ ] Set `isLegacy` from actual edition only.
- [ ] Set `isPrimary2024` from actual primary/explicit 2024 logic only.
- [ ] Set `isSelectableInBuilder` from builder compatibility logic.

### 4. Extend Audit
- [ ] Update `scripts/audit-5etools.mjs` with edition classification checks.
- [ ] Build raw-to-normalized lookup keys for supported categories where practical.
- [ ] Fail when raw `edition: 'classic'` becomes generated `rulesEdition: '2024'`.
- [ ] Fail when raw `edition: 'one'` does not become generated `rulesEdition: '2024'`.
- [ ] Add targeted assertions for `Artificer [TCE]`.
- [ ] Add targeted assertions for `Artificer [EFA]`.
- [ ] Keep out-of-scope categories informational only.

### 5. Regenerate Content
- [ ] Run `npm run generate:5etools`.
- [ ] Confirm generation succeeds.
- [ ] Note any existing warnings, including unmatched subclass feature details.

### 6. Spot Check Generated Artificer Records
- [ ] Inspect `generated/5etools/classes/artificer-tce.json`.
- [ ] Confirm `Artificer [TCE]` has `rulesEdition: '2014'`.
- [ ] Confirm `Artificer [TCE]` has `isLegacy: true`.
- [ ] Confirm `Artificer [TCE]` has `isSelectableInBuilder: true`.
- [ ] Inspect `generated/5etools/classes/artificer-efa.json`.
- [ ] Confirm `Artificer [EFA]` has `rulesEdition: '2024'`.
- [ ] Confirm `Artificer [EFA]` has `isLegacy: false`.
- [ ] Confirm `Artificer [EFA]` has `isSelectableInBuilder: true`.

### 7. Verify Audit And Types
- [ ] Run `npm run audit:5etools`.
- [ ] Confirm edition classification checks pass.
- [ ] Confirm Step 21 class/subclass reachability checks still pass.
- [ ] Run `npm run typecheck`.
- [ ] Address any TypeScript issues.

### 8. Review Final Diff Scope
- [ ] Confirm no SQLite schema files changed.
- [ ] Confirm no migration files changed.
- [ ] Confirm no UI label changes were introduced.
- [ ] Confirm generated content changes are expected from edition flag regeneration.
- [ ] Summarize exact Artificer outcomes.

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
