# Character Builder Behavior Spec

## Overview
This document defines the intended product behavior for the player character builder in the private D&D party app.

The builder is not intended to be a lightweight form or a loose data-entry screen. It is a guided, resumable, mobile-first draft wizard whose job is to produce a rules-complete reusable character build that can later be assigned to one or more campaigns.

This spec builds on the agreed product direction already captured elsewhere in the project:
- characters are global player-owned records
- campaigns reference assigned characters rather than owning them
- one character may be assigned to multiple campaigns
- one `(campaign_id, character_id)` assignment may exist at most once
- build data is character-scoped and shared across campaigns
- live status and derived snapshots are campaign-assignment scoped

This document is specifically about how the character builder should behave.

## Product Goal
The builder should let a player create and maintain a reusable D&D character through a process that is:
- guided
- rules-aware
- resumable
- mobile-friendly
- strict where support is reliable
- override-capable where support is incomplete or the player intentionally wants to diverge

The builder should feel like a real character creation system, not a placeholder editor.

## Builder Philosophy

### Guided Full Build
The builder should optimize for a guided full build.

It should not optimize primarily for:
- a fast playable shell
- a loose scratchpad
- a freeform manual sheet editor

The target experience is that a player starts a draft and is guided through the major character creation decisions until the build becomes complete.

### Draft-First Workflow
Every character starts as a draft.

Drafts should:
- be created immediately when the player starts a new character
- autosave as the player works
- preserve partial progress
- remain resumable later

The builder should always behave like a draft wizard, both when:
- creating a new character
- editing an existing character later

There is no hard split between a creation-only experience and a separate maintenance form.

### Completion Matters
The builder must have a meaningful notion of completion.

The user wants a hard distinction between:
- `draft`
- `complete`

A completed character can fall back to `draft` if the user later edits the build in a way that introduces unresolved invalidity.

Completion is not just a cosmetic badge. It means the build is rules-complete according to the builder's current support and validation model.

### Shared Build Output Only
The builder only owns global character and shared build data.

It does not own:
- campaign assignment
- campaign-specific live status
- campaign-specific snapshots
- DM dashboard state
- live session resources like current HP tracking in a campaign context

The builder's output is:
- `character`
- `character_build`

It does not produce campaign-specific runtime state.

## Character Lifecycle In The Builder

### Starting A New Character
When a player taps `New Character`:
1. a blank draft character should be created immediately
2. the user should provide the minimum identity required to create the draft
3. the builder wizard should open directly

The user has approved the simpler workflow where new-character creation begins immediately rather than through an elaborate pre-creation setup flow.

### Required Initial Identity
The character name should be required up front.

Even though the wizard later contains a `Characteristics` step, the name should already exist from the beginning so the draft has identity in the roster and throughout the flow.

### Editing Existing Characters
Opening an existing character should reopen the same wizard-style builder experience.

The builder should:
- restore the saved draft state
- preserve completed work
- preserve partial work
- allow the player to continue from where they left off

### Finishing The Builder
When the player finishes the builder:
1. validation runs
2. completion state is evaluated
3. if allowed, the character is marked `complete`
4. the user is taken to a lightweight sheet preview

The post-completion preview should be very lightweight. It does not need to be a fully interactive live sheet. It only needs to provide a clear transition that says the build is done and the character now exists as a coherent build record.

## Wizard Structure

## Step Order
The agreed wizard order is:
1. Class
2. Spells if applicable
3. Species
4. Background
5. Ability Points
6. Inventory
7. Characteristics
8. Notes for more
9. Review

This order reflects the user's intent that class is the primary anchor of the build. The build should establish class identity first, then spellcasting implications, then ancestry and origin details, then the rest of the build.

## Step Behavior

### 1. Class Step
This is the most important structural step in the whole builder.

The user wants class to define the build first.

Responsibilities of the class step:
- choose the class or classes in the build
- support multiclassing from day one
- assign class levels explicitly
- represent multiclassing as a class allocation table
- enforce subclass availability only when level qualifies
- surface class-related feature choices inside the class step
- surface fighting styles, invocations, maneuvers, and similar optional features inside the class step
- drive downstream consequences for spellcasting, features, subclass access, and progression

The class step is not just a single dropdown. It is the main structural engine of the build.

### 2. Spells Step
This step is conditional.

The agreed behavior is not simply "casters see it, non-casters do not." The step should exist conditionally for builds where spell-related decisions matter, including niche cases that may come from the class package or later granted content.

Responsibilities of the spells step:
- manage spell selection where applicable
- enforce strict known/prepared counts
- prevent overfilling
- support strict spell counts rather than just suggestions
- support multiclass spell rules from day one
- support mainstream spellcasting behavior deeply enough that the builder does not feel partial
- use manual exceptions for ritual/book/list edge cases where automation is not yet deep enough

The user explicitly does not want the builder to ship early with shallow spell support.

### 3. Species Step
Responsibilities of the species step:
- choose species
- auto-apply deterministic species benefits when reliable
- surface explicit follow-up choices when the species grants open decisions
- trigger a separate granted-feat substep if species grants a feat or feat-like choice

The guiding rule is:
- auto-apply what is deterministic
- ask for what requires player choice

### 4. Background Step
Background is required.

A character should not be considered complete without a background.

Responsibilities of the background step:
- choose background
- auto-apply deterministic background benefits when reliable
- surface explicit follow-up choices when background grants open decisions
- trigger a separate granted-feat substep when the background grants feats or feat-like choices

The user explicitly does not want the builder to launch without real background support in the content layer.

### 5. Ability Points Step
Responsibilities of the ability points step:
- allow manual score entry or allocation
- support ASI allocation where legal
- enforce rules on where ability score increases are allowed
- guide ASIs and feats while still allowing manual editing

The builder should not assume a fully automated generation method like point-buy only. The first real implementation should support manual ability handling with rules enforcement.

### 6. Inventory Step
Responsibilities of the inventory step:
- support guided starting equipment
- seed inventory from starting gear bundles
- allow inventory edits after seeding
- allow adding canonical compendium items
- disallow custom/manual items in the first serious builder version

The agreed inventory model is:
- compendium items plus guided starting equipment bundles
- no custom items in the first real builder

The user wants starting equipment bundles to seed inventory and then behave like normal editable inventory entries, not as permanently locked bundle artifacts.

### 7. Characteristics Step
This step is for roleplay-facing identity information.

The agreed contents are:
- name
- age
- alignment
- appearance

Even though name is required up front, it still belongs in this step as the primary identity section for later editing and presentation.

### 8. Notes For More Step
Notes are pure optional freeform content.

Notes should:
- never block completion
- never count as required resolution
- never substitute for unresolved mechanical build issues

Notes are for the player's own use, not a system validation mechanism.

### 9. Review Step
The review step is a validation summary and approval gate.

It should not become a giant catch-all editing surface.

Responsibilities of the review step:
- summarize validation state
- list blocking issues
- list unresolved checklist items
- summarize resolved overrides
- summarize source and edition usage
- summarize mixed-edition state
- provide the final `complete` action

The review step should primarily confirm whether the character may become complete.

## Multiclassing

### Support Level
Multiclassing is required from day one.

The user explicitly does not want multiclassing deferred.

### Level Model
The builder must support explicit class levels.

It is not enough to store only total level and infer the rest later.

The player wants class levels to be entered explicitly as part of the build process.

### UI Model
The multiclass interface should use a class allocation table.

The builder should allow the player to:
- start with one class
- add another class
- allocate levels by class
- understand the resulting split clearly

### Validation Rules
If a multiclass prerequisite is missing:
- multiclassing should be blocked

This is stricter than the general warning model because the user explicitly wants invalid multiclassing to be blocked rather than merely warned.

### Subclass Timing
Subclass selection should only be available when the level for that class qualifies.

The builder should not allow planning a subclass early just for convenience.

## Class Features And Optional Features

### Required Support
Class-related feature choices should be strictly guided.

The user does not want these reduced to a later freeform review screen.

This includes things like:
- fighting styles
- invocations
- maneuvers
- similar optional feature choices

### Placement
These choices should live inside the class step, not in a separate feature step.

### Partial Support Policy
If a class or subclass is only partially supported by the normalized data:
- it may still be shown
- the builder should allow it
- the builder should surface an unresolved checklist item or support signal where needed

The user prefers allowing partially supported content with explicit handling rather than hiding it entirely.

## Species, Backgrounds, And Derived Benefits

### Automation Rule
The builder should derive as much as is reliable.

The user wants aggressive but trustworthy automation, not minimal derivation.

This means:
- deterministic species benefits should auto-apply
- deterministic background benefits should auto-apply
- deterministic class effects should auto-apply where reliable

### Player Choice Rule
Whenever the content grants open choices rather than deterministic effects, the builder should explicitly surface those choices.

### Granted Feats
If species or background grants a feat or feat-like decision:
- this should trigger a separate granted-feat substep
- it should not be buried or silently assigned if a choice is required

## Ability Scores, ASIs, And Feats

### Ability Score Model
Ability points should be entered or allocated manually.

The builder should not force a single method like point buy only.

### ASIs
Ability Score Improvements should use manual allocation with rules enforcement.

The player wants manual control, but only where legal.

### Feats
Feats and ASIs should be guided but editable.

This means the builder should:
- surface feat/ASI opportunities according to level and class rules
- guide legal choices
- allow manual edits or overrides where necessary

## Spell Support

### Expected Depth
The user wants deep spell support, not a shallow helper.

Required behavior includes:
- strict known/prepared counts
- no overfill
- multiclass spell rules from day one
- meaningful support for mainstream spellcasting classes

### Edge Cases
For ritual/book/list edge cases:
- manual exceptions are acceptable in the first real version
- but the main spell experience must still feel robust overall

### Release Constraint
The user explicitly does not want the builder to launch with incomplete caster support.

If deep spell support is not ready enough for strict behavior, the builder should wait rather than shipping a weakened version.

## Inventory Support

### Supported Sources
The builder inventory should support:
- guided starting equipment bundles
- canonical compendium items

It should not support:
- custom/manual items in the first serious version

### Bundle Behavior
Starting equipment bundles should:
- seed inventory items
- not permanently lock inventory to the bundle
- allow normal edits afterward

### Mobile UX
Because spells and inventory can both involve large option sets, the builder should support search and filters inside the step itself.

The user does not want giant unstructured lists for heavy selection steps.

## Characteristics And Notes

### Characteristics
The characteristics step is explicitly roleplay-facing.

It should cover:
- name
- age
- alignment
- appearance

### Notes
Notes are pure optional freeform fields.

They should:
- never block completion
- never act as substitute resolution for unsupported rules logic
- remain available for player-specific comments or reminders

## Source And Edition Presentation

### Visibility
The builder should expose source metadata directly during choice selection.

The user wants source and edition information to be visible inline, not hidden only in deeper detail screens.

This should include:
- source labels
- edition signals
- legacy indicators where applicable

### Mixed Edition Policy
Mixed 2014 and 2024 content should be broadly allowed.

The builder should only block combinations when they create a concrete invalid rule state.

### Review Summary
Mixed-edition usage should still be summarized in review so the player has clear awareness of what they built.

## Validation Model

### Blocking Policy
Only real rules-invalid issues should block completion.

This means the builder should distinguish clearly between:
- informational notices
- unresolved checklist items
- blocking invalidity

### Informational Notices
These should not block completion by themselves:
- legacy content labels
- mixed-edition usage
- unusual but still legal combinations
- support-level hints that do not imply unresolved action

### Unresolved Checklist Items
Unresolved checklist items represent required follow-up where the builder cannot fully automate or verify something.

The user wants these to be blockers.

So unresolved checklist items:
- must be visible
- must be resolved before completion
- cannot be treated as informational only

### Completion Standard
A character may become complete only when:
- all required steps are sufficiently filled
- no blocking invalidity remains
- no unresolved checklist items remain

## Overrides

### Visibility Model
Overrides should be available through an advanced toggle.

They should not dominate the normal guided flow.

### Purpose
Overrides exist because the user wants:
- strict rules guidance by default
- a way to continue when the app cannot model something
- a way to intentionally bypass strict rules when desired

### Capabilities
Overrides may:
- resolve unsupported-content gaps
- bypass strict counts or constraints
- reflect intentional player deviation from strict automation

### Relationship To Completion
The user explicitly wants an override to be able to allow completion.

This means:
- unresolved invalidity blocks completion
- an explicit override counts as intentional resolution
- a character with overrides may still be `complete`

### Review Visibility
Overrides should be summarized clearly in the review step.

They should never be invisible once used.

## Autosave And Draft Persistence

### Save Behavior
The builder should autosave on change.

### Partial Progress
If a step is only partially filled and the user leaves:
- partial state should still be persisted
- the draft should remain resumable
- the user should be able to return later and continue

### Draft Regression
If a later edit makes a previously complete character invalid again:
- the character should fall back to `draft`

This is an intentional and desired lifecycle behavior.

## Completion State Machine

### Draft
A character is in `draft` when any of the following is true:
- required wizard steps are incomplete
- required class/species/background decisions are missing
- blocking invalidity remains unresolved
- unresolved checklist items remain
- later edits broke a previously complete build

### Complete
A character is in `complete` when all of the following are true:
- required steps are filled
- no blocking invalidity remains
- no unresolved checklist items remain
- any intentional deviations have been resolved through explicit override or valid player action

### Reversion
A `complete` character can become `draft` again after editing if validation no longer passes.

## Roster Expectations

The roster card for each character should show:
- name
- level
- class
- species
- draft/complete state

The roster should make it easy to distinguish:
- a character that is ready
- a character whose build must be resumed

## Post-Completion Preview

The user wants a very lightweight preview after completion.

This preview does not need to be:
- a full live sheet
- a campaign assignment screen
- a detailed session-management surface

It only needs to feel like a meaningful completion destination and a lightweight summary of the built character.

## Required Builder Preconditions

### Background Support Must Exist
Because background is required in the flow, the builder should not launch without actual background support in the content layer.

### Deep Spell Support Must Exist
Because the user wants strict spell counts, multiclass spellcasting, and non-trivial spell behavior, the builder should not launch early with shallow caster support.

If full spell support is not ready enough, the builder should wait rather than ship a compromised version.

## What This Spec Excludes

This spec does not require implementation of:
- campaign assignment during creation
- live HP or in-session status during building
- DM dashboard integration
- realtime collaboration while building
- homebrew workflows
- custom item creation in the first serious builder version
- campaign-specific sheet state

## Summary
The intended character builder is:
- a guided full-build wizard
- always resumable
- draft-first
- strict where reliable
- override-capable where necessary
- multiclass-capable from day one
- background-required
- spell-deep
- inventory-guided
- completion-aware
- mobile-first

It should produce a reusable global character build that is genuinely complete according to the app's supported rules model, while still giving advanced players a deliberate escape hatch through visible overrides.
