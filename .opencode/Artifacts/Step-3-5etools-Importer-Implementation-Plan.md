# Step 3 5etools Importer Implementation Plan

## Objective
Implement the 5etools import pipeline that converts raw 5etools content into normalized, app-owned seed files for native offline use. The output of this step is not UI behavior yet; it is a stable generated content foundation that the builder, compendium, and local SQLite seed flow can consume.

This step intentionally focuses on content ingestion, normalization, and generated artifacts. It does not implement the builder UI, compendium UI, or runtime content repositories beyond what is necessary to define the import contract.

## Confirmed Decisions
- Rules policy: 2024-first only for builder-visible content.
- Platform target: native only for offline support.
- Content strategy: bundle 5etools-derived content in the app.
- Corpus policy: import the full 5etools corpus, but surface 2024-first records in builder flows.
- V1 special scope: include fighting styles and eldritch invocations.
- Generated artifact strategy: check generated seed files into the repo.
- Generated artifact layout: entity type first.
- Generated artifact layout style: multiple smaller chunked seed files.

## Product Boundary

### Included In Step 3
- Raw 5etools source ingestion.
- Resolution of 5etools inheritance and versioning patterns.
- Canonical ID generation.
- 2024-first visibility and precedence rules.
- Normalization of species, classes, subclasses, feats, optional features, spells, items, and choice grants.
- Generation of searchable compendium entry payloads.
- Generation of chunked seed files under `generated/5etools/`.
- Generation of a manifest file describing chunks and counts.
- Validation for duplicate IDs, unresolved references, and malformed generated output.

### Explicitly Excluded From Step 3
- Builder UI implementation.
- Compendium UI implementation.
- SQLite runtime seeding integration.
- Native bootstrap wiring for generated seed import.
- Character creation screen logic.
- Deep runtime prerequisite enforcement in app screens.

## Feature Goals
- The app should no longer need to understand raw 5etools data shapes at runtime.
- Generated seed files should be stable, reviewable, and deterministic.
- Builder-critical systems should have normalized references and grants rather than prose-based parsing.
- Fighting styles must be represented correctly as 2024 feats.
- Eldritch invocations must be represented correctly as optional features.
- Full imported corpus should remain available for compendium generation, while builder visibility stays 2024-first.

## Architectural Approach

### Import Pipeline Strategy
Use a build-time importer outside the Expo runtime.

Flow:
1. Load raw 5etools files.
2. Resolve 5etools copy/mod/version/reprint semantics.
3. Normalize records into app-owned entities with canonical IDs.
4. Derive grants and compendium payloads.
5. Chunk the normalized entities into generated seed files.
6. Write a manifest describing the generated output.
7. Run validation over the generated dataset.

### Runtime Contract Strategy
The runtime app should only consume app-owned generated entities and never raw 5etools records.

Reason:
- raw 5etools data contains inheritance, tagged markup, source duplication, and reference conventions that are too irregular for direct runtime use.

### Output Strategy
Use entity-type-first chunked output under `generated/5etools/`.

Reason:
- this aligns generation with how the app will later seed and query content.
- it keeps diffs smaller and makes partial regeneration and inspection easier.

## Core Input Files

### Required Builder-Critical Inputs
- `data/races.json`
- `data/class/index.json` and referenced class files
- `data/feats.json`
- `data/optionalfeatures.json`
- `data/spells/index.json` and referenced spell files
- `data/items-base.json`
- `data/items.json`

### Supporting Full-Corpus Inputs
- other 5etools data sources needed to preserve full compendium coverage can be added to the importer contract as subsequent chunks, but the importer design in this step should allow them cleanly.

## Normalized Entity Scope

### 1. Species
Normalize builder-selectable species and imported supporting variants.

Expected output fields should cover:
- canonical ID
- source and edition metadata
- builder visibility flags
- summary and searchable text
- builder-relevant rule payloads

### 2. Classes And Subclasses
Normalize class identity, subclass identity, progression metadata, and selection grants.

Expected output fields should cover:
- canonical IDs
- parent-child class and subclass linkage
- source and edition metadata
- builder visibility flags
- spellcasting and progression metadata
- derived grants from feat and optional-feature progression

### 3. Feats
Normalize 2024 feats and legacy/imported supporting feats.

Requirements:
- preserve category tags
- preserve repeatability
- normalize prerequisites
- preserve granted spell and selection behavior
- represent fighting styles from `feats.json` correctly

### 4. Optional Features
Normalize optional features with emphasis on eldritch invocations.

Requirements:
- preserve `featureType`
- normalize prerequisites
- preserve granted spell and selection behavior
- represent invocations from `optionalfeatures.json` correctly

### 5. Spells
Normalize spell identity, source, search content, and builder-related metadata.

### 6. Items
Normalize mundane and magical item records, with V1 emphasis on equipment relevance.

### 7. Choice Grants
Normalize the selection opportunities that classes, subclasses, feats, and optional features unlock.

This must support:
- feat picks
- fighting style picks
- invocation picks
- nested granted selections from feats or optional features

### 8. Compendium Entries
Generate app-owned searchable content entries from normalized entities.

These entries should support:
- search text
- display summary
- render payload or equivalent display-safe content structure

## Canonical ID Strategy
Every normalized entity must have a canonical ID format that is stable across imports and safe for cross-entity references.

The exact format should be finalized before implementation begins, but it must support:
- source-aware uniqueness
- differentiation between entity kinds
- stable linkage across feats, invocations, spells, classes, subclasses, and items

Example direction:
- `fighter|xphb`
- `champion|xphb|subclass|fighter`
- `archery|xphb|feat`
- `devils-sight|xphb|optionalfeature`

## 2024-First Source Policy

### Builder Visibility Rules
- 2024 records should be the canonical builder-visible choice when available.
- older superseded equivalents should remain imported for compendium completeness but hidden from builder selection by default.
- if no 2024 equivalent exists, an older record may remain builder-visible only when explicitly allowed by the importer rules.

### Full Corpus Preservation
- imported data should preserve full-corpus coverage for later compendium use even when not visible in the builder.

## Important 2024 System Rules

### Fighting Styles
In 2024, fighting styles must be modeled from `feats.json`, not `optionalfeatures.json`.

Requirements:
- preserve categories such as `FS`, `FS:P`, and `FS:R`
- derive selection availability from normalized `featProgression`
- do not rely on prose parsing from class text for fighting-style unlocks

### Eldritch Invocations
In 2024, eldritch invocations remain optional features in `optionalfeatures.json`.

Requirements:
- preserve `featureType`, especially `EI`
- derive selection availability from normalized `optionalfeatureProgression`
- support invocation-to-invocation and invocation-to-spell prerequisite references

## Shared Importer Responsibilities

### 1. Source Loading
Create a loader layer that reads raw source files and hands records to downstream normalization without mixing I/O with business rules.

### 2. 5etools Resolution
Support the major 5etools structural patterns:
- `_copy`
- `_mod`
- `_versions`
- `reprintedAs`
- UID-like references

### 3. Text Processing
Convert tagged 5etools text into app-safe text and/or structured display payloads.

Requirements:
- preserve searchability
- preserve enough semantic structure for later compendium rendering
- avoid leaking raw 5etools markup into runtime seed consumers

### 4. Prerequisite Normalization
Normalize structured prerequisite cases for builder use, including:
- class level
- class or subclass requirements
- feat requirements
- optional feature requirements
- spell requirements
- text-only fallback cases when structure cannot be fully normalized

### 5. Validation
Importer validation must detect:
- duplicate canonical IDs
- unresolved references
- malformed normalized records
- malformed chunk files
- invalid manifest contents

## Proposed Generated Output Layout

```text
generated/
  5etools/
    content-index.json
    species/
    classes/
    feats/
    optional-features/
    spells/
    items/
    grants/
    compendium/
```

## Chunking Strategy

### Species
- primary 2024 selectable chunk
- one or more supporting legacy/full-corpus chunks

### Classes
- one file per class with subclasses embedded

### Feats
- general
- origin
- epic boons
- fighting styles
- other special categories as needed

### Optional Features
- at minimum, isolate eldritch invocations in their own chunk
- keep feature-type-based chunking possible for later categories

### Spells
- chunk by spell level for 2024-primary content
- support additional non-primary chunks if needed

### Items
- mundane equipment
- armor/weapons/tools
- additional chunks for broader magical content

### Grants
- keep normalized grants in separate chunk files so progression diffs remain inspectable

### Compendium
- keep searchable content chunks separate from builder-critical entity chunks

## Implementation Modules

### Importer Entrypoint
Responsibilities:
- orchestrate the full import flow
- coordinate loaders, normalizers, validation, and writers

### Source Loaders
Responsibilities:
- read raw 5etools files
- expose structured raw records to the importer

### Resolver Layer
Responsibilities:
- resolve 5etools copy/mod/version/reprint behavior before entity normalization

### Shared Normalization Utilities
Responsibilities:
- canonical ID generation
- source normalization
- edition and visibility rules
- text flattening/render extraction
- prerequisite helpers
- reference helpers

### Entity Normalizers
Responsibilities:
- normalize each entity type independently
- keep entity-specific rules isolated

### Grant Normalizer
Responsibilities:
- derive normalized selection grants from class, subclass, feat, and optional-feature progression fields

### Compendium Generator
Responsibilities:
- derive searchable display content from normalized entities

### Chunk Writer
Responsibilities:
- write chunked seed files with stable ordering

### Manifest Writer
Responsibilities:
- write `content-index.json`
- include schema version, chunk list, counts, and metadata

### Validation Layer
Responsibilities:
- fail generation when the normalized dataset is incomplete or inconsistent

## Verification Plan

### Structural Checks
- all expected output directories are generated
- chunk files are valid and deterministic
- manifest describes the generated output accurately

### Data Integrity Checks
- no duplicate canonical IDs
- all references resolve to canonical records
- class/subclass relationships are intact
- spell references resolve from feats, species, and invocations

### 2024 Builder Checks
- 2024 fighting styles are imported from feats and tagged correctly
- 2024 eldritch invocations are imported from optional features and tagged correctly
- grants expose fighting-style and invocation selection paths correctly
- builder-visible flags follow the 2024-first policy

## Risks And Tradeoffs
- Full corpus import increases complexity and generated output size, but avoids repainting the importer later.
- 5etools data is structurally rich but inconsistent in places, so validation is necessary before runtime integration.
- Preserving full corpus while enforcing 2024-first builder visibility requires explicit source precedence rules.
- Stable canonical IDs are critical; weak ID policy will create long-term migration pain.

## Exit Criteria
Step 3 is complete when all of the following are true:
- normalized entities are generated for species, classes, subclasses, feats, optional features, spells, items, grants, and compendium entries
- generated chunk files exist under the entity-type-first layout
- `content-index.json` is generated and accurate
- fighting styles are represented from feats correctly
- eldritch invocations are represented from optional features correctly
- cross-entity references resolve through canonical IDs
- builder visibility reflects the 2024-first policy
- runtime code no longer needs to understand raw 5etools structural quirks
