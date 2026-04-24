# Step 9a Builder State Model and Capability Audit Execution Steps

## Goal
Execute the builder contract and capability audit in a controlled sequence so the upcoming `My Characters` and builder implementation phases are grounded in an explicit state model and an honest inventory of supported versus missing behavior.

## Execution Rules
- Do not implement builder UI in this step.
- Do not implement roster UI in this step.
- Do not blur informational notices, checklist items, blockers, and overrides.
- Treat launch-blocking gaps as first-class findings, not temporary assumptions.

## Step-By-Step Execution Sequence

### 1. Confirm The Builder Contract
- Confirm the builder is a resumable draft wizard.
- Confirm it outputs only `character` and `character_build`.
- Confirm `draft` and `complete` are meaningful states.
- Confirm completion can regress back to draft.

Output:
- stable builder contract.

### 2. Define Builder State Categories
- Define draft state.
- Define complete state.
- Define autosaved partial progress.
- Define post-edit regression behavior.

Output:
- builder lifecycle model.

### 2a. Define The Persistence Boundary
- Define which builder progress fields must be queryable directly for roster and resume flows.
- Define which fields live as explicit columns and which remain inside `character_builds.payload`.
- Keep the explicit-column contract intentionally small.

Output:
- validated persistence contract for builder state.

### 3. Define Validation Categories
- Define blocking invalidity.
- Define unresolved checklist items.
- Define informational notices.
- Define resolved override-backed issues.

Output:
- validation category model.

### 4. Define Per-Step Ownership
- Map each wizard step to its owned decisions.
- Confirm what belongs in review versus earlier steps.

Output:
- step responsibility matrix.

### 5. Audit Content And Runtime Capabilities
- Audit classes and subclasses.
- Audit multiclass support needs.
- Audit optional feature support.
- Audit backgrounds.
- Audit feat and granted-feat support.
- Audit spell support depth.
- Audit starting equipment and inventory support.

Output:
- capability matrix with support status.

### 6. Mark Launch-Blocking Gaps
- Identify which missing behaviors block builder launch.
- Separate launch blockers from later enhancements.

Output:
- launch boundary for the full builder.

### 7. Run Technical Verification
- Ensure the resulting contract aligns with the current domain model.
- Ensure roster and builder-shell queries can rely on explicit progress columns without parsing the full payload.
- Ensure later implementation steps can reference the output without reinterpretation.

Output:
- validated Step 9a builder contract baseline.

## Exit Criteria
Step 9a is complete when:
- the builder lifecycle is defined
- validation categories are explicit
- step ownership is explicit
- the explicit-column versus payload boundary is explicit
- content/runtime capability support is audited
- launch blockers are clearly identified
