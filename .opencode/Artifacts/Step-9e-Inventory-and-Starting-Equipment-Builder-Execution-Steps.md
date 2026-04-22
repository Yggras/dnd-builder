# Step 9e Inventory and Starting Equipment Builder Execution Steps

## Goal
Execute the inventory builder work so the wizard can guide starting equipment selection, seed canonical items, and support later item adjustments inside the build.

## Execution Rules
- Keep inventory canonical-item-based.
- Do not add custom items in this step.
- Treat starting equipment as seed logic, not a permanent lock.
- Use search and filters for large item-selection flows.

## Step-By-Step Execution Sequence

### 1. Confirm The Inventory Contract
- Confirm inventory sources are canonical items and guided starting equipment.
- Confirm no custom items.
- Confirm seeded items become editable inventory entries.

Output:
- stable inventory-step contract.

### 2. Model Starting Equipment Choices
- Represent supported starting equipment bundles.
- Map supported choices to canonical items.

Output:
- starting gear seed model.

### 3. Implement Inventory Seeding
- Apply selected starting gear into build inventory.

Output:
- guided starting equipment behavior.

### 4. Implement Inventory Editing
- Add and remove canonical items.
- Preserve seeded items as normal editable entries.

Output:
- usable inventory editing flow.

### 5. Add Search And Filter UX
- Support mobile-friendly item search/filter.

Output:
- scalable inventory selection UX.

### 6. Verify Inventory Behavior
- Test starting gear seeding.
- Test post-seeding edits.
- Test canonical-only item selection.

Output:
- validated inventory baseline.

## Exit Criteria
Step 9e is complete when:
- starting equipment is guided
- canonical inventory seeding works
- post-seeding editing works
- inventory search/filter works
