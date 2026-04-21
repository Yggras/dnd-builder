import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  CONTENT_VERSION,
  IMPORTER_SCHEMA_VERSION,
  OUTPUT_ROOT,
  SOURCE_REF,
  SOURCE_REPOSITORY,
} from './config.mjs';
import { stableSortBy } from './utils.mjs';

function createChunk(entityType, chunkId, records, generatedAt) {
  return {
    schemaVersion: IMPORTER_SCHEMA_VERSION,
    contentVersion: CONTENT_VERSION,
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

function splitByPredicate(records, predicate) {
  return {
    primary: records.filter(predicate),
    secondary: records.filter((record) => !predicate(record)),
  };
}

function selectPreferredRecord(records) {
  return [...records].sort((left, right) => {
    if (left.isPrimary2024 !== right.isPrimary2024) {
      return left.isPrimary2024 ? -1 : 1;
    }

    if (left.isSelectableInBuilder !== right.isSelectableInBuilder) {
      return left.isSelectableInBuilder ? -1 : 1;
    }

    return left.id.localeCompare(right.id);
  })[0];
}

function selectPreferredSubclasses(subclasses) {
  const subclassesByName = subclasses.reduce((map, record) => {
    const key = record.name.toLowerCase();
    if (!map.has(key)) {
      map.set(key, []);
    }

    map.get(key).push(record);
    return map;
  }, new Map());

  return stableSortBy(
    [...subclassesByName.values()].map((records) => selectPreferredRecord(records)),
    (record) => record.id,
  );
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

export async function writeGeneratedContent(entityGroups) {
  const generatedAt = new Date().toISOString();
  const manifestChunks = [];

  await rm(OUTPUT_ROOT, { recursive: true, force: true });

  const speciesSplit = splitByPredicate(entityGroups.species, (record) => record.isPrimary2024);
  const speciesChunks = {
    'primary-2024': speciesSplit.primary,
    legacy: speciesSplit.secondary,
  };

  const classesByName = entityGroups.classes.reduce((map, record) => {
    const key = record.name.toLowerCase();
    if (!map.has(key)) {
      map.set(key, []);
    }

    map.get(key).push(record);
    return map;
  }, new Map());

  const classChunks = Object.fromEntries(
    [...classesByName.entries()].map(([nameKey, records]) => {
      const selectedClass = selectPreferredRecord(records);

      return [
        nameKey.replace(/[^a-z0-9]+/g, '-'),
        {
          class: selectedClass,
          subclasses: selectPreferredSubclasses(
            entityGroups.subclasses.filter((subclass) => subclass.classId === selectedClass.id),
          ),
        },
      ];
    }),
  );
  const featChunks = chunkFeats(entityGroups.feats);
  const optionalFeatureChunks = chunkOptionalFeatures(entityGroups.optionalFeatures);
  const spellChunks = chunkSpells(entityGroups.spells);
  const itemChunks = chunkItems(entityGroups.items);
  const grantChunks = { all: entityGroups.choiceGrants };
  const compendiumChunks = {
    species: entityGroups.compendiumEntries.filter((record) => record.entityType === 'species'),
    classes: entityGroups.compendiumEntries.filter((record) => record.entityType === 'class'),
    subclasses: entityGroups.compendiumEntries.filter((record) => record.entityType === 'subclass'),
    feats: entityGroups.compendiumEntries.filter((record) => record.entityType === 'feat'),
    optionalFeatures: entityGroups.compendiumEntries.filter((record) => record.entityType === 'optionalfeature'),
    spells: entityGroups.compendiumEntries.filter((record) => record.entityType === 'spell'),
    items: entityGroups.compendiumEntries.filter((record) => record.entityType === 'item'),
  };

  const chunkGroups = [
    ['species', speciesChunks],
    ['classes', classChunks],
    ['feats', featChunks],
    ['optional-features', optionalFeatureChunks],
    ['spells', spellChunks],
    ['items', itemChunks],
    ['grants', grantChunks],
    ['compendium', compendiumChunks],
  ];

  for (const [entityType, chunkMap] of chunkGroups) {
    for (const [chunkId, records] of Object.entries(chunkMap)) {
      const filePath = path.join(OUTPUT_ROOT, entityType, `${chunkId}.json`);
      const payload = createChunk(entityType, chunkId, records, generatedAt);
      await writeJson(filePath, payload);

      manifestChunks.push({
        entityType,
        chunkId,
        filePath,
        recordCount: Array.isArray(records) ? records.length : records.class ? 1 + records.subclasses.length : 0,
      });
    }
  }

  const manifest = {
    schemaVersion: IMPORTER_SCHEMA_VERSION,
    contentVersion: CONTENT_VERSION,
    generatedAt,
    sourceRepository: SOURCE_REPOSITORY,
    sourceRef: SOURCE_REF,
    chunkCount: manifestChunks.length,
    entityCounts: {
      species: entityGroups.species.length,
      classes: entityGroups.classes.length,
      subclasses: entityGroups.subclasses.length,
      feats: entityGroups.feats.length,
      optionalFeatures: entityGroups.optionalFeatures.length,
      spells: entityGroups.spells.length,
      items: entityGroups.items.length,
      choiceGrants: entityGroups.choiceGrants.length,
      compendiumEntries: entityGroups.compendiumEntries.length,
    },
    chunks: stableSortBy(manifestChunks, (record) => `${record.entityType}/${record.chunkId}`),
  };

  await writeJson(path.join(OUTPUT_ROOT, 'content-index.json'), manifest);

  return manifest;
}
