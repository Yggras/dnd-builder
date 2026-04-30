import { COMPATIBLE_2024_SOURCES, PRIMARY_2024_SOURCES } from './config.mjs';
import {
  canonicalId,
  ensureArray,
  extractText,
  featIdFromUid,
  getSourceName,
  is2024CompatibleRecord,
  isPrimary2024Record,
  optionalFeatureIdFromUid,
  progressionToLevelCounts,
  spellIdFromUid,
  stableSortBy,
  summarizeText,
  unique,
} from './utils.mjs';

function extractBackgroundFeatIds(feats) {
  return unique(
    ensureArray(feats).flatMap((featRecord) => {
      if (!featRecord || typeof featRecord !== 'object') {
        return [];
      }

      return Object.entries(featRecord)
        .filter(([, enabled]) => Boolean(enabled))
        .map(([uid]) => featIdFromUid(uid))
        .filter(Boolean);
    }),
  );
}

function extractBackgroundEquipmentSummary(entries) {
  for (const entry of ensureArray(entries)) {
    if (entry?.type !== 'list' || !Array.isArray(entry.items)) {
      continue;
    }

    for (const item of entry.items) {
      if (typeof item?.name === 'string' && item.name.toLowerCase() === 'equipment:' && typeof item.entry === 'string') {
        return item.entry;
      }
    }
  }

  return null;
}

function createBaseRecord(kind, record, id) {
  const text = extractText(record.entries ?? record.entry ?? []);
  const searchText = [record.name, record.source, text].filter(Boolean).join(' ');
  const isPrimary2024 = isPrimary2024Record(record, PRIMARY_2024_SOURCES);
  const is2024Compatible = is2024CompatibleRecord(record, PRIMARY_2024_SOURCES, COMPATIBLE_2024_SOURCES);

  return {
    id,
    kind,
    name: record.name,
    sourceCode: record.source,
    sourceName: getSourceName(record.source),
    rulesEdition: is2024Compatible ? '2024' : 'legacy',
    isPrimary2024,
    isLegacy: !is2024Compatible,
    isSelectableInBuilder: is2024Compatible,
    summary: summarizeText(text),
    searchText,
    renderPayload: {
      entries: record.entries ?? [],
    },
  };
}

function normalizeSpellRefsFromAdditionalSpells(additionalSpells) {
  const spellIds = [];
  const spellBearingKeys = new Set([
    'prepared',
    'known',
    'expanded',
    'innate',
    'ritual',
    'daily',
    'rest',
    'resource',
    '_',
    '1',
    '1e',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    's1',
    's2',
    's3',
    's4',
    's5',
  ]);

  function visit(value, parentKey = null) {
    if (value == null) {
      return;
    }

    if (typeof value === 'string') {
      if (!parentKey || !spellBearingKeys.has(parentKey) || value.includes('=')) {
        return;
      }

      const spellId = spellIdFromUid(value);
      if (spellId) {
        spellIds.push(spellId);
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    if (typeof value === 'object') {
      for (const [key, nestedValue] of Object.entries(value)) {
        visit(nestedValue, key);
      }
    }
  }

  visit(additionalSpells);

  return unique(spellIds);
}

function deriveSpellRoleTags(record) {
  const text = extractText(record.entries ?? []).toLowerCase();
  const tags = new Set();

  if (/damage|attack|saving throw|cone|line|sphere|radius/.test(text)) {
    tags.add('Combat');
  }

  if (/regain hit points|healing|temporary hit points|restore hit points|revive|resurrection/.test(text)) {
    tags.add('Healing');
  }

  if (/you gain|target gains|ally gains|bonus to|advantage on|resistance to/.test(text)) {
    tags.add('Buff');
  }

  if (/disadvantage|frightened|charmed|blinded|poisoned|paralyzed|restrained|stunned|incapacitated/.test(text)) {
    tags.add('Debuff');
  }

  if (/difficult terrain|can't move|wall of|banish|teleport|forced movement|area/.test(text)) {
    tags.add('Control');
  }

  if (/summon|conjure|familiar|appears in an unoccupied space|you call forth/.test(text)) {
    tags.add('Summoning');
  }

  if (/ac increases|bonus to ac|ward|shield|protective|immune to/.test(text)) {
    tags.add('Defense');
  }

  if (tags.size === 0 || /ritual|detect|identify|comprehend|locate|travel|disguise|invisibility|message/.test(text)) {
    tags.add('Utility');
  }

  return [...tags].sort();
}

function normalizeLookupKey(value) {
  return String(value ?? '').trim().toLowerCase();
}

function splitUidParts(value) {
  return String(value ?? '')
    .split('|')
    .map((part) => part.trim());
}

function featureLookupKey(parts) {
  return [parts.name, parts.className, parts.classSource, parts.subclassShortName, parts.subclassSource, parts.level, parts.source]
    .map(normalizeLookupKey)
    .join('::');
}

function getClassFeatureLookupParts(record) {
  return {
    name: record.name,
    className: record.className,
    classSource: record.classSource,
    subclassShortName: null,
    subclassSource: null,
    level: record.level,
    source: record.source,
  };
}

function getSubclassFeatureLookupParts(record) {
  return {
    name: record.name,
    className: record.className,
    classSource: record.classSource,
    subclassShortName: record.subclassShortName,
    subclassSource: record.subclassSource,
    level: record.level,
    source: record.source,
  };
}

function parseClassFeatureRef(uid, ownerRecord) {
  const [name, className, classSourceRaw, level, sourceRaw] = splitUidParts(uid);
  const classSource = classSourceRaw || ownerRecord?.source || 'PHB';

  if (!name || !className || !classSource || !level) {
    return null;
  }

  return featureLookupKey({
    name,
    className,
    classSource,
    subclassShortName: null,
    subclassSource: null,
    level,
    source: sourceRaw || classSource,
  });
}

function parseSubclassFeatureRef(uid, ownerRecord) {
  const [name, className, classSourceRaw, subclassShortName, subclassSourceRaw, level, sourceRaw] = splitUidParts(uid);
  const classSource = classSourceRaw || 'PHB';
  const subclassSource = subclassSourceRaw || ownerRecord?.subclassSource || ownerRecord?.source;

  if (!name || !className || !classSource || !subclassShortName || !subclassSource || !level) {
    return null;
  }

  return featureLookupKey({
    name,
    className,
    classSource,
    subclassShortName,
    subclassSource,
    level,
    source: sourceRaw || subclassSource,
  });
}

function createFeatureLookups(classFeatureRecords, subclassFeatureRecords) {
  return {
    classFeatures: new Map(classFeatureRecords.map((record) => [featureLookupKey(getClassFeatureLookupParts(record)), record])),
    subclassFeatures: new Map(subclassFeatureRecords.map((record) => [featureLookupKey(getSubclassFeatureLookupParts(record)), record])),
  };
}

function isSourceRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getReferencedFeatureRecord(record, lookups, ownerRecord) {
  if (typeof record.classFeature === 'string') {
    const key = parseClassFeatureRef(record.classFeature, ownerRecord);
    return key ? lookups.classFeatures.get(key) ?? null : null;
  }

  if (typeof record.subclassFeature === 'string') {
    const key = parseSubclassFeatureRef(record.subclassFeature, ownerRecord);
    return key ? lookups.subclassFeatures.get(key) ?? null : null;
  }

  return null;
}

function expandFeatureEntryRefs(value, lookups, ownerRecord, depth = 0) {
  if (depth > 4) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => expandFeatureEntryRefs(entry, lookups, ownerRecord, depth));
  }

  if (!isSourceRecord(value)) {
    return value;
  }

  const referencedFeature = getReferencedFeatureRecord(value, lookups, ownerRecord);
  if (referencedFeature && referencedFeature !== ownerRecord) {
    return {
      type: 'entries',
      name: referencedFeature.name,
      entries: expandFeatureEntryRefs(referencedFeature.entries ?? [], lookups, referencedFeature, depth + 1),
    };
  }

  const nextRecord = { ...value };
  if (Array.isArray(nextRecord.entries)) {
    nextRecord.entries = expandFeatureEntryRefs(nextRecord.entries, lookups, ownerRecord, depth);
  }
  if (Array.isArray(nextRecord.items)) {
    nextRecord.items = expandFeatureEntryRefs(nextRecord.items, lookups, ownerRecord, depth);
  }

  return nextRecord;
}

function normalizeFeatureDetail(record, lookups, ref) {
  return {
    ref,
    name: record.name,
    level: record.level ?? null,
    sourceCode: record.source ?? null,
    page: record.page ?? null,
    entries: expandFeatureEntryRefs(record.entries ?? [], lookups, record),
  };
}

function parseFeatureValue(value) {
  if (typeof value === 'string') {
    return value;
  }

  if (!isSourceRecord(value)) {
    return null;
  }

  return typeof value.classFeature === 'string'
    ? value.classFeature
    : typeof value.subclassFeature === 'string'
      ? value.subclassFeature
      : null;
}

function attachClassFeatureDetails(featureRefs, ownerRecord, lookups) {
  return ensureArray(featureRefs).map((featureRef) => {
    const rawRef = parseFeatureValue(featureRef);
    const key = rawRef ? parseClassFeatureRef(rawRef, ownerRecord) : null;
    const record = key ? lookups.classFeatures.get(key) : null;
    return record ? normalizeFeatureDetail(record, lookups, rawRef) : null;
  });
}

function attachSubclassFeatureDetails(featureRefs, ownerRecord, lookups) {
  return ensureArray(featureRefs).map((featureRef) => {
    const rawRef = parseFeatureValue(featureRef);
    const key = rawRef ? parseSubclassFeatureRef(rawRef, ownerRecord) : null;
    const record = key ? lookups.subclassFeatures.get(key) : null;
    return record ? normalizeFeatureDetail(record, lookups, rawRef) : null;
  });
}

function assertUniqueFeatureDetailRefs(ownerLabel, details, detailFieldName) {
  const seen = new Map();

  for (const detail of ensureArray(details)) {
    if (!isSourceRecord(detail) || typeof detail.ref !== 'string' || !detail.ref) {
      continue;
    }

    const previousName = seen.get(detail.ref);
    if (previousName) {
      throw new Error(`Duplicate ${detailFieldName} ref for ${ownerLabel}: ${detail.ref} (${previousName}, ${detail.name ?? 'unnamed'})`);
    }

    seen.set(detail.ref, detail.name ?? 'unnamed');
  }
}

function reportUnmatchedFeatureDetails(records, featureFieldName, detailFieldName, ownerLabel) {
  let totalRefs = 0;
  let unmatchedRefs = 0;
  const examples = [];

  for (const record of records) {
    const featureRefs = ensureArray(record.metadata?.[featureFieldName]).map(parseFeatureValue).filter(Boolean);
    const detailRefs = new Set(
      ensureArray(record.metadata?.[detailFieldName])
        .filter((detail) => isSourceRecord(detail) && typeof detail.ref === 'string' && detail.ref)
        .map((detail) => detail.ref),
    );

    totalRefs += featureRefs.length;

    for (const featureRef of featureRefs) {
      if (detailRefs.has(featureRef)) {
        continue;
      }

      unmatchedRefs += 1;
      if (examples.length < 5) {
        examples.push(`${record.name}: ${featureRef}`);
      }
    }
  }

  if (unmatchedRefs > 0) {
    console.warn(
      `Unmatched ${ownerLabel} feature details: ${unmatchedRefs}/${totalRefs}` +
        (examples.length > 0 ? `; examples: ${examples.join('; ')}` : ''),
    );
  }
}

function validateFeatureDetailRefs(records, featureFieldName, detailFieldName, ownerLabel) {
  for (const record of records) {
    assertUniqueFeatureDetailRefs(`${ownerLabel} ${record.name} (${record.id})`, record.metadata?.[detailFieldName], detailFieldName);
  }

  reportUnmatchedFeatureDetails(records, featureFieldName, detailFieldName, ownerLabel);
}

function buildSpellApplicabilityMetadata(record, { classes, subclasses, spellSourceLookup }) {
  const classIdLookup = new Map(
    classes.map((classRecord) => [
      `${normalizeLookupKey(classRecord.sourceCode)}::${normalizeLookupKey(classRecord.name)}`,
      classRecord.id,
    ]),
  );
  const subclassIdLookup = new Map(
    subclasses.map((subclassRecord) => {
      const classRecord = classes.find((candidate) => candidate.id === subclassRecord.classId);
      return [
        `${normalizeLookupKey(classRecord?.sourceCode)}::${normalizeLookupKey(classRecord?.name)}::${normalizeLookupKey(subclassRecord.sourceCode)}::${normalizeLookupKey(subclassRecord.name)}`,
        subclassRecord.id,
      ];
    }),
  );

  const spellSourceBucket = spellSourceLookup?.[normalizeLookupKey(record.source)] ?? null;
  const lookupEntry = spellSourceBucket?.[normalizeLookupKey(record.name)] ?? null;
  const classIds = [];
  const subclassIds = [];

  for (const [classSource, classMap] of Object.entries(lookupEntry?.class ?? {})) {
    if (!classMap || typeof classMap !== 'object') {
      continue;
    }

    for (const className of Object.keys(classMap)) {
      const classId = classIdLookup.get(`${normalizeLookupKey(classSource)}::${normalizeLookupKey(className)}`);
      if (classId) {
        classIds.push(classId);
      }
    }
  }

  for (const [classSource, classMap] of Object.entries(lookupEntry?.subclass ?? {})) {
    if (!classMap || typeof classMap !== 'object') {
      continue;
    }

    for (const [className, subclassSourceMap] of Object.entries(classMap)) {
      if (!subclassSourceMap || typeof subclassSourceMap !== 'object') {
        continue;
      }

      for (const [subclassSource, subclassMap] of Object.entries(subclassSourceMap)) {
        if (!subclassMap || typeof subclassMap !== 'object') {
          continue;
        }

        for (const subclassName of Object.keys(subclassMap)) {
          const subclassId = subclassIdLookup.get(
            `${normalizeLookupKey(classSource)}::${normalizeLookupKey(className)}::${normalizeLookupKey(subclassSource)}::${normalizeLookupKey(subclassName)}`,
          );
          if (subclassId) {
            subclassIds.push(subclassId);
          }
        }
      }
    }
  }

  return {
    classIds: unique(classIds),
    subclassIds: unique(subclassIds),
  };
}

function normalizePrerequisites(prerequisites) {
  const normalized = {
    minClassLevel: null,
    requiredFeatureIds: [],
    requiredFeatIds: [],
    requiredSpellIds: [],
    textOnly: [],
  };

  for (const prerequisite of ensureArray(prerequisites)) {
    if (prerequisite?.level?.class?.name) {
      normalized.minClassLevel = {
        classId: canonicalId([prerequisite.level.class.name, prerequisite.level.class.source ?? 'XPHB']),
        level: prerequisite.level.level,
      };
    } else if (typeof prerequisite?.level === 'number') {
      normalized.textOnly.push(`Level ${prerequisite.level}`);
    }

    for (const optionalfeature of ensureArray(prerequisite?.optionalfeature)) {
      const optionalFeatureId = optionalFeatureIdFromUid(optionalfeature);
      if (optionalFeatureId) {
        normalized.requiredFeatureIds.push(optionalFeatureId);
      }
    }

    for (const feat of ensureArray(prerequisite?.feat)) {
      const featId = featIdFromUid(feat);
      if (featId) {
        normalized.requiredFeatIds.push(featId);
      }
    }

    for (const spell of ensureArray(prerequisite?.spell)) {
      if (typeof spell === 'string') {
        const spellId = spellIdFromUid(spell);
        if (spellId) {
          normalized.requiredSpellIds.push(spellId);
        }
      }
    }

    if (prerequisite?.otherSummary?.entrySummary) {
      normalized.textOnly.push(prerequisite.otherSummary.entrySummary);
    }

    if (prerequisite?.feature) {
      normalized.textOnly.push(...ensureArray(prerequisite.feature));
    }

    if (prerequisite?.pact) {
      normalized.textOnly.push(`Pact: ${prerequisite.pact}`);
    }
  }

  normalized.requiredFeatureIds = unique(normalized.requiredFeatureIds);
  normalized.requiredFeatIds = unique(normalized.requiredFeatIds);
  normalized.requiredSpellIds = unique(normalized.requiredSpellIds);
  normalized.textOnly = unique(normalized.textOnly);

  return normalized;
}

function normalizeOptionRecord(kind, record, id, categoryTags) {
  return {
    ...createBaseRecord(kind, record, id),
    categoryTags,
    repeatable: Boolean(record.repeatable),
    prerequisitesText: summarizeText(extractText(record.prerequisite ?? record.requirements ?? []), 160),
    prerequisitesNormalized: normalizePrerequisites(record.prerequisite),
    grants: {
      spellIds: normalizeSpellRefsFromAdditionalSpells(record.additionalSpells),
      senses: record.senses ?? [],
      proficiencies: {
        skills: record.skillProficiencies ?? [],
        tools: record.toolProficiencies ?? [],
        weapons: record.weaponProficiencies ?? [],
        languages: record.languageProficiencies ?? [],
      },
    },
    metadata: {
      ability: record.ability ?? [],
      category: record.category ?? null,
      featureType: record.featureType ?? [],
      entriesText: extractText(record.entries ?? []),
    },
  };
}

export function normalizeSpecies(records) {
  const normalizedRecords = records.map((record) => {
      const id = canonicalId([record.name, record.source, 'species']);
      return {
        ...createBaseRecord('species', record, id),
        metadata: {
          size: record.size ?? [],
          speed: record.speed ?? null,
          creatureTypes: record.creatureTypes ?? ['humanoid'],
          lineage: record.lineage ?? null,
          darkvision: record.darkvision ?? null,
          languages: record.languageProficiencies ?? [],
          traits: record.traitTags ?? [],
          ability: record.ability ?? [],
          entriesText: extractText(record.entries ?? []),
        },
      };
    });

  const recordsByName = normalizedRecords.reduce((map, record) => {
    const key = record.name.toLowerCase();
    if (!map.has(key)) {
      map.set(key, []);
    }

    map.get(key).push(record);
    return map;
  }, new Map());

  for (const group of recordsByName.values()) {
    const xphbPrimary = group.find((record) => record.isPrimary2024 && record.sourceCode === 'XPHB');

    if (!xphbPrimary) {
      continue;
    }

    for (const record of group) {
      if (record.id !== xphbPrimary.id && record.isPrimary2024) {
        record.isSelectableInBuilder = false;
      }
    }
  }

  return stableSortBy(normalizedRecords, (record) => record.id);
}

export function normalizeClasses(classRecords, subclassRecords, featureRecords = {}) {
  const featureLookups = createFeatureLookups(featureRecords.classFeatures ?? [], featureRecords.subclassFeatures ?? []);
  const normalizedSubclasses = stableSortBy(
    subclassRecords.map((record) => {
      const id = canonicalId([record.name, record.source, 'subclass', record.className, record.classSource]);
      return {
        ...createBaseRecord('subclass', record, id),
        classId: canonicalId([record.className, record.classSource]),
        metadata: {
          shortName: record.shortName ?? record.name,
          spellcastingAbility: record.spellcastingAbility ?? null,
          casterProgression: record.casterProgression ?? null,
          cantripProgression: record.cantripProgression ?? [],
          preparedSpellsProgression: record.preparedSpellsProgression ?? [],
          subclassFeatures: record.subclassFeatures ?? [],
          subclassFeatureDetails: attachSubclassFeatureDetails(record.subclassFeatures, record, featureLookups),
          additionalSpellIds: normalizeSpellRefsFromAdditionalSpells(record.additionalSpells),
        },
      };
    }),
    (record) => record.id,
  );

  const subclassesByClassId = normalizedSubclasses.reduce((map, subclass) => {
    if (!map.has(subclass.classId)) {
      map.set(subclass.classId, []);
    }

    map.get(subclass.classId).push(subclass);
    return map;
  }, new Map());

  const normalizedClasses = stableSortBy(
    classRecords.map((record) => {
      const id = canonicalId([record.name, record.source]);
      return {
        ...createBaseRecord('class', record, id),
        subclassIds: (subclassesByClassId.get(id) ?? []).map((subclass) => subclass.id),
        metadata: {
          primaryAbility: record.primaryAbility ?? [],
          hitDie: record.hd ?? null,
          proficiency: record.proficiency ?? [],
          spellcastingAbility: record.spellcastingAbility ?? null,
          casterProgression: record.casterProgression ?? null,
          cantripProgression: record.cantripProgression ?? [],
          preparedSpellsProgression: record.preparedSpellsProgression ?? [],
          spellsKnownProgression: record.spellsKnownProgression ?? [],
          spellsKnownProgressionFixedByLevel: record.spellsKnownProgressionFixedByLevel ?? {},
          startingProficiencies: record.startingProficiencies ?? {},
          startingEquipment: record.startingEquipment ?? {},
          featProgression: record.featProgression ?? [],
          optionalfeatureProgression: record.optionalfeatureProgression ?? [],
          classFeatures: record.classFeatures ?? [],
          classFeatureDetails: attachClassFeatureDetails(record.classFeatures, record, featureLookups),
          additionalSpellIds: normalizeSpellRefsFromAdditionalSpells(record.additionalSpells),
        },
      };
    }),
    (record) => record.id,
  );

  validateFeatureDetailRefs(normalizedClasses, 'classFeatures', 'classFeatureDetails', 'class');
  validateFeatureDetailRefs(normalizedSubclasses, 'subclassFeatures', 'subclassFeatureDetails', 'subclass');

  return {
    classes: normalizedClasses,
    subclasses: normalizedSubclasses,
  };
}

export function normalizeFeats(records) {
  return stableSortBy(
    records.map((record) => {
      const id = canonicalId([record.name, record.source, 'feat']);
      const categoryTags = unique([record.category, ...(record.category ? [] : []), ...(record.prerequisite?.flatMap?.(() => []) ?? [])]);
      return normalizeOptionRecord('feat', record, id, categoryTags.length ? categoryTags : []);
    }),
    (record) => record.id,
  );
}

export function normalizeBackgrounds(records) {
  return stableSortBy(
    records.map((record) => {
      const id = canonicalId([record.name, record.source, 'background']);
      const featIds = extractBackgroundFeatIds(record.feats);

      return {
        ...createBaseRecord('background', record, id),
        metadata: {
          ability: record.ability ?? [],
          featIds,
          feats: record.feats ?? [],
          skillProficiencies: record.skillProficiencies ?? [],
          toolProficiencies: record.toolProficiencies ?? [],
          languageProficiencies: record.languageProficiencies ?? [],
          startingEquipment: record.startingEquipment ?? [],
          equipmentSummary: extractBackgroundEquipmentSummary(record.entries),
          fromFeature: record.fromFeature ?? null,
          entriesText: extractText(record.entries ?? []),
        },
      };
    }),
    (record) => record.id,
  );
}

export function normalizeOptionalFeatures(records) {
  return stableSortBy(
    records.map((record) => {
      const id = canonicalId([record.name, record.source, 'optionalfeature']);
      return normalizeOptionRecord('optionalfeature', record, id, unique(record.featureType ?? []));
    }),
    (record) => record.id,
  );
}

export function normalizeSpells(records, context) {
  return stableSortBy(
    records.map((record) => {
      const id = canonicalId([record.name, record.source, 'spell']);
      const applicability = buildSpellApplicabilityMetadata(record, context);
      return {
        ...createBaseRecord('spell', record, id),
        metadata: {
          level: record.level ?? 0,
          school: record.school ?? null,
          classes: record.classes ?? {},
          classIds: applicability.classIds,
          subclassIds: applicability.subclassIds,
          duration: record.duration ?? [],
          range: record.range ?? null,
          components: record.components ?? {},
          ritual: Boolean(record.meta?.ritual),
          concentration: ensureArray(record.duration).some((duration) => Boolean(duration?.concentration)),
          roleTags: deriveSpellRoleTags(record),
          entriesText: extractText(record.entries ?? []),
        },
      };
    }),
    (record) => record.id,
  );
}

export function normalizeItems(records) {
  return stableSortBy(
    records.map((record) => {
      const id = canonicalId([record.name, record.source, 'item']);
      return {
        ...createBaseRecord('item', record, id),
        metadata: {
          type: record.type ?? null,
          typeAlt: record.typeAlt ?? null,
          category: record.category ?? null,
          rarity: record.rarity ?? null,
          value: record.value ?? null,
          weight: record.weight ?? null,
          weaponCategory: record.weaponCategory ?? null,
          damage: record.dmg1 ?? null,
          damageType: record.dmgType ?? null,
          armorClass: record.ac ?? null,
          property: record.property ?? [],
          entriesText: extractText(record.entries ?? []),
        },
      };
    }),
    (record) => record.id,
  );
}

function extractProgressionGrants(records, sourceType, fieldName, chooseKind, categoryField) {
  const grants = [];

  for (const record of records) {
    for (const progression of ensureArray(record.metadata?.[fieldName] ?? [])) {
      for (const levelCount of progressionToLevelCounts(progression.progression)) {
        grants.push({
          id: canonicalId([record.id, progression.name, chooseKind, levelCount.atLevel]),
          sourceType,
          sourceId: record.id,
          sourceName: record.name,
          atLevel: levelCount.atLevel,
          chooseKind,
          categoryFilter: unique(progression[categoryField] ?? []),
          count: levelCount.count,
          visibility: record.isSelectableInBuilder ? 'builder' : 'compendium-only',
        });
      }
    }
  }

  return grants;
}

export function normalizeChoiceGrants({ classes, subclasses, feats, optionalFeatures }) {
  return stableSortBy(
    [
      ...extractProgressionGrants(classes, 'class', 'featProgression', 'feat', 'category'),
      ...extractProgressionGrants(classes, 'class', 'optionalfeatureProgression', 'optionalfeature', 'featureType'),
      ...extractProgressionGrants(subclasses, 'subclass', 'featProgression', 'feat', 'category'),
      ...extractProgressionGrants(subclasses, 'subclass', 'optionalfeatureProgression', 'optionalfeature', 'featureType'),
      ...extractProgressionGrants(feats, 'feat', 'featProgression', 'feat', 'category'),
      ...extractProgressionGrants(optionalFeatures, 'optionalfeature', 'featProgression', 'feat', 'category'),
    ],
    (record) => record.id,
  );
}

export function normalizeCompendiumEntries(entityGroups) {
  const entries = [];

  for (const [entityType, records] of Object.entries(entityGroups)) {
    for (const record of records) {
      entries.push({
        id: canonicalId([record.id, 'compendium']),
        entityId: record.id,
        entityType,
        name: record.name,
        sourceCode: record.sourceCode,
        sourceName: record.sourceName,
        rulesEdition: record.rulesEdition,
        isLegacy: record.isLegacy,
        isPrimary2024: record.isPrimary2024,
        isSelectableInBuilder: record.isSelectableInBuilder,
        summary: record.summary,
        text: extractText(record.renderPayload?.entries ?? []),
        searchText: record.searchText,
        metadata: record.metadata ?? {},
        renderPayload: record.renderPayload,
      });
    }
  }

  return stableSortBy(entries, (record) => record.id);
}
