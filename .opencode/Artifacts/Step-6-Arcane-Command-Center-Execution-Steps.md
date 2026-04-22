# Step 6 Arcane Command Center Execution Steps

## Goal
Execute the first full UI polish pass in a controlled sequence so the app gains a cohesive premium visual identity without changing feature boundaries, data contracts, or app architecture.

## Execution Rules
- Do not add new feature scope while restyling the app.
- Do not change repository, service, or hook boundaries for visual convenience.
- Do not introduce decorative fantasy clutter, novelty fonts, or heavy animation.
- Do not add light-mode support or runtime theming in this step.
- Keep emerald reserved for positive and status semantics; use violet as the main interactive accent.
- Preserve current screen behavior while improving presentation.

## Step-By-Step Execution Sequence

### 1. Confirm The Redesign Contract
- Confirm the redesign remains presentation-only.
- Confirm `Arcane Command Center` is the active visual direction.
- Confirm typography stays mostly clean sans with ceremonial treatment only in prominent headings.
- Confirm violet is the primary accent and emerald is not used as the default CTA color.

Output:
- stable redesign contract for the UI polish pass.

### 2. Introduce Shared UI Tokens
- Add a lightweight shared token module for colors, spacing, radii, and visual roles.
- Define token names around semantic roles rather than screen-specific use.
- Keep the token layer compatible with the existing `StyleSheet` approach.

Output:
- shared visual system source of truth.

### 3. Restyle The Shared Screen Shell
- Update the global screen wrapper to establish the new background, spacing, and page rhythm.
- Ensure existing screens inherit the improved base look without route changes.

Output:
- global page shell aligned to the redesign.

### 4. Restyle App Navigation Chrome
- Update the authenticated stack header appearance in the app shell.
- Keep auth routes visually consistent even if their header remains hidden.
- Preserve current route structure and navigation flow.

Output:
- app-level navigation chrome aligned to the redesign.

### 5. Restyle Shared Primitives
- Update shared buttons, cards, loading, empty, error, and placeholder surfaces.
- Make pressed states, contrast, and panel depth consistent.
- Ensure placeholder-driven routes improve immediately from these shared changes.

Output:
- reusable Arcane Command Center primitives for current screens.

### 6. Redesign The Sign-In Screen
- Rework hierarchy, spacing, and field framing.
- Improve message presentation for validation and sign-in feedback.
- Keep the screen practical and legible while reflecting the private premium product tone.

Output:
- polished auth entry screen.

### 7. Redesign The Authenticated Home Screen
- Shift the screen from scaffold overview to command hub.
- Strengthen hero hierarchy and route-entry card affordances.
- Preserve current route destinations and session actions.

Output:
- polished authenticated home hub.

### 8. Redesign The Compendium Search Screen
- Improve the search panel, chip system, results header, and result cards.
- Keep current local search, filter, and navigation behavior intact.
- Preserve clear edition and source labeling.

Output:
- flagship polished compendium list experience.

### 9. Redesign The Compendium Detail Screen
- Improve heading hierarchy, badge treatments, and content section framing.
- Preserve the current text-first rendering strategy.
- Keep long-form readability as the main priority.

Output:
- polished compendium detail experience.

### 10. Verify Placeholder Inheritance
- Open the campaign, character, and DM dashboard placeholder routes.
- Confirm the shared placeholder styling makes unfinished features feel consistent with the redesigned product.

Output:
- placeholder surfaces visually aligned with the redesign.

### 11. Run Technical Verification
- Run TypeScript typecheck.
- Confirm no feature boundaries were broken to achieve the redesign.
- Confirm no unintended behavior changes were introduced during the visual pass.

Output:
- validated Step 6 UI polish baseline.

## Task List
1. Confirm the visual redesign contract.
2. Add shared UI tokens.
3. Restyle the global screen shell.
4. Restyle authenticated navigation chrome.
5. Restyle shared primitives.
6. Redesign the sign-in screen.
7. Redesign the authenticated home screen.
8. Redesign the compendium search screen.
9. Redesign the compendium detail screen.
10. Verify placeholder inheritance.
11. Run typecheck and final technical verification.

## Risks During Execution

### Risk 1: The Redesign Drifts Into Feature Scope
Mitigation:
- keep the step presentation-only and reject opportunistic data or architecture changes.

### Risk 2: Tokens Are Added But Screens Keep Raw Duplicated Styling
Mitigation:
- convert shared primitives first, then migrate the highest-visibility screens to the token layer.

### Risk 3: Visual Styling Becomes Too Decorative
Mitigation:
- prefer hierarchy, contrast, borders, and restrained accent usage over textures, gimmicks, or theatrical effects.

### Risk 4: Compendium Screens Become Inconsistent With Shared Primitives
Mitigation:
- finish the shared panel, chip, and badge language before the compendium pass.

### Risk 5: Contrast Or Mobile Readability Regresses
Mitigation:
- check common text roles, badges, and long-form detail content during verification on mobile-sized layouts.

## Exit Criteria
Step 6 is complete when:
- the redesign contract is implemented without feature-scope creep
- a shared token layer and shared primitive redesign are in place
- sign-in, home, compendium list, and compendium detail are visually upgraded
- placeholder routes inherit the new visual system cleanly
- typecheck and manual UI verification pass
