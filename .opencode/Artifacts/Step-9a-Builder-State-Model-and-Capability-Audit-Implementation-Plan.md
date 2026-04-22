# Step 9a Builder State Model and Capability Audit Implementation Plan

## Objective
Define the canonical builder state model and audit the current app-managed content/runtime capabilities against the agreed builder behavior spec before any builder UI or roster implementation begins.

This step is the contract phase for the builder system. Its purpose is to prevent the upcoming `My Characters` and builder work from hardening around vague or contradictory assumptions.

## Confirmed Decisions
- The builder is a guided, resumable draft wizard.
- It produces only `character` and `character_build` output.
- Characters begin as drafts and may become complete.
- A complete character may fall back to draft after invalidating edits.
- Backgrounds are required and now exist in generated content.
- Deep spell support is a required launch condition for the full builder.
- Overrides may intentionally resolve otherwise invalid or unsupported cases and still permit completion.
- Execution rule for this artifact phase: document and implement contracts and audits before builder UI code lands.

## Product Boundary

### Included In Step 9a
- Define the canonical builder draft/completion model.
- Define blocker, checklist, informational notice, and override semantics.
- Define per-step ownership at the contract level.
- Audit current content/runtime support for class, spells, species, backgrounds, feats, optional features, inventory, starting equipment, and review/completion needs.
- Identify which builder behaviors are already supported, partially supported, or missing.

### Explicitly Excluded From Step 9a
- `My Characters` roster UI.
- Builder navigation UI.
- Step screens.
- SQLite character repository implementation.
- Character creation flows.
- Campaign assignment, status, or DM dashboard work.

## Feature Goals
- One authoritative builder state model exists before feature implementation starts.
- The app has a support matrix for the builder's content-driven behavior.
- The next implementation phases can be sequenced by dependency instead of guesswork.
- The builder launch boundary is explicit and reviewable.

## Architectural Approach

### 1. Builder State Contract
Define the logical builder state model.

Responsibilities:
- distinguish `draft` and `complete`
- define what makes a step complete
- define how a complete build falls back to draft
- define autosave-compatible partial progress behavior

### 2. Validation Contract
Define the categories of builder feedback.

Responsibilities:
- blocking invalidity
- unresolved checklist items
- informational notices
- resolved overrides

### 3. Step Responsibility Matrix
Define which step owns which decisions.

Primary steps:
- Class
- Spells
- Species
- Background
- Ability Points
- Inventory
- Characteristics
- Notes
- Review

### 4. Capability Audit
Audit current content/runtime support against the builder behavior spec.

Primary areas:
- classes and subclasses
- multiclass structure
- optional features and feature grants
- backgrounds
- feats and granted feats
- spells and spellcasting rules depth
- inventory and starting equipment
- source/edition metadata availability

## Deliverables
- builder state terminology and lifecycle
- builder validation model
- per-step responsibility matrix
- capability support matrix with statuses such as:
  - supported
  - partially supported
  - missing
  - launch-blocking

## Verification
- The builder behavior spec can be mapped to explicit state categories.
- Each wizard step has a clear scope.
- The team can identify what must be built before the builder can launch.
- No builder UI implementation depends on unspecified behavior after this step.

## Risks And Mitigations

### Risk 1: UI Gets Ahead Of The State Model
Mitigation:
- complete this step before implementing builder screens

### Risk 2: Spell And Background Complexity Remains Implicit
Mitigation:
- mark missing capability explicitly as launch-blocking rather than hand-waving it

### Risk 3: Overrides Blur Validation Semantics
Mitigation:
- document exactly how override-backed resolution affects completion

## Exit Criteria
Step 9a is complete when:
- builder state terminology is defined
- validation categories are defined
- step ownership is defined
- current content/runtime capability gaps are audited
- launch-blocking dependencies for the builder are explicit
