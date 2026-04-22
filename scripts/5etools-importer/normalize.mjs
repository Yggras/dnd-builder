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

export function normalizeClasses(classRecords, subclassRecords) {
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
          additionalSpellIds: normalizeSpellRefsFromAdditionalSpells(record.additionalSpells),
        },
      };
    }),
    (record) => record.id,
  );

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

export function normalizeSpells(records) {
  return stableSortBy(
    records.map((record) => {
      const id = canonicalId([record.name, record.source, 'spell']);
      return {
        ...createBaseRecord('spell', record, id),
        metadata: {
          level: record.level ?? 0,
          school: record.school ?? null,
          classes: record.classes ?? {},
          duration: record.duration ?? [],
          range: record.range ?? null,
          components: record.components ?? {},
          ritual: Boolean(record.meta?.ritual),
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
