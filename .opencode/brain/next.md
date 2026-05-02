# Next: Character Builder Optimization

## Chunk 1: Builder Stabilization

- Stabilize autosave before adding more builder behavior.
  - Prevent overlapping autosaves from applying out-of-order results.
  - Avoid resetting the local draft from stale query data after a save completes.
  - Make revision handling safer so saves do not blindly rely on client-side `revision + 1`.
  - Preserve completion saves as an explicit final save path.

- Fix reconciliation correctness.
  - Ensure class reconciliation applies sanitized payload changes, not only review issue changes.
  - Compare and update affected payload slices such as allocations, subclasses, feature choices, and review issues.
  - Keep completed builds regressing to draft when reconciliation introduces unresolved invalidity.

- Add automatic inventory reconciliation.
  - Reconcile starting equipment whenever class or background changes affect inventory sources.
  - Detect stale seeded gear, selected starting-equipment options, currency, and unresolved gear state.
  - Add an explicit checklist state for starting equipment that has not been reviewed or seeded.
  - Preserve manually added canonical inventory items when reseeding starting equipment.

## Chunk 2: Builder Structure And Maintainability

- Split `CharacterBuilderScreen` into smaller builder step components.
  - Extract Class, Spells, Species, Background, Ability Points, Inventory, Characteristics, Notes, and Review sections.
  - Keep orchestration and shared derived state outside individual step components where practical.
  - Remove duplicated styles that remain from previous partial extraction.

- Introduce a builder controller hook or equivalent orchestration layer.
  - Centralize mutation handlers and derived selectors.
  - Keep screen rendering focused on layout, navigation, loading, and error states.
  - Make future rules work easier to test and reason about.

- Align the capability audit with current implementation reality.
  - Update stale `missing` and `launch-blocking` entries that no longer describe the current code.
  - Keep genuinely incomplete areas marked clearly so the audit remains useful.

## Chunk 3: Wizard UX

- Make the builder behave like a real step wizard.
  - Render only the active step instead of rendering most sections at once.
  - Add previous/next navigation based on the agreed step order.
  - Keep direct step navigation available for resuming drafts, but make current progress obvious.
  - Show per-step completion or issue status in the step navigation.

- Improve mobile ergonomics for heavy steps.
  - Keep long choice lists searchable and filtered.
  - Avoid giant unstructured chip walls where selection sets are large.
  - Make selected values and unresolved requirements visible near the action that resolves them.

- Complete Characteristics and Notes as separate steps.
  - Expose name, age, alignment, and appearance in the Characteristics step.
  - Keep Notes as optional freeform content that never blocks completion.
  - Stop presenting both steps together as a generic draft basics section.

## Chunk 4: Validation And Review Model

- Centralize the completion validation pipeline.
  - Produce one coherent set of blockers, checklist items, notices, and overrides.
  - Keep issue ownership tied to the step responsible for resolving it.
  - Ensure completion is blocked only by true blockers and unresolved checklist items.

- Define a real override workflow.
  - Add explicit advanced override actions instead of relying on ad hoc notes.
  - Require a visible note or reason for each override.
  - Allow overrides to resolve supported issue types intentionally.
  - Summarize all overrides clearly in Review.

- Improve Review as an action gate.
  - Group issues by severity and step.
  - Make each issue point back to the step that resolves it.
  - Keep source, edition, legacy, and mixed-edition summaries visible but non-blocking unless there is a concrete invalid rule state.

## Chunk 5: Rules Depth

- Tighten ability score and ASI handling.
  - Decide the supported first-class mode for manual ability entry.
  - Validate base scores and final scores coherently.
  - Enforce ASI availability and legal allocation.
  - Decide how feat-vs-ASI opportunities should be represented in state.

- Improve spell selection fidelity.
  - Strengthen class and subclass spell-list matching.
  - Keep strict known, prepared, cantrip, and max spell level limits.
  - Preserve multiclass spell rules as a day-one requirement.
  - Keep manual exceptions for ritual/book/list edge cases without weakening normal strict validation.

- Improve class-owned feature choices.
  - Keep feature choices inside the Class step.
  - Make unsupported or incomplete choice grants explicit checklist items.
  - Preserve selected choices only while they remain legal for the current class allocation.

## Chunk 6: Content Loading And Performance

- Reduce eager content loading in the builder.
  - Load core class/origin data first.
  - Load spells only when the build needs spell decisions or the Spells step is active.
  - Load item search results on demand instead of blocking startup on all items.
  - Keep full entity indexes only as broad as the current validation/review path needs.

- Move heavy filtering closer to repositories where practical.
  - Avoid filtering all spells in memory for every builder render.
  - Use query-level filters for spell and item search when possible.
  - Keep selected entity lookup reliable even when full catalogs are not loaded.

## Chunk 7: Preview And Roster Polish

- Upgrade completed preview to use content-backed labels.
  - Stop deriving class, species, background, feat, spell, and item labels by splitting IDs.
  - Resolve selected content through content entities or stored denormalized display labels.
  - Keep the preview lightweight, but make it accurate.

- Improve roster summaries.
  - Show accurate class and species labels from content-backed data where possible.
  - Keep draft versus complete status prominent.
  - Show the current builder step for drafts so resuming is obvious.

## Verification Expectations

- Use `npm run typecheck` after implementation changes.
- If typecheck fails because generated 5etools JSON imports are missing, run `npm run generate:5etools` and rerun `npm run typecheck`.
- Do not run `npm run generate:5etools` casually because it rewrites generated content and changes timestamps.
- Avoid schema changes unless a builder state change truly requires them.
