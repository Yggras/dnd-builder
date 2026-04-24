# Step 9e Inventory and Starting Equipment Builder Implementation Plan

## Objective
Implement the inventory step so characters can receive guided starting equipment, seed canonical items into inventory, and then edit inventory using app-managed compendium items only.

## Confirmed Decisions
- Inventory uses compendium items plus guided starting equipment bundles.
- No custom items in the first serious builder.
- Starting equipment bundles seed inventory rather than locking it permanently.
- Large lists should support search and filters within the step.
- Inventory contents and starting-equipment choices live in `character_builds.payload`, while step progress remains queryable through explicit builder progress columns.

## Product Boundary

### Included In Step 9e
- Inventory step UI.
- Guided starting equipment behavior.
- Canonical item seeding.
- Post-seeding item adjustments.
- Search/filter UI for large item selection sets.

### Explicitly Excluded From Step 9e
- Custom/manual items.
- Economy or shopping systems.
- Campaign-specific inventory state.

## Feature Goals
- Inventory is a real builder step.
- Starting equipment feels guided rather than manual-only.
- Players can adjust seeded inventory afterward.
- Inventory remains canonical-item-based.

## Architectural Approach

### 1. Starting Equipment Model
Represent guided starting gear choices and their resulting canonical items.

### 2. Inventory Seed Flow
Seed selected items into the character build inventory.

Persistence note:
- seeded inventory entries and bundle-choice detail remain payload-owned builder state rather than new first-class relational tables in this phase

### 3. Editable Inventory UI
Allow the user to add/remove canonical items after seeding.

### 4. Search And Filter Support
Provide mobile-friendly search/filter behavior for item-heavy flows.

## Verification
- Starting gear choices seed inventory.
- Seeded items can be edited afterward.
- Only canonical items are selectable.
- Search/filter works for large item lists.
- Inventory progress remains resumable without broadening the explicit-column contract beyond roster/resume metadata.

## Risks And Mitigations

### Risk 1: Starting Gear Data Is Not Structured Enough
Mitigation:
- support the reliably derivable starting equipment cases first and surface checklist items where data is incomplete

### Risk 2: Inventory Scope Expands Into Full Sheet Management
Mitigation:
- keep inventory limited to builder ownership and canonical item references

## Exit Criteria
Step 9e is complete when:
- inventory is a real builder step
- starting equipment seeds canonical items
- post-seeding inventory editing works
- custom items are not required for the flow
