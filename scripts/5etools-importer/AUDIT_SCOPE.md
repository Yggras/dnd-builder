# 5eTools Import Audit Scope

This audit covers only 5eTools categories that the app currently imports. When a new 5eTools category or source file is added to the importer, this document and `scripts/audit-5etools.mjs` must be extended in the same change.

## Strictly Audited Categories

| Category | Source files |
| --- | --- |
| species | `data/races.json` |
| classes | `data/class/index.json`, indexed `data/class/*.json` |
| subclasses | `data/class/index.json`, indexed `data/class/*.json` |
| backgrounds | `data/backgrounds.json`, `data/fluff-backgrounds.json` |
| feats | `data/feats.json` |
| optional features | `data/optionalfeatures.json` |
| spells | `data/spells/index.json`, indexed `data/spells/*.json`, `data/generated/gendata-spell-source-lookup.json` |
| items | `data/items-base.json`, `data/items.json` |
| item properties | `data/items-base.json` `itemProperty`, generated as `variantrule` records |
| item masteries | `data/items-base.json` `itemMastery`, generated as `variantrule` records |
| conditions | `data/conditionsdiseases.json` |
| actions | `data/actions.json` |
| variant rules | `data/variantrules.json` |
| choice grants | derived from imported classes, subclasses, feats, and optional features |
| compendium entries | derived from imported entity categories |

## Out Of Scope

These 5eTools categories are not currently imported. The audit may report them as informational out-of-scope data, but their absence must not fail the audit.

- adventures
- bastions
- bestiary / monsters
- books
- character creation options
- cults and boons
- decks
- deities
- encounters
- homecrafts
- languages
- loot
- magic variants
- monster features
- names
- objects
- psionics
- recipes
- rewards
- senses
- skills
- tables
- traps and hazards
- vehicles

## Strictness Policy

- Fail when a strictly audited category is missing records between normalization and generated content.
- Fail when generated manifest counts disagree with actual chunk contents.
- Fail when an imported class or subclass variant is not reachable through generated class chunks.
- Warn or report informationally for unsupported 5eTools categories.
- Warn for known non-critical diagnostics unless they directly hide imported records.
