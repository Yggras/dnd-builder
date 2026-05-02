import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  IMPORTER_SCHEMA_VERSION,
  OUTPUT_ROOT,
  SOURCE_REF,
  SOURCE_REPOSITORY,
} from './config.mjs';
import { stableSortBy } from './utils.mjs';

const GENERATED_REGISTRY_PATH = path.join(process.cwd(), 'src', 'shared', 'content', 'generated', '5etoolsRegistry.ts');

function createChunk(entityType, chunkId, records, generatedAt, contentVersion) {
  return {
    schemaVersion: IMPORTER_SCHEMA_VERSION,
    contentVersion,
    entityType,
    chunkId,
    generatedAt,
    records,
  };
}

async function writeJson(filePath, payload) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function toImportName(value) {
  return value.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^([0-9])/, '_$1');
}

async function writeGeneratedRegistry(manifest) {
  const importLines = [
    `import bundledContentIndex from '../../../../generated/5etools/content-index.json';`,
  ];

  const registryEntries = [];

  for (const chunk of manifest.chunks) {
    const importName = toImportName(`${chunk.entityType}_${chunk.chunkId}`);
    importLines.push(`import ${importName} from '../../../../${chunk.filePath}';`);
    registryEntries.push(`  '${chunk.filePath}': ${importName},`);
  }

  const fileContents = [
    ...importLines,
    '',
    'export const bundledContentManifest = bundledContentIndex;',
    '',
    'export const bundledContentChunks = {',
    ...registryEntries,
    '};',
    '',
  ].join('\n');

  await mkdir(path.dirname(GENERATED_REGISTRY_PATH), { recursive: true });
  await writeFile(GENERATED_REGISTRY_PATH, fileContents, 'utf8');
}

function splitByPredicate(records, predicate) {
  return {
    primary: records.filter(predicate),
    secondary: records.filter((record) => !predicate(record)),
  };
}

function toChunkId(value) {
  return value.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function chunkFeats(records) {
  const buckets = {
    general: [],
    origin: [],
    epicBoons: [],
    fightingStyles: [],
    other: [],
  };

  for (const record of records) {
    if (record.categoryTags.includes('FS') || record.categoryTags.includes('FS:P') || record.categoryTags.includes('FS:R')) {
      buckets.fightingStyles.push(record);
    } else if (record.categoryTags.includes('EB')) {
      buckets.epicBoons.push(record);
    } else if (record.metadata.category === 'O') {
      buckets.origin.push(record);
    } else if (record.metadata.category === 'G') {
      buckets.general.push(record);
    } else {
      buckets.other.push(record);
    }
  }

  return buckets;
}

function chunkOptionalFeatures(records) {
  return {
    eldritchInvocations: records.filter((record) => record.categoryTags.includes('EI')),
    other: records.filter((record) => !record.categoryTags.includes('EI')),
  };
}

function chunkSpells(records) {
  const buckets = new Map();

  for (const record of records) {
    const bucket = `level-${record.metadata.level ?? 0}`;
    if (!buckets.has(bucket)) {
      buckets.set(bucket, []);
    }
    buckets.get(bucket).push(record);
  }

  return Object.fromEntries(buckets.entries());
}

function chunkItems(records) {
  return {
    mundaneEquipment: records.filter(
      (record) => record.metadata.category === 'basic' || record.metadata.rarity == null || record.metadata.rarity === 'none',
    ),
    magicItems: records.filter(
      (record) => !(record.metadata.category === 'basic' || record.metadata.rarity == null || record.metadata.rarity === 'none'),
    ),
  };
}

function stableSerialize(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort((left, right) => left.localeCompare(right))
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function createDerivedContentVersion(versionInput) {
  const hash = createHash('sha256').update(stableSerialize(versionInput)).digest('hex').slice(0, 16);
  return `schema${IMPORTER_SCHEMA_VERSION}-${hash}`;
}

export async function writeGeneratedContent(entityGroups) {
  const generatedAt = new Date().toISOString();
  const manifestChunks = [];
  const pendingChunkFiles = [];

  await rm(OUTPUT_ROOT, { recursive: true, force: true });

  const speciesSplit = splitByPredicate(entityGroups.species, (record) => record.isPrimary2024);
  const speciesChunks = {
    'primary-2024': speciesSplit.primary,
    legacy: speciesSplit.secondary,
  };

  const classChunks = Object.fromEntries(
    entityGroups.classes.map((classRecord) => [
      toChunkId(classRecord.id),
      {
        class: classRecord,
        subclasses: stableSortBy(
          entityGroups.subclasses.filter((subclass) => subclass.classId === classRecord.id),
          (subclass) => subclass.id,
        ),
      },
    ]),
  );
  const featChunks = chunkFeats(entityGroups.feats);
  const backgroundChunks = {
    all: entityGroups.backgrounds,
  };
  const optionalFeatureChunks = chunkOptionalFeatures(entityGroups.optionalFeatures);
  const spellChunks = chunkSpells(entityGroups.spells);
  const itemChunks = chunkItems(entityGroups.items);
  const conditionChunks = { all: entityGroups.conditions };
  const actionChunks = { all: entityGroups.actions };
  const variantRuleChunks = { all: entityGroups.variantRules };
  const grantChunks = { all: entityGroups.choiceGrants };
  const compendiumChunks = {
    backgrounds: entityGroups.compendiumEntries.filter((record) => record.entityType === 'background'),
    species: entityGroups.compendiumEntries.filter((record) => record.entityType === 'species'),
    classes: entityGroups.compendiumEntries.filter((record) => record.entityType === 'class'),
    subclasses: entityGroups.compendiumEntries.filter((record) => record.entityType === 'subclass'),
    feats: entityGroups.compendiumEntries.filter((record) => record.entityType === 'feat'),
    optionalFeatures: entityGroups.compendiumEntries.filter((record) => record.entityType === 'optionalfeature'),
    spells: entityGroups.compendiumEntries.filter((record) => record.entityType === 'spell'),
    items: entityGroups.compendiumEntries.filter((record) => record.entityType === 'item'),
    conditions: entityGroups.compendiumEntries.filter((record) => record.entityType === 'condition'),
    actions: entityGroups.compendiumEntries.filter((record) => record.entityType === 'action'),
    variantRules: entityGroups.compendiumEntries.filter((record) => record.entityType === 'variantrule'),
  };

  const chunkGroups = [
    ['species', speciesChunks],
    ['classes', classChunks],
    ['backgrounds', backgroundChunks],
    ['feats', featChunks],
    ['optional-features', optionalFeatureChunks],
    ['spells', spellChunks],
    ['items', itemChunks],
    ['conditions', conditionChunks],
    ['actions', actionChunks],
    ['variant-rules', variantRuleChunks],
    ['grants', grantChunks],
    ['compendium', compendiumChunks],
  ];

  for (const [entityType, chunkMap] of chunkGroups) {
    for (const [chunkId, records] of Object.entries(chunkMap)) {
      const filePath = path.join(OUTPUT_ROOT, entityType, `${chunkId}.json`);
      pendingChunkFiles.push({ entityType, chunkId, filePath, records });

      manifestChunks.push({
        entityType,
        chunkId,
        filePath,
        recordCount: Array.isArray(records) ? records.length : records.class ? 1 + records.subclasses.length : 0,
      });
    }
  }

  const sortedManifestChunks = stableSortBy(manifestChunks, (record) => `${record.entityType}/${record.chunkId}`);
  const contentVersion = createDerivedContentVersion({
    schemaVersion: IMPORTER_SCHEMA_VERSION,
    sourceRepository: SOURCE_REPOSITORY,
    sourceRef: SOURCE_REF,
    entityCounts: {
      species: entityGroups.species.length,
      classes: entityGroups.classes.length,
      subclasses: entityGroups.subclasses.length,
      backgrounds: entityGroups.backgrounds.length,
      feats: entityGroups.feats.length,
      optionalFeatures: entityGroups.optionalFeatures.length,
      spells: entityGroups.spells.length,
      items: entityGroups.items.length,
      conditions: entityGroups.conditions.length,
      actions: entityGroups.actions.length,
      variantRules: entityGroups.variantRules.length,
      choiceGrants: entityGroups.choiceGrants.length,
      compendiumEntries: entityGroups.compendiumEntries.length,
    },
    chunks: stableSortBy(
      pendingChunkFiles.map((chunk) => ({
        entityType: chunk.entityType,
        chunkId: chunk.chunkId,
        filePath: chunk.filePath,
        records: chunk.records,
      })),
      (record) => `${record.entityType}/${record.chunkId}`,
    ),
  });

  for (const chunk of pendingChunkFiles) {
    await writeJson(chunk.filePath, createChunk(chunk.entityType, chunk.chunkId, chunk.records, generatedAt, contentVersion));
  }

  const manifest = {
    schemaVersion: IMPORTER_SCHEMA_VERSION,
    contentVersion,
    generatedAt,
    sourceRepository: SOURCE_REPOSITORY,
    sourceRef: SOURCE_REF,
    chunkCount: manifestChunks.length,
    entityCounts: {
      species: entityGroups.species.length,
      classes: entityGroups.classes.length,
      subclasses: entityGroups.subclasses.length,
      backgrounds: entityGroups.backgrounds.length,
      feats: entityGroups.feats.length,
      optionalFeatures: entityGroups.optionalFeatures.length,
      spells: entityGroups.spells.length,
      items: entityGroups.items.length,
      conditions: entityGroups.conditions.length,
      actions: entityGroups.actions.length,
      variantRules: entityGroups.variantRules.length,
      choiceGrants: entityGroups.choiceGrants.length,
      compendiumEntries: entityGroups.compendiumEntries.length,
    },
    chunks: sortedManifestChunks,
  };

  await writeJson(path.join(OUTPUT_ROOT, 'content-index.json'), manifest);
  await writeGeneratedRegistry(manifest);

  return manifest;
}
