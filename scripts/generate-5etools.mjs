import { SOURCE_FILES } from './5etools-importer/config.mjs';
import { fetchJson, fetchJsonMap } from './5etools-importer/fetch.mjs';
import {
  normalizeBackgrounds,
  normalizeChoiceGrants,
  normalizeClasses,
  normalizeCompendiumEntries,
  normalizeFeats,
  normalizeItems,
  normalizeOptionalFeatures,
  normalizeSpecies,
  normalizeSpells,
} from './5etools-importer/normalize.mjs';
import { resolveCollection } from './5etools-importer/resolve.mjs';
import { writeGeneratedContent } from './5etools-importer/write.mjs';

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

function validateUnique(records, label) {
  const seen = new Set();

  for (const record of records) {
    if (seen.has(record.id)) {
      throw new Error(`Duplicate ${label} id detected: ${record.id}`);
    }

    seen.add(record.id);
  }
}

function validateGrants(choiceGrants) {
  for (const grant of choiceGrants) {
    if (!grant.categoryFilter.length) {
      throw new Error(`Choice grant missing category filter: ${grant.id}`);
    }
  }
}

async function loadRawSources() {
  const [races, classIndex, backgrounds, feats, optionalFeatures, spellsIndex, spellSourceLookup, itemsBase, items] = await Promise.all([
    fetchJson(SOURCE_FILES.races),
    fetchJson(SOURCE_FILES.classIndex),
    fetchJson(SOURCE_FILES.backgrounds),
    fetchJson(SOURCE_FILES.feats),
    fetchJson(SOURCE_FILES.optionalFeatures),
    fetchJson(SOURCE_FILES.spellsIndex),
    fetchJson(SOURCE_FILES.spellSourceLookup),
    fetchJson(SOURCE_FILES.itemsBase),
    fetchJson(SOURCE_FILES.items),
  ]);

  const classFiles = await fetchJsonMap(Object.values(classIndex).map((value) => `data/class/${value}`));
  const spellFiles = await fetchJsonMap(Object.values(spellsIndex).map((value) => `data/spells/${value}`));

  return {
    races,
    classFiles,
    backgrounds,
    feats,
    optionalFeatures,
    spellFiles,
    spellSourceLookup,
    itemsBase,
    items,
  };
}

async function main() {
  const rawSources = await loadRawSources();

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
  const resolvedFeats = resolveCollection(rawSources.feats.feat ?? [], selectCopyKey);
  const resolvedOptionalFeatures = resolveCollection(rawSources.optionalFeatures.optionalfeature ?? [], selectCopyKey);
  const resolvedSpells = flattenSpellFiles(rawSources.spellFiles);
  const resolvedItems = resolveCollection(flattenItemFiles(rawSources.itemsBase, rawSources.items), selectCopyKey);

  const species = normalizeSpecies(resolvedSpecies);
  const { classes, subclasses } = normalizeClasses(resolvedClasses, resolvedSubclasses, {
    classFeatures: resolvedClassFeatures,
    subclassFeatures: resolvedSubclassFeatures,
  });
  const backgrounds = normalizeBackgrounds(resolvedBackgrounds);
  const feats = normalizeFeats(resolvedFeats);
  const optionalFeatures = normalizeOptionalFeatures(resolvedOptionalFeatures);
  const spells = normalizeSpells(resolvedSpells, {
    classes,
    subclasses,
    spellSourceLookup: rawSources.spellSourceLookup,
  });
  const items = normalizeItems(resolvedItems);
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
  });

  validateUnique(species, 'species');
  validateUnique(classes, 'class');
  validateUnique(subclasses, 'subclass');
  validateUnique(backgrounds, 'background');
  validateUnique(feats, 'feat');
  validateUnique(optionalFeatures, 'optionalfeature');
  validateUnique(spells, 'spell');
  validateUnique(items, 'item');
  validateUnique(choiceGrants, 'choice grant');
  validateUnique(compendiumEntries, 'compendium entry');
  validateGrants(choiceGrants);

  const manifest = await writeGeneratedContent({
    species,
    classes,
    subclasses,
    backgrounds,
    feats,
    optionalFeatures,
    spells,
    items,
    choiceGrants,
    compendiumEntries,
  });

  console.log(`Generated ${manifest.chunkCount} content chunks in generated/5etools.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
