# Step 9c Class Allocation and Feature Choice Engine Implementation Plan

## Objective
Implement the builder's class engine so class selection, multiclass allocation, subclass timing, and class-owned feature choices become the structural anchor of the wizard.

This step is where the builder moves from shell to actual build logic.

## Confirmed Decisions
- Class is the first and most important builder step.
- Multiclassing is supported from day one.
- Class levels are explicit.
- Multiclassing uses a class allocation table.
- Invalid multiclass prerequisites block multiclass.
- Subclass selection is only available when the class level qualifies.
- Fighting styles, invocations, maneuvers, and similar choices live inside the class step.

## Product Boundary

### Included In Step 9c
- Class step UI and state.
- Multiclass allocation table.
- Subclass timing logic.
- Class feature choice orchestration for supported content.
- Multiclass prerequisite validation.
- Downstream invalidation summaries when class changes affect later steps.

### Explicitly Excluded From Step 9c
- Full spell selection UI.
- Species and background automation.
- Inventory seeding.
- Review/completion gate.

## Feature Goals
- The builder can express single-class and multiclass builds.
- Class and subclass choices are rules-aware.
- Class-owned feature choices are surfaced inside the class step.
- Class changes produce a clear impact summary for later-step fallout.

## Architectural Approach

### 1. Class Allocation Model
Represent classes and levels as a structured allocation table.

### 2. Validation Layer
Implement:
- multiclass prerequisite checks
- subclass eligibility checks
- feature choice requirement detection

### 3. Feature Choice Layer
Drive class-related option selection from content entities and choice grants where supported.

### 4. Invalidation Summary
When class changes affect later build state, show an impact summary and route the user back through affected steps.

## Verification
- Single-class build works.
- Multiclass allocation works.
- Invalid multiclassing is blocked.
- Subclasses only appear when qualified.
- Supported feature choices appear in-class-step.

## Risks And Mitigations

### Risk 1: Class Logic Spills Into All Other Steps
Mitigation:
- keep this step focused on class-owned structure and downstream invalidation contracts only

### Risk 2: Choice-Grant Data Is Not Sufficient Everywhere
Mitigation:
- support reliable grants first and surface unresolved checklist items where support is partial

## Exit Criteria
Step 9c is complete when:
- class allocation works
- multiclass prerequisite blocking works
- subclass timing works
- in-class feature choices are supported where reliable
- downstream invalidation summaries exist
