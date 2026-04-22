# Step 6 Arcane Command Center Implementation Plan

## Objective
Apply a cohesive visual redesign to the current mobile app so the authenticated shell, auth flow, shared primitives, and compendium surfaces all feel like one intentional product rather than a collection of scaffold screens.

The outcome of this step is a shared visual system and a first polished UI pass built around the agreed `Arcane Command Center` direction: dark premium surfaces, violet-led interaction accents, emerald reserved for positive status signals, and a mostly clean sans typographic system with slightly ceremonial treatment only for prominent headings.

This step intentionally focuses on presentation quality and UI consistency. It does not add new product capabilities, alter repository or service contracts, or broaden any existing feature scope.

## Confirmed Decisions
- Visual direction: `Arcane Command Center`.
- Primary interactive accent: violet.
- Positive/status accent: emerald only.
- Typography direction: mostly clean sans, with stronger hierarchy and subtle ceremonial styling only in major headings and labels.
- Design strategy: introduce a minimal shared theme/token layer before restyling screens.
- Architecture rule: preserve existing screen, repository, service, and hook boundaries.
- Execution rule for this artifact phase: document the plan and execution sequence before any UI code is written.

## Product Boundary

### Included In Step 6
- Introduce a lightweight shared design token layer for the current React Native UI.
- Restyle the app shell and shared primitives.
- Redesign the sign-in screen.
- Redesign the authenticated home screen.
- Redesign the compendium list screen.
- Redesign the compendium detail screen.
- Let placeholder-driven surfaces inherit the new shared visual system.
- Verify the redesign with typecheck and manual UI checks.

### Explicitly Excluded From Step 6
- New data models, repository methods, or service-layer changes.
- New feature flows for campaigns, characters, DM dashboard, or builder workflows.
- Rich compendium rendering beyond the current text-first contract.
- New navigation architecture.
- Animation-heavy UI work or broad motion systems.
- Runtime theme switching, dark/light mode support, or user theming controls.

## Feature Goals
- Every current screen should feel visually related and product-specific.
- Shared UI primitives should replace the current screen-by-screen duplication of colors and surface treatments.
- The sign-in screen should feel like a polished private entry point rather than a scaffold form.
- The authenticated home screen should feel like a party operations hub rather than a route index.
- The compendium should become the flagship polished surface for the current product phase.
- Placeholder routes should still look intentional and presentable while awaiting deeper feature implementation.

## Design System Direction

### Core Visual Mood
The redesign should feel like a tactical magical instrument panel: dark, calm, high-contrast, and premium, with restrained fantasy flavor carried by color, hierarchy, and panel treatment rather than decorative textures.

### Color Roles
Recommended token roles:
- `background`: near-black navy base
- `surface`: obsidian panel background
- `surfaceElevated`: slightly lighter layered surface
- `surfaceAccent`: selective accent-tinted panel treatment where appropriate
- `textPrimary`: high-contrast parchment-white
- `textSecondary`: readable secondary copy
- `textMuted`: subdued metadata and support text
- `accentPrimary`: violet for main interactive emphasis
- `accentSuccess`: emerald for positive or healthy states only
- `accentLegacy`: amber or copper for legacy content and caution states
- `borderSubtle`: low-contrast panel separation
- `borderStrong`: focused or active state separation

### Typography Direction
- Keep body and control text clean and highly readable.
- Use stronger weight, spacing, casing, and accent color to make key headings feel ceremonial.
- Avoid decorative fantasy fonts, novelty runes, or heavy monospace reliance.

### Interaction Direction
- Pressed and active states should rely on border, fill, and contrast shifts.
- Avoid scaling effects that cause layout instability.
- Keep visual effects restrained: light glow only where it clarifies emphasis.

## Architectural Approach

### Shared Token Strategy
Add one lightweight shared UI token module rather than introducing a large theming framework.

Reason:
- removes duplicated raw color usage
- keeps the current `StyleSheet` approach intact
- reduces redesign risk by allowing incremental adoption

### Shared Primitive Strategy
Restyle shared primitives before touching feature screens.

Reason:
- the app already routes many surfaces through shared UI components
- placeholder screens improve immediately once shared primitives are updated
- screen redesign work becomes smaller once the base panel language exists

### Screen Strategy
Apply the first detailed screen pass to the most visible and currently implemented flows:
- auth sign-in
- authenticated home
- compendium search
- compendium detail

Reason:
- these surfaces are the clearest user-facing proof of the redesign
- they provide the strongest visual return without changing underlying behavior

## Code Areas To Change

### 1. Shared Theme Layer
Add a small shared token module for colors, spacing, radii, and related visual roles.

Responsibilities:
- define reusable visual tokens
- eliminate repeated raw values over time
- support current `StyleSheet`-based implementation

### 2. Global Screen Shell
Restyle the shared screen wrapper used across the app.

Primary target:
- `src/shared/ui/Screen.tsx`

Responsibilities:
- establish the global background language
- standardize page padding rhythm
- improve perceived polish across all screens

### 3. Navigation Shell
Restyle the authenticated stack chrome while preserving route structure.

Primary targets:
- `app/(app)/_layout.tsx`
- `app/(auth)/_layout.tsx`

Responsibilities:
- align header presentation with the new visual system
- keep auth visually quiet but consistent

### 4. Shared UI Primitives
Restyle the reusable components that define the current app look.

Primary targets:
- `src/shared/ui/PrimaryButton.tsx`
- `src/shared/ui/SurfaceCard.tsx`
- `src/shared/ui/FeaturePlaceholder.tsx`
- `src/shared/ui/EmptyState.tsx`
- `src/shared/ui/ErrorState.tsx`
- `src/shared/ui/LoadingState.tsx`

Responsibilities:
- establish one consistent panel language
- improve contrast and interaction affordance
- remove the current flat scaffold feel

### 5. Sign-In Screen
Redesign the authentication entry screen without changing the sign-in behavior.

Primary target:
- `src/features/auth/screens/SignInScreen.tsx`

Responsibilities:
- improve hierarchy and framing
- improve input and feedback presentation
- reflect the private premium product tone

### 6. Home Screen
Redesign the authenticated home screen as a command hub.

Primary target:
- `src/features/auth/screens/HomeScreen.tsx`

Responsibilities:
- strengthen top-level hierarchy
- improve session identity treatment
- give route entry cards better affordance and visual depth

### 7. Compendium Screens
Redesign the current compendium list and detail experience while preserving the existing data contract.

Primary targets:
- `src/features/compendium/screens/CompendiumScreen.tsx`
- `src/features/compendium/screens/CompendiumDetailScreen.tsx`

Responsibilities:
- elevate the compendium into the most polished surface in the app
- unify chip, badge, and panel treatments
- improve metadata readability and text hierarchy

## Implementation Sequence
1. Add shared UI tokens.
2. Restyle the shared screen shell.
3. Restyle authenticated stack header chrome.
4. Restyle shared primitives.
5. Redesign the sign-in screen.
6. Redesign the authenticated home screen.
7. Redesign the compendium list screen.
8. Redesign the compendium detail screen.
9. Run typecheck and manual visual verification.

## UX Requirements
- Text contrast must remain high on all dark surfaces.
- All tappable cards, chips, and buttons must communicate interactivity clearly.
- No press interaction should cause layout shift.
- Legacy content badges must remain visually distinct from default 2024 content indicators.
- Long-form compendium detail text must remain readable on mobile.
- Placeholder screens must remain informative, but should no longer look temporary or generic.

## Verification Plan

### Visual Checks
- Shared screens use a consistent background, panel, and border language.
- The new violet accent reads as the product identity color.
- Emerald is used only for success or positive status semantics.
- Auth, home, and compendium all feel like part of the same product.

### Interaction Checks
- Buttons, cards, and filter chips have clear pressed states.
- Interactive components have appropriate accessibility roles where relevant.
- No horizontal overflow appears on common mobile widths.

### Compendium Checks
- Search UI remains readable and scannable.
- Metadata badges remain distinct and consistent.
- Detail content remains readable for long entries.

### Technical Checks
- TypeScript compiles cleanly.
- No repository, service, or hook boundaries are bypassed.
- The redesign remains presentation-only and does not alter runtime behavior unexpectedly.

## Risks And Tradeoffs
- Introducing tokens adds an extra abstraction layer, but it prevents the redesign from becoming another round of duplicated color values.
- A strong visual redesign can easily drift into decorative fantasy UI; restraint is required to keep the product practical.
- If too much visual work is pushed into individual screens before shared primitives are updated, the redesign will become inconsistent again.
- Compendium screens have the heaviest style duplication, so they should be redesigned after the shared system is stable.

## Exit Criteria
Step 6 is complete when all of the following are true:
- a shared UI token layer exists and is used by the redesigned surfaces
- the app shell and shared primitives reflect the Arcane Command Center direction
- sign-in and home screens are visually upgraded without behavior changes
- compendium list and detail screens are visually upgraded without data-contract changes
- placeholder-driven screens inherit the new visual system cleanly
- typecheck and manual UI verification pass
