# Step 9c Class Allocation and Feature Choice Engine Execution Steps

## Goal
Execute the class engine implementation so the builder has a rules-aware first step that can express single-class and multiclass characters, subclass timing, and class-owned feature decisions.

## Execution Rules
- Keep class logic inside the class step.
- Block invalid multiclass prerequisites.
- Do not fake subclass availability before qualifying level.
- Surface unsupported class effects as checklist items rather than silently ignoring them.

## Step-By-Step Execution Sequence

### 1. Confirm The Class Contract
- Confirm class is the structural anchor.
- Confirm multiclassing is day-one.
- Confirm explicit class levels and allocation table UI.

Output:
- stable class-step contract.

### 2. Build The Class Allocation Model
- Add builder state for class allocations.
- Support add/remove/update class rows.

Output:
- multiclass-capable class model.

### 3. Add Class Validation
- Validate multiclass prerequisites.
- Validate subclass qualification.

Output:
- class-step validation baseline.

### 4. Add Supported Feature Choices
- Surface reliable class feature choices.
- Keep these choices inside the class step.

Output:
- guided class feature selection.

### 5. Add Downstream Invalidation Summary
- Detect later-step fallout from class changes.
- Show a summary and route the user back through affected steps.

Output:
- controlled cascade behavior after class edits.

### 6. Verify Class Flows
- Test single-class and multiclass builds.
- Test subclass availability.
- Test invalid multiclass blocking.

Output:
- validated class-engine baseline.

## Exit Criteria
Step 9c is complete when:
- class allocation table works
- invalid multiclass is blocked
- subclass timing is enforced
- supported feature choices are surfaced inside the class step
- downstream invalidation summary exists
