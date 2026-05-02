import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { SOURCE_BASE_URL, SOURCE_FILES, SOURCE_REF, SOURCE_REPOSITORY } from './5etools-importer/config.mjs';
import { fetchJson, fetchJsonMap } from './5etools-importer/fetch.mjs';
import {
  normalizeActions,
  normalizeBackgrounds,
  normalizeChoiceGrants,
  normalizeClasses,
  normalizeCompendiumEntries,
  normalizeConditions,
  normalizeFeats,
  normalizeItems,
  normalizeOptionalFeatures,
  normalizeSpecies,
  normalizeSpells,
  normalizeVariantRules,
} from './5etools-importer/normalize.mjs';
import { resolveCollection } from './5etools-importer/resolve.mjs';

const GENERATED_ROOT = path.join(process.cwd(), 'generated', '5etools');
const CONTENT_INDEX_PATH = path.join(GENERATED_ROOT, 'content-index.json');

const IMPORTED_TOP_LEVEL_DATA_FILES = new Set(
  Object.values(SOURCE_FILES).filter((sourcePath) => sourcePath.startsWith('data/') && sourcePath.split('/').length === 2),
);

const CONTENT_ENTITY_COUNT_KEYS = [
  'species',
  'classes',
  'subclasses',
  'backgrounds',
  'feats',
  'optionalFeatures',
  'spells',
  'items',
  'conditions',
  'actions',
  'variantRules',
  'choiceGrants',
  'compendiumEntries',
];

const COMPENDIUM_ENTITY_TYPES = {
  species: 'species',
  classes: 'class',
  subclasses: 'subclass',
  backgrounds: 'background',
  feats: 'feat',
  optionalFeatures: 'optionalfeature',
  spells: 'spell',
  items: 'item',
  conditions: 'condition',
  actions: 'action',
  variantRules: 'variantrule',
};

function selectCopyKey(record) {
  return [record.name, record.source, record.className, record.classSource].filter(Boolean).join('::');
}

function selectFeatureCopyKey(record) {
  return [
    record.name,
    record.source,
    record.className,
    record.classSource,
    record.subclassShortName,
    record.subclassSource,
    record.level,
  ]
    .filter((part) => part != null && part !== '')
    .join('::');
}

function flattenSpellFiles(spellFileMap) {
  return Object.values(spellFileMap).flatMap((file) => file.spell ?? []);
}

function flattenItemFiles(itemsBase, items) {
  return [...(itemsBase.baseitem ?? itemsBase.item ?? []), ...(items.item ?? [])];
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

function printHeading(label) {
  console.log(`\n${label}`);
  console.log('-'.repeat(label.length));
}

function recordFailure(failures, message) {
  failures.push(message);
  console.error(`FAIL ${message}`);
}

function recordPass(message) {
  console.log(`PASS ${message}`);
}

async function loadRawSources() {
  const [
    races,
    classIndex,
    backgrounds,
    backgroundFluff,
    feats,
    optionalFeatures,
    spellsIndex,
    spellSourceLookup,
    itemsBase,
    items,
    conditionsDiseases,
    actions,
    variantRules,
  ] = await Promise.all([
    fetchJson(SOURCE_FILES.races),
    fetchJson(SOURCE_FILES.classIndex),
    fetchJson(SOURCE_FILES.backgrounds),
    fetchJson(SOURCE_FILES.backgroundFluff),
    fetchJson(SOURCE_FILES.feats),
    fetchJson(SOURCE_FILES.optionalFeatures),
    fetchJson(SOURCE_FILES.spellsIndex),
    fetchJson(SOURCE_FILES.spellSourceLookup),
    fetchJson(SOURCE_FILES.itemsBase),
    fetchJson(SOURCE_FILES.items),
    fetchJson(SOURCE_FILES.conditionsDiseases),
    fetchJson(SOURCE_FILES.actions),
    fetchJson(SOURCE_FILES.variantRules),
  ]);

  const classFiles = await fetchJsonMap(Object.values(classIndex).map((value) => `data/class/${value}`));
  const spellFiles = await fetchJsonMap(Object.values(spellsIndex).map((value) => `data/spells/${value}`));

  return {
    races,
    classFiles,
    backgrounds,
    backgroundFluff,
    feats,
    optionalFeatures,
    spellFiles,
    spellSourceLookup,
    itemsBase,
    items,
    conditionsDiseases,
    actions,
    variantRules,
  };
}

function normalizeSources(rawSources) {
  const resolvedSpecies = resolveCollection(rawSources.races.race ?? [], selectCopyKey);
  const rawClasses = Object.values(rawSources.classFiles).flatMap((file) => file.class ?? []);
  const rawSubclasses = Object.values(rawSources.classFiles).flatMap((file) => file.subclass ?? []);
  const rawClassFeatures = Object.values(rawSources.classFiles).flatMap((file) => file.classFeature ?? []);
  const rawSubclassFeatures = Object.values(rawSources.classFiles).flatMap((file) => file.subclassFeature ?? []);
  const resolvedClasses = resolveCollection(rawClasses, selectCopyKey);
  const resolvedSubclasses = resolveCollection(rawSubclasses, selectCopyKey);
  const resolvedClassFeatures = resolveCollection(rawClassFeatures, selectFeatureCopyKey);
  const resolvedSubclassFeatures = resolveCollection(rawSubclassFeatures, selectFeatureCopyKey);
  const resolvedBackgrounds = resolveCollection(rawSources.backgrounds.background ?? [], selectCopyKey);
  const resolvedBackgroundFluff = resolveCollection(rawSources.backgroundFluff.backgroundFluff ?? [], selectCopyKey);
  const resolvedFeats = resolveCollection(rawSources.feats.feat ?? [], selectCopyKey);
  const resolvedOptionalFeatures = resolveCollection(rawSources.optionalFeatures.optionalfeature ?? [], selectCopyKey);
  const resolvedSpells = flattenSpellFiles(rawSources.spellFiles);
  const resolvedItems = resolveCollection(flattenItemFiles(rawSources.itemsBase, rawSources.items), selectCopyKey);
  const resolvedConditions = resolveCollection(rawSources.conditionsDiseases.condition ?? [], selectCopyKey);
  const resolvedActions = resolveCollection(rawSources.actions.action ?? [], selectCopyKey);
  const resolvedVariantRules = resolveCollection(rawSources.variantRules.variantrule ?? [], selectCopyKey);

  const species = normalizeSpecies(resolvedSpecies);
  const { classes, subclasses } = normalizeClasses(resolvedClasses, resolvedSubclasses, {
    classFeatures: resolvedClassFeatures,
    subclassFeatures: resolvedSubclassFeatures,
  });
  const backgrounds = normalizeBackgrounds(resolvedBackgrounds, resolvedBackgroundFluff);
  const feats = normalizeFeats(resolvedFeats);
  const optionalFeatures = normalizeOptionalFeatures(resolvedOptionalFeatures);
  const spells = normalizeSpells(resolvedSpells, {
    classes,
    subclasses,
    spellSourceLookup: rawSources.spellSourceLookup,
  });
  const items = normalizeItems(resolvedItems);
  const conditions = normalizeConditions(resolvedConditions);
  const actions = normalizeActions(resolvedActions);
  const variantRules = normalizeVariantRules(resolvedVariantRules);
  const choiceGrants = normalizeChoiceGrants({ classes, subclasses, feats, optionalFeatures });
  const compendiumEntries = normalizeCompendiumEntries({
    species,
    class: classes,
    subclass: subclasses,
    background: backgrounds,
    feat: feats,
    optionalfeature: optionalFeatures,
    spell: spells,
    item: items,
    condition: conditions,
    action: actions,
    variantrule: variantRules,
  });

  return {
    rawCounts: {
      species: rawSources.races.race?.length ?? 0,
      classes: rawClasses.length,
      subclasses: rawSubclasses.length,
      backgrounds: rawSources.backgrounds.background?.length ?? 0,
      feats: rawSources.feats.feat?.length ?? 0,
      optionalFeatures: rawSources.optionalFeatures.optionalfeature?.length ?? 0,
      spells: resolvedSpells.length,
      items: flattenItemFiles(rawSources.itemsBase, rawSources.items).length,
      conditions: rawSources.conditionsDiseases.condition?.length ?? 0,
      actions: rawSources.actions.action?.length ?? 0,
      variantRules: rawSources.variantRules.variantrule?.length ?? 0,
    },
    normalized: {
      species,
      classes,
      subclasses,
      backgrounds,
      feats,
      optionalFeatures,
      spells,
      items,
      conditions,
      actions,
      variantRules,
      choiceGrants,
      compendiumEntries,
    },
  };
}

function getActualChunkRecordCount(chunk) {
  if (Array.isArray(chunk.records)) {
    return chunk.records.length;
  }

  if (chunk.records?.class) {
    return 1 + (chunk.records.subclasses?.length ?? 0);
  }

  return 0;
}

async function readManifestChunks(manifest) {
  const chunks = [];

  for (const manifestChunk of manifest.chunks) {
    const chunk = await readJson(path.join(process.cwd(), manifestChunk.filePath));
    chunks.push({ manifestChunk, chunk });
  }

  return chunks;
}

function countGeneratedEntities(chunks) {
  const counts = {
    species: 0,
    classes: 0,
    subclasses: 0,
    backgrounds: 0,
    feats: 0,
    optionalFeatures: 0,
    spells: 0,
    items: 0,
    conditions: 0,
    actions: 0,
    variantRules: 0,
    choiceGrants: 0,
    compendiumEntries: 0,
  };

  for (const { manifestChunk, chunk } of chunks) {
    if (manifestChunk.entityType === 'classes') {
      if (chunk.records?.class) {
        counts.classes += 1;
      }
      counts.subclasses += chunk.records?.subclasses?.length ?? 0;
      continue;
    }

    if (manifestChunk.entityType === 'species') {
      counts.species += chunk.records.length;
    } else if (manifestChunk.entityType === 'backgrounds') {
      counts.backgrounds += chunk.records.length;
    } else if (manifestChunk.entityType === 'feats') {
      counts.feats += chunk.records.length;
    } else if (manifestChunk.entityType === 'optional-features') {
      counts.optionalFeatures += chunk.records.length;
    } else if (manifestChunk.entityType === 'spells') {
      counts.spells += chunk.records.length;
    } else if (manifestChunk.entityType === 'items') {
      counts.items += chunk.records.length;
    } else if (manifestChunk.entityType === 'conditions') {
      counts.conditions += chunk.records.length;
    } else if (manifestChunk.entityType === 'actions') {
      counts.actions += chunk.records.length;
    } else if (manifestChunk.entityType === 'variant-rules') {
      counts.variantRules += chunk.records.length;
    } else if (manifestChunk.entityType === 'grants') {
      counts.choiceGrants += chunk.records.length;
    } else if (manifestChunk.entityType === 'compendium') {
      counts.compendiumEntries += chunk.records.length;
    }
  }

  return counts;
}

function compareCounts({ failures, normalized, manifest, generatedCounts }) {
  printHeading('Supported Category Counts');
  const rows = CONTENT_ENTITY_COUNT_KEYS.map((key) => ({
    category: key,
    normalized: normalized[key].length,
    manifest: manifest.entityCounts[key],
    generated: generatedCounts[key],
  }));
  console.table(rows);

  for (const row of rows) {
    if (row.normalized !== row.manifest) {
      recordFailure(failures, `${row.category} normalized count ${row.normalized} does not match manifest count ${row.manifest}`);
    }
    if (row.normalized !== row.generated) {
      recordFailure(failures, `${row.category} normalized count ${row.normalized} does not match generated chunk count ${row.generated}`);
    }
  }
}

function compareChunkRecordCounts({ failures, chunks }) {
  printHeading('Manifest Chunk Counts');
  let checked = 0;

  for (const { manifestChunk, chunk } of chunks) {
    const actual = getActualChunkRecordCount(chunk);
    checked += 1;
    if (actual !== manifestChunk.recordCount) {
      recordFailure(
        failures,
        `${manifestChunk.filePath} manifest recordCount ${manifestChunk.recordCount} does not match actual ${actual}`,
      );
    }
  }

  if (checked > 0) {
    recordPass(`checked ${checked} generated chunks`);
  }
}

function compareCompendiumCounts({ failures, normalized, chunks }) {
  printHeading('Compendium Entry Counts');
  const compendiumRecords = chunks
    .filter(({ manifestChunk }) => manifestChunk.entityType === 'compendium')
    .flatMap(({ chunk }) => chunk.records);
  const rows = Object.entries(COMPENDIUM_ENTITY_TYPES).map(([key, entityType]) => {
    const normalizedCount = normalized[key].length;
    const compendiumCount = compendiumRecords.filter((record) => record.entityType === entityType).length;
    return { category: key, entityType, normalized: normalizedCount, compendium: compendiumCount };
  });
  console.table(rows);

  for (const row of rows) {
    if (row.normalized !== row.compendium) {
      recordFailure(failures, `${row.category} normalized count ${row.normalized} does not match compendium count ${row.compendium}`);
    }
  }
}

function compareClassReachability({ failures, normalized, chunks }) {
  printHeading('Class And Subclass Reachability');
  const classChunks = chunks.filter(({ manifestChunk }) => manifestChunk.entityType === 'classes');
  const chunkClasses = classChunks.map(({ chunk }) => chunk.records.class).filter(Boolean);
  const chunkSubclasses = classChunks.flatMap(({ chunk }) => chunk.records.subclasses ?? []);
  const chunkClassIds = new Set(chunkClasses.map((record) => record.id));
  const normalizedClassIds = new Set(normalized.classes.map((record) => record.id));
  const normalizedSubclassIds = new Set(normalized.subclasses.map((record) => record.id));
  const chunkSubclassIds = new Set(chunkSubclasses.map((record) => record.id));
  const missingClassIds = normalized.classes.filter((record) => !chunkClassIds.has(record.id));
  const extraClassIds = chunkClasses.filter((record) => !normalizedClassIds.has(record.id));
  const missingSubclassIds = normalized.subclasses.filter((record) => !chunkSubclassIds.has(record.id));
  const extraSubclassIds = chunkSubclasses.filter((record) => !normalizedSubclassIds.has(record.id));

  console.table([
    { entity: 'classes', normalized: normalized.classes.length, reachable: chunkClasses.length, missing: missingClassIds.length, extra: extraClassIds.length },
    {
      entity: 'subclasses',
      normalized: normalized.subclasses.length,
      reachable: chunkSubclasses.length,
      missing: missingSubclassIds.length,
      extra: extraSubclassIds.length,
    },
  ]);

  if (missingClassIds.length > 0 || extraClassIds.length > 0) {
    recordFailure(failures, `class reachability mismatch: missing=${missingClassIds.length} extra=${extraClassIds.length}`);
  }
  if (missingSubclassIds.length > 0 || extraSubclassIds.length > 0) {
    recordFailure(failures, `subclass reachability mismatch: missing=${missingSubclassIds.length} extra=${extraSubclassIds.length}`);
  }

  const subclassParentFailures = chunkSubclasses.filter((record) => !chunkClassIds.has(record.classId));
  if (subclassParentFailures.length > 0) {
    recordFailure(failures, `${subclassParentFailures.length} reachable subclasses reference missing class ids`);
  }

  const wrongChunkSubclasses = [];
  for (const { chunk } of classChunks) {
    const classId = chunk.records.class?.id;
    for (const subclass of chunk.records.subclasses ?? []) {
      if (subclass.classId !== classId) {
        wrongChunkSubclasses.push(subclass);
      }
    }
  }
  if (wrongChunkSubclasses.length > 0) {
    recordFailure(failures, `${wrongChunkSubclasses.length} subclasses are in a chunk that does not match their classId`);
  }

  const expectedByClassId = new Map();
  const actualByClassId = new Map();
  for (const subclass of normalized.subclasses) {
    expectedByClassId.set(subclass.classId, (expectedByClassId.get(subclass.classId) ?? 0) + 1);
  }
  for (const subclass of chunkSubclasses) {
    actualByClassId.set(subclass.classId, (actualByClassId.get(subclass.classId) ?? 0) + 1);
  }

  const mismatchedClasses = normalized.classes
    .map((classRecord) => ({
      classId: classRecord.id,
      name: classRecord.name,
      sourceCode: classRecord.sourceCode,
      expected: expectedByClassId.get(classRecord.id) ?? 0,
      actual: actualByClassId.get(classRecord.id) ?? 0,
    }))
    .filter((row) => row.expected !== row.actual);

  if (mismatchedClasses.length > 0) {
    recordFailure(failures, `${mismatchedClasses.length} classes have mismatched subclass counts`);
    console.table(mismatchedClasses.slice(0, 20));
  } else {
    recordPass('all class chunks include expected subclass counts');
  }

  if (missingClassIds.length > 0) {
    console.log('Missing class ids:', missingClassIds.slice(0, 20).map((record) => `${record.name} [${record.sourceCode}] ${record.id}`).join('; '));
  }
  if (missingSubclassIds.length > 0) {
    console.log('Missing subclass ids:', missingSubclassIds.slice(0, 20).map((record) => `${record.name} [${record.sourceCode}] ${record.id}`).join('; '));
  }
}

async function reportOutOfScopeDataFiles() {
  printHeading('Out Of Scope 5eTools Data Files');

  try {
    const response = await fetch(`https://api.github.com/repos/${SOURCE_REPOSITORY}/git/trees/${SOURCE_REF}?recursive=1`);
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    const payload = await response.json();
    const topLevelDataFiles = payload.tree
      .filter((entry) => entry.type === 'blob' && /^data\/[^/]+\.json$/.test(entry.path))
      .map((entry) => entry.path)
      .sort((left, right) => left.localeCompare(right));
    const outOfScopeFiles = topLevelDataFiles.filter((filePath) => !IMPORTED_TOP_LEVEL_DATA_FILES.has(filePath));

    console.log(`INFO ${outOfScopeFiles.length} top-level 5eTools data files are outside the current audit scope.`);
    for (const filePath of outOfScopeFiles.slice(0, 80)) {
      console.log(`INFO out of scope: ${filePath}`);
    }
    if (outOfScopeFiles.length > 80) {
      console.log(`INFO ${outOfScopeFiles.length - 80} additional out-of-scope files omitted from output.`);
    }
  } catch (error) {
    console.warn(`WARN unable to list out-of-scope 5eTools data files: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function assertGeneratedDirectoryExists() {
  await readFile(CONTENT_INDEX_PATH, 'utf8');
  await readdir(GENERATED_ROOT);
}

async function main() {
  const failures = [];
  await assertGeneratedDirectoryExists();

  console.log(`Auditing generated 5eTools content from ${SOURCE_REPOSITORY}@${SOURCE_REF}`);
  console.log(`Source base URL: ${SOURCE_BASE_URL}`);

  const rawSources = await loadRawSources();
  const { normalized } = normalizeSources(rawSources);
  const manifest = await readJson(CONTENT_INDEX_PATH);
  const chunks = await readManifestChunks(manifest);
  const generatedCounts = countGeneratedEntities(chunks);

  compareCounts({ failures, normalized, manifest, generatedCounts });
  compareChunkRecordCounts({ failures, chunks });
  compareCompendiumCounts({ failures, normalized, chunks });
  compareClassReachability({ failures, normalized, chunks });
  await reportOutOfScopeDataFiles();

  printHeading('Audit Result');
  if (failures.length > 0) {
    console.error(`5eTools import audit failed with ${failures.length} issue(s).`);
    process.exitCode = 1;
    return;
  }

  console.log('5eTools import audit passed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
