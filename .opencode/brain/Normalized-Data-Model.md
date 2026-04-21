# Normalized Data Model: V1 Content

## Overview
This document defines the proposed normalized data model for the v1 content types agreed in `Content-Strategy.md`.

The purpose of the normalized model is to turn preprocessed 5eTools-style source data into app-friendly records that are easy to:
- search in the compendium
- consume in the builder
- cache offline
- reference from character data

This document does not define the raw source format. It defines the runtime-facing content model the app should use after preprocessing.

## Design Principles
- Keep one shared base shape across all content types.
- Use type-specific detail fields only where the builder or compendium needs them.
- Prefer explicit app-owned IDs over depending on raw 5eTools identifiers.
- Preserve enough source metadata for debugging, filtering, and future reprocessing.
- Support both 2024-first content and legacy 2014 content without building a rules-conversion engine.

## Support Levels
This model only covers content included in v1.

### Builder-Ready
- `class`
- `subclass`
- `species`
- `background`
- `feat`
- `spell`
- `item`
- `optional_feature`

### Builder-Light
- `language`

### Reference-Only
- `condition`
- `variant_rule`
- `table`

## Model Layers
The content model is split into three layers.

### 1. Canonical Content Records
These are the normalized records stored in the content bundle and used as the source for both compendium and builder projections.

### 2. Builder Projections
These are flattened, builder-oriented views derived from canonical content. They exist to reduce UI logic complexity.

### 3. Character-Owned Records
These are campaign or character-specific records that reference canonical content, such as inventory items or selected feats.

## Base Content Shape
Every canonical content record should include these fields.

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | string | Yes | App-owned stable identifier |
| `entry_type` | enum | Yes | `class`, `subclass`, `species`, `background`, `feat`, `spell`, `item`, `optional_feature`, `language`, `condition`, `variant_rule`, `table` |
| `name` | string | Yes | Display name |
| `slug` | string | Yes | Stable searchable slug |
| `source_code` | string | Yes | Short source key, e.g. `phb` |
| `source_name` | string | Yes | Human-readable source name |
| `rules_edition` | enum | Yes | `2014` or `2024` |
| `is_legacy` | boolean | Yes | `true` for 2014 legacy content |
| `summary` | string \\ null | No | Short card/preview text |
| `text` | text | Yes | Plain searchable text representation |
| `render_payload` | jsonb | No | Structured rich display payload for compendium rendering |
| `metadata` | jsonb | Yes | Shared filter/search metadata |
| `tags` | string[] | Yes | Search and filter helpers |
| `search_text` | text | Yes | Precomputed normalized search text |
| `bundle_version` | string | Yes | Content bundle version |
| `source_ref` | jsonb | Yes | Traceability back to source content |
| `created_at` | timestamp | Yes | Creation time in our content pipeline |
| `updated_at` | timestamp | Yes | Last pipeline update time |

### Notes on Shared Fields
- `render_payload` should hold app-friendly structured content, not raw 5eTools blobs.
- `metadata` should stay reasonably flat and filter-oriented.
- `source_ref` can include raw source path, source entity key, and preprocessor version.

## Shared Metadata Shape
Every canonical content record should support a predictable metadata contract.

Suggested common fields in `metadata`:
- `category`
- `subtype`
- `prerequisites_summary`
- `level`
- `classes`
- `school`
- `rarity`
- `requires_attunement`
- `conditions`
- `table_group`

Only the relevant subset should be populated per entry type.

## Type-Specific Canonical Models

## `class`
Represents a player-selectable class.

### Required fields
| Field | Type | Notes |
|---|---|---|
| `hit_die` | integer | Example: `8`, `10`, `12` |
| `primary_abilities` | string[] | Example: `strength`, `wisdom` |
| `saving_throw_proficiencies` | string[] | Two or more ability keys |
| `armor_proficiencies` | string[] | Flattened normalized values |
| `weapon_proficiencies` | string[] | Flattened normalized values |
| `tool_proficiencies` | string[] | Flattened normalized values |
| `skill_choice_count` | integer | How many skills can be selected |
| `skill_options` | string[] | Builder options |
| `spellcasting_ability` | string \| null | Null if non-caster |
| `is_spellcaster` | boolean | Builder support |

### Optional fields
- `multiclass_requirements`
- `multiclass_proficiencies`
- `class_group`
- `starting_equipment_summary`
- `feature_ids_by_level`

## `subclass`
Represents a subclass attached to one parent class.

### Required fields
| Field | Type | Notes |
|---|---|---|
| `class_id` | string | App ID of parent class |
| `class_name` | string | Denormalized for easy display |
| `subclass_name` | string | Usually same as `name`, but explicit is useful |
| `granted_at_level` | integer | First selectable level |

### Optional fields
- `feature_ids_by_level`
- `spell_list_modifiers`
- `additional_choice_rules`

## `species`
V1 uses `species` as the app term even if source material uses race.

### Required fields
| Field | Type | Notes |
|---|---|---|
| `size_options` | string[] | Example: `medium`, `small` |
| `speed_walk` | integer \| null | Null if not defined cleanly |
| `darkvision_range` | integer \| null | Null if not applicable |
| `trait_summary` | string[] | Short trait labels |

### Optional fields
- `lineage_options`
- `movement_modes`
- `feature_ids`
- `suggested_languages`

### V1 simplification
No automatic language granting is required even if source data contains it.

## `background`
Represents background choice in builder and compendium.

### Required fields
| Field | Type | Notes |
|---|---|---|
| `ability_options` | string[] | If applicable in the chosen rules set |
| `feat_options` | string[] | Reference IDs or slugs if granted/linked |
| `skill_proficiencies` | string[] | Normalized values |
| `tool_proficiencies` | string[] | Normalized values |
| `equipment_summary` | string \| null | Short summary |

### Optional fields
- `feature_text`
- `suggested_languages`
- `origin_tags`

### V1 simplification
Backgrounds should expose data needed for display and guided selection, but not force a heavy automation engine.

## `feat`
Represents a selectable feat.

### Required fields
| Field | Type | Notes |
|---|---|---|
| `prerequisites_summary` | string \| null | Human-readable summary |
| `prerequisites_structured` | jsonb | Used for builder validation when possible |
| `benefit_summary` | string[] | Short display bullets |
| `repeatable` | boolean | Important for builder |

### Optional fields
- `ability_bonus_options`
- `granted_spells`
- `granted_feature_ids`

## `spell`
Represents a searchable and selectable spell.

### Required fields
| Field | Type | Notes |
|---|---|---|
| `level` | integer | `0` for cantrips |
| `school` | string | Normalized school |
| `casting_time` | string | Short normalized display string |
| `range` | string | Short normalized display string |
| `components` | jsonb | `{ v, s, m, material_text }` style |
| `duration` | string | Short normalized display string |
| `ritual` | boolean | Search/filter support |
| `concentration` | boolean | Live sheet relevance |
| `class_ids` | string[] | Supported casting classes |

### Optional fields
- `higher_level_text`
- `damage_tags`
- `condition_tags`
- `attack_type`
- `save_ability`

## `item`
Represents canonical compendium item data.

### Required fields
| Field | Type | Notes |
|---|---|---|
| `item_category` | string | Weapon, armor, gear, wondrous, etc. |
| `rarity` | string \| null | Normalized rarity |
| `weight` | number \| null | Optional if known |
| `cost_value` | integer \| null | Stored in smallest unit only if practical |
| `cost_unit` | string \| null | `cp`, `sp`, `gp`, etc. |
| `requires_attunement` | boolean | Inventory behavior |
| `equippable` | boolean | Inventory behavior |

### Optional fields
- `armor_class`
- `damage`
- `damage_type`
- `weapon_properties`
- `armor_type`
- `item_subtype`

### V1 simplification
Items are referenceable and addable to inventory, but v1 does not need full rules automation for all item effects.

## `optional_feature`
Represents fighting styles, invocations, maneuvers, and other selectable optional features.

### Required fields
| Field | Type | Notes |
|---|---|---|
| `feature_category` | string | Normalized category |
| `prerequisites_summary` | string \| null | Human-readable summary |
| `prerequisites_structured` | jsonb | Used when validation is possible |
| `benefit_summary` | string[] | Short display bullets |

### Optional fields
- `related_class_ids`
- `related_subclass_ids`
- `granted_spell_ids`
- `choice_group`

## `language`
Represents a builder-light selectable language entry.

### Required fields
| Field | Type | Notes |
|---|---|---|
| `language_category` | string | Standard, exotic, secret, etc. |
| `script` | string \| null | Optional script name |
| `speaker_summary` | string \| null | Optional flavor/usage text |

### V1 simplification
Languages are selectable list entries only. They do not require automatic grant logic in v1.

## `condition`
Represents a rules reference condition.

### Required fields
| Field | Type | Notes |
|---|---|---|
| `mechanical_summary` | string[] | Short bullet summaries for fast reading |
| `condition_tags` | string[] | Example: `movement`, `vision`, `action_limit` |

### Runtime note
Conditions are reference-only content, but characters may still store active condition state in `character_status`.

## `variant_rule`
Represents rules reference text that should be searchable in the compendium.

### Required fields
| Field | Type | Notes |
|---|---|---|
| `rule_category` | string | Optional grouping |
| `mechanical_summary` | string[] | Short bullet summaries |

## `table`
Represents displayable rules/reference tables.

### Required fields
| Field | Type | Notes |
|---|---|---|
| `columns` | string[] | Display column labels |
| `rows` | jsonb | Table row data |
| `table_group` | string \| null | For grouping in compendium |

## Builder Projection Models
Builder projections are derived from canonical records and optimized for selection screens.

### `builder_option`
A common projection shape that can be specialized per builder surface.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Projection ID |
| `content_id` | string | Canonical content ID |
| `entry_type` | string | Type of content |
| `name` | string | Display name |
| `subtitle` | string \| null | Short contextual text |
| `rules_edition` | enum | `2014` or `2024` |
| `is_legacy` | boolean | Legacy badge logic |
| `summary_bullets` | string[] | Lightweight preview |
| `prerequisites_summary` | string \| null | For feats/features |
| `sort_key` | string | Stable ordering |
| `filter_tags` | string[] | UI filtering |

### Specialized Builder Projections
Recommended specialized projections:
- `builder_class_option`
- `builder_subclass_option`
- `builder_background_option`
- `builder_feat_option`
- `builder_spell_option`
- `builder_item_option`
- `builder_language_option`

These can either be separate tables or generated views over the shared `builder_option` shape plus typed payload.

## Compendium Projection Model
The compendium view should use a flattened search/read model.

### `compendium_entry`
| Field | Type | Notes |
|---|---|---|
| `id` | string | Same as canonical content ID or direct derivative |
| `entry_type` | string | For filtering |
| `name` | string | Display title |
| `slug` | string | Deep link |
| `source_code` | string | Filter label |
| `source_name` | string | Filter label |
| `rules_edition` | enum | Edition badge |
| `is_legacy` | boolean | Legacy badge |
| `summary` | string \| null | Preview text |
| `search_text` | text | Precomputed search field |
| `metadata` | jsonb | Type-specific filter data |
| `render_payload` | jsonb | Structured display content |

This should be the primary searchable dataset cached to SQLite.

## Character-Owned Models
These records are not canonical compendium content. They reference canonical content and hold player-specific state.

## `character_selected_option`
Generic record for builder-linked selected content.

| Field | Type | Notes |
|---|---|---|
| `id` | string | App-owned ID |
| `character_id` | string | Owning character |
| `content_id` | string | Canonical content reference |
| `entry_type` | string | `feat`, `spell`, `optional_feature`, etc. |
| `selection_context` | string | Example: `class_choice`, `feat_choice`, `prepared_spell` |
| `selected_at_level` | integer \| null | Progression context |
| `notes` | text \| null | Optional player notes |
| `metadata` | jsonb | Selection-specific details |

## `character_inventory_item`
References canonical item content and stores character-specific inventory state.

| Field | Type | Notes |
|---|---|---|
| `id` | string | App-owned ID |
| `character_id` | string | Owning character |
| `item_id` | string | Canonical `item` content ID |
| `quantity` | integer | Default `1` |
| `is_equipped` | boolean | Live sheet relevance |
| `is_attuned` | boolean | Live sheet relevance |
| `notes` | text \| null | Optional player note |
| `sort_order` | integer \| null | UI ordering |

### V1 restriction
Every `character_inventory_item` must reference an existing canonical `item`. There are no manual items in v1.

## `character_known_language`
Stores selected languages for a character.

| Field | Type | Notes |
|---|---|---|
| `id` | string | App-owned ID |
| `character_id` | string | Owning character |
| `language_id` | string | Canonical `language` content ID |
| `selection_source` | string \| null | Optional: `manual`, `background`, `species`, etc. |

### V1 simplification
`selection_source` is optional because the app does not need automatic grant logic in v1.

## Search and Filter Recommendations
At minimum, canonical content and compendium records should support filtering by:
- `entry_type`
- `source_code`
- `rules_edition`
- `is_legacy`

Additional type-specific filters:
- spells by `level`, `school`, `class_ids`, `ritual`, `concentration`
- items by `item_category`, `rarity`, `requires_attunement`
- feats and optional features by `prerequisites_summary` and `related_class_ids`

## Legacy Content Handling
Edition-sensitive canonical records should always preserve:
- `rules_edition`
- `is_legacy`

V1 behavior enabled by this model:
- sort 2024 content first
- label legacy 2014 content clearly
- show builder warnings when legacy options are selected

The model intentionally does not attempt:
- cross-edition conversion
- automatic reconciliation between 2014 and 2024 feature differences
- equivalence mapping across all replaced content

## Suggested Initial Implementation Order
1. `compendium_entry` base shape
2. `class`
3. `subclass`
4. `background`
5. `feat`
6. `spell`
7. `item`
8. `optional_feature`
9. `species`
10. `language`
11. `condition`
12. `variant_rule`
13. `table`
14. `character_inventory_item`
15. `character_known_language`

## Open Follow-Up Questions
- Should `species` and `race` remain one merged app concept, or should source terminology be preserved in UI labels?
- How rich should `render_payload` be in v1: plain blocks only, or structured sections/tables/inset content?
- Should `character_selected_option` remain generic, or should feats/spells/features get separate join tables early?
- Do we want optional equivalence metadata later, such as `supersedes` or `replaced_by`, for 2014 vs 2024 content?
