# Content Strategy: 5e Data for Private D&D Party App

## Overview
This document captures the agreed content strategy for v1 and v2, with a focus on how the app should handle 5e-compatible data derived from 5eTools-style sources.

The goal is to keep v1 as simple and reliable as possible while still supporting the core product pillars:
- guided character builder
- live character sheet
- searchable compendium

## Core Decisions
### No User Import in v1
The app will not expose any import workflow in v1.

That means:
- no DM import flow
- no player import flow
- no upload of JSON packs
- no runtime ingestion of arbitrary 5eTools files
- no campaign-scoped homebrew in v1

Instead, the app ships with a preloaded curated dataset.

### Homebrew is a v2 Concern
All homebrew-related capabilities are deferred to v2.

That includes:
- importing 5eTools-compatible JSON
- campaign-scoped custom content
- custom items
- custom classes, subclasses, feats, spells, or other rules content
- editing homebrew content in-app

### 2024 First, Legacy Allowed
The app should support both 2024 and legacy 2014 content, but all campaigns are treated as 2024 campaigns in v1.

That means:
- 2024 is the default baseline
- legacy 2014 content is allowed
- legacy content must be clearly labeled
- there is no 2014-only campaign mode in v1
- there is no automatic rules conversion between editions in v1

## Source Data Philosophy
5eTools-style data should be treated as a source format, not as the app's direct runtime contract.

The recommended approach is:
1. prepare supported 5e-compatible data ahead of time
2. preprocess and normalize it before runtime
3. ship app-friendly records to the mobile app and backend

This means the app should not read raw 5eTools JSON directly in normal UI flows.

## Supported Content Scope for v1
The v1 dataset is intentionally curated. It includes the content types most useful for character creation, live play, and rules lookup.

### Builder-Ready Content
These types should be preloaded, normalized, searchable, and usable in the character builder.

- Classes
- Subclasses
- Species/Races
- Backgrounds
- Feats
- Spells
- Items
- Optional Features

### Builder-Light Content
These types are included in v1 but handled with reduced automation.

- Languages

Language behavior in v1:
- languages are available as compendium entries
- the builder presents languages as a selectable list
- languages are stored directly on the character build
- no automatic grant logic is required in v1
- no deep inheritance rules from species, backgrounds, or classes in v1

### Reference-Only Content
These types are searchable and readable in the compendium, but are not deeply integrated into builder logic.

- Conditions
- Variant Rules
- Tables

## Explicit Exclusions from v1
The following types or capabilities are out of scope for v1.

### Excluded Content Types
- Boons
- Monsters/Creatures
- NPC stat blocks
- Hazards
- Objects
- Vehicles
- Cults
- Rewards
- Diseases
- Deities

### Excluded Feature Areas
- encounter tools or encounter-building data
- dice utilities
- custom or manual inventory items
- homebrew import or editing
- campaign-specific custom content

## Items in v1
Items are included in v1 and should support both compendium browsing and inventory use.

### Item Behavior
- items are searchable in the compendium
- a player can add existing items to character inventory
- inventory entries reference preloaded canonical item data
- players cannot create custom items in v1

### Recommended Inventory Capabilities
- add item from compendium to inventory
- remove item from inventory
- set quantity
- mark equipped if needed
- mark attuned if needed
- store optional player-specific notes if needed later

### Explicit v1 Limits
- no manual item creation
- no economy or shopping system
- no advanced encumbrance engine
- no complex container modeling
- no deep automated item-rule interactions

## Edition and Legacy Policy
The app supports both 2024 and legacy 2014 content, but the UX and builder are 2024-first.

### Campaign Model
In v1, there is no per-campaign edition branching.

All campaigns are effectively:
- `rules_edition = 2024`
- `allow_legacy_content = true`

### Builder Behavior
- 2024 content is shown first by default
- legacy 2014 content is also available
- legacy entries must be clearly labeled
- when a build includes legacy content, the app should indicate that visibly

### Compendium Behavior
- both 2024 and legacy 2014 entries are available
- filters and sorting should favor 2024 content by default
- source and edition labeling should always be visible enough to avoid confusion

### What We Are Not Doing in v1
- no 2014-only campaign mode
- no mixed-edition conversion engine
- no automatic reconciliation between 2014 and 2024 rules differences

## Recommended Normalized Metadata
For edition-sensitive content, normalized records should include at least:
- `name`
- `slug`
- `source_code`
- `source_name`
- `rules_edition`
- `is_legacy`

This is enough for v1 to support filtering, labeling, and builder warnings without overbuilding a compatibility system.

## Runtime Data Strategy
The runtime should rely on preprocessed, app-friendly data.

Recommended layers:

### Canonical Content Layer
Normalized records for supported content types used across builder and compendium.

### Builder Projections
Simplified, builder-oriented records derived from canonical content.

Examples:
- class options
- subclass options
- feat options
- spell options
- item options
- language options

### Compendium Projections
Flattened read/search records optimized for mobile compendium browsing.

## v1 Summary by Support Level
### Builder-Ready
- Classes
- Subclasses
- Species/Races
- Backgrounds
- Feats
- Spells
- Items
- Optional Features

### Builder-Light
- Languages as a selectable list only

### Reference-Only
- Conditions
- Variant Rules
- Tables

### Excluded
- Boons
- Monsters/Creatures
- NPC stat blocks
- Hazards
- Objects
- Vehicles
- Cults
- Rewards
- Diseases
- Deities
- all homebrew workflows
- custom/manual items

## v2 Direction
V2 can expand into private content extensibility and homebrew support.

Potential v2 additions:
- DM import of 5eTools-compatible JSON
- campaign-scoped content packs
- custom items
- homebrew classes, subclasses, feats, spells, and other records
- validation and diagnostics for imported files
- content versioning and reprocessing workflows

## Why This Strategy Fits the Product
This approach keeps v1 focused on the app's core promise:
- build a character
- run a character during play
- look up rules quickly

It avoids spending v1 effort on the hardest content-management problems:
- arbitrary import validation
- schema drift across user-supplied data
- homebrew support edge cases
- custom content conflict handling

It also supports the product direction of being 2024-first while still respecting tables that need legacy 2014 material.
