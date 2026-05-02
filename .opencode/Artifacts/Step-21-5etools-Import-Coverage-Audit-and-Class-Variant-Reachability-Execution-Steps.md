# Step 21 5eTools Import Coverage Audit and Class Variant Reachability Execution Steps

## Preconditions
- Use `npm`, not `pnpm` or `yarn`.
- Do not change SQLite schema or migrations unless implementation proves it is unavoidable.
- Do not add a global `Subclasses` compendium category.
- Keep subclass discovery class-scoped.
- Run generation only after importer/chunking changes are ready.

## Execution Checklist

### 1. Document Audit Scope
- [ ] Add `scripts/5etools-importer/AUDIT_SCOPE.md`.
- [ ] List currently imported categories.
- [ ] Map each imported category to its 5eTools source files.
- [ ] Document unsupported 5eTools categories as out of audit scope.
- [ ] Document that future importer category additions must update this scope and the audit script.
- [ ] Document strictness policy: fail supported coverage gaps, warn/report unsupported categories.

### 2. Add Audit Script Skeleton
- [ ] Add `scripts/audit-5etools.mjs`.
- [ ] Add `audit:5etools` to `package.json`.
- [ ] Reuse importer config from `scripts/5etools-importer/config.mjs`.
- [ ] Fetch raw sources from the same 5eTools repository/ref used by generation.
- [ ] Read generated `generated/5etools/content-index.json`.
- [ ] Read generated chunks required for count and reachability checks.
- [ ] Ensure the script is read-only.

### 3. Reuse Generator Resolution And Normalization
- [ ] Resolve `_copy` records using `resolveCollection()` where the generator does.
- [ ] Normalize supported categories using existing normalizers where practical.
- [ ] Match generator flattening for class files, spell files, and item files.
- [ ] Build the same high-level normalized groups used by generation.

### 4. Implement Supported Category Count Checks
- [ ] Compare normalized counts to `content-index.json` `entityCounts`.
- [ ] Compare actual generated chunk contents to manifest chunk `recordCount`.
- [ ] Compare compendium entry counts per entity type to normalized counts for compendium-backed categories.
- [ ] Print a clear category table.
- [ ] Accumulate strict failures for mismatches inside imported categories.

### 5. Implement Class/Subclass Reachability Checks
- [ ] Read all generated class chunks.
- [ ] Count seeded class content entities from class chunks.
- [ ] Count seeded subclass content entities from class chunks.
- [ ] Assert every normalized class id appears exactly once in class chunks.
- [ ] Assert every normalized subclass id appears exactly once in class chunks.
- [ ] Assert every subclass's `classId` matches an existing generated class id.
- [ ] Assert every subclass is in the chunk for its exact parent class id.
- [ ] Emit per-class mismatch details, including class name and source.
- [ ] Ensure Druid appears clearly in mismatch output if still incomplete.

### 6. Implement Out-Of-Scope Reporting
- [ ] Use the GitHub tree or known data-file listing to identify top-level 5eTools data files not imported.
- [ ] Print them as informational `out of scope` entries.
- [ ] Do not fail on out-of-scope categories.

### 7. Run Baseline Audit Before Fix
- [ ] Run `npm run audit:5etools` before fixing class chunking.
- [ ] Confirm it fails on subclass reachability with current generated content.
- [ ] Confirm it reports Druid or equivalent per-class subclass mismatch details.
- [ ] Confirm unsupported categories are informational only.

### 8. Fix Class Chunk Generation
- [ ] Update `scripts/5etools-importer/write.mjs` class chunk creation.
- [ ] Stop grouping chunks by lowercase class name as the persisted chunk identity.
- [ ] Create one chunk per normalized class variant.
- [ ] Use a stable chunk id derived from the class record id or equivalent identity.
- [ ] Include all subclasses whose `classId` equals the chunk class id.
- [ ] Stop collapsing subclass variants by lowercase subclass name inside a class variant.
- [ ] Preserve stable sorting for deterministic output.

### 9. Regenerate Content
- [ ] Run `npm run generate:5etools`.
- [ ] Confirm generation succeeds.
- [ ] Note any existing warnings, such as unmatched subclass feature details.
- [ ] Inspect generated class chunks for Druid variants.
- [ ] Confirm generated seeded subclass count now matches normalized subclass count.

### 10. Run Audit After Fix
- [ ] Run `npm run audit:5etools`.
- [ ] Confirm supported imported category checks pass.
- [ ] Confirm class/subclass reachability checks pass.
- [ ] Confirm out-of-scope categories remain informational.

### 11. Run Typecheck
- [ ] Run `npm run typecheck`.
- [ ] Address any TypeScript issues.

### 12. Review Final Diff Scope
- [ ] Confirm no SQLite schema or migration files changed.
- [ ] Confirm no global subclass category was added.
- [ ] Confirm builder behavior remains filtered by `isSelectableInBuilder`.
- [ ] Confirm generated content diff is expected from class chunking/content-version changes.
- [ ] Summarize the audit results and Druid subclass reachability outcome.

## Expected Commands
```bash
npm run audit:5etools
npm run generate:5etools
npm run audit:5etools
npm run typecheck
```

## Expected Final Outcome
- Audit scope is documented.
- Audit script catches supported imported-category omissions.
- Baseline audit demonstrates the current subclass reachability problem.
- Class chunks preserve every imported class variant.
- Every imported subclass variant is reachable through its exact parent class variant.
- Druid subclass variants are no longer silently hidden by class chunk collapsing.
- Verification commands pass.
