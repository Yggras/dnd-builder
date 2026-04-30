import type { CompendiumEntry, ContentEntity, RulesEdition } from '@/shared/types/domain';

import {
  getArmorTypeLabel,
  getDamageTypeLabel,
  getEditionLabel,
  getItemTypeLabel,
  getRarityLabel,
  getSpellSchoolLabel,
  isMagicItem,
} from '@/features/compendium/utils/catalog';
import { cleanInlineText } from '@/features/compendium/utils/inlineText';

export type DetailFact = {
  label: string;
  value: string;
};

const ABILITY_LABELS: Record<string, string> = {
  cha: 'Charisma',
  con: 'Constitution',
  dex: 'Dexterity',
  int: 'Intelligence',
  str: 'Strength',
  wis: 'Wisdom',
};

const ITEM_PROPERTY_LABELS: Record<string, string> = {
  A: 'Ammunition',
  F: 'Finesse',
  H: 'Heavy',
  L: 'Light',
  LD: 'Loading',
  R: 'Reach',
  S: 'Special',
  T: 'Thrown',
  '2H': 'Two-Handed',
  V: 'Versatile',
};

function compactFacts(facts: Array<DetailFact | null>) {
  return facts.filter((fact): fact is DetailFact => Boolean(fact?.value));
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function numberValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function arrayOfStrings(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0) : [];
}

function titleCase(value: string) {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatCountLabel(count: number) {
  return count === 1 ? '1 choice' : `${count} choices`;
}

function formatAbilityKey(value: string) {
  return ABILITY_LABELS[value.toLowerCase()] ?? titleCase(value);
}

function formatAbilityMetadata(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  const bonuses: string[] = [];
  const choices = new Set<string>();
  let choiceCount: number | null = null;

  for (const entry of value) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      continue;
    }

    const record = entry as Record<string, unknown>;
    const choose = record.choose;
    if (choose && typeof choose === 'object' && !Array.isArray(choose)) {
      const chooseRecord = choose as Record<string, unknown>;
      const weighted = chooseRecord.weighted;
      const from: unknown[] = Array.isArray(chooseRecord.from)
        ? chooseRecord.from
        : weighted && typeof weighted === 'object' && !Array.isArray(weighted) && Array.isArray((weighted as Record<string, unknown>).from)
          ? (weighted as Record<string, unknown>).from as unknown[]
          : [];

      for (const ability of from) {
        if (typeof ability === 'string') {
          choices.add(formatAbilityKey(ability));
        }
      }

      const count = numberValue(chooseRecord.count);
      if (count != null) {
        choiceCount = Math.max(choiceCount ?? 0, count);
      }
      continue;
    }

    for (const [ability, amount] of Object.entries(record)) {
      if (typeof amount === 'number' && amount !== 0) {
        bonuses.push(`${formatAbilityKey(ability)} ${amount > 0 ? '+' : ''}${amount}`);
      } else if (amount === true) {
        choices.add(formatAbilityKey(ability));
      }
    }
  }

  const parts = [...bonuses];
  if (choices.size > 0) {
    const prefix = choiceCount == null ? 'Choose from' : `Choose ${formatCountLabel(choiceCount)} from`;
    parts.push(`${prefix} ${[...choices].join(', ')}`);
  }

  return parts.length > 0 ? parts.join('; ') : null;
}

function formatObjectChoiceList(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  const entries: string[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      continue;
    }

    for (const [key, enabled] of Object.entries(entry as Record<string, unknown>)) {
      if (enabled === true) {
        entries.push(formatMetadataKey(key));
      } else if (typeof enabled === 'number' && enabled > 0) {
        entries.push(`${formatMetadataKey(key)} (${formatCountLabel(enabled)})`);
      }
    }
  }

  return entries.length > 0 ? uniqueStrings(entries).join(', ') : null;
}

function formatMetadataKey(value: string) {
  switch (value) {
    case 'any':
      return 'Any';
    case 'anyStandard':
      return 'Any standard';
    default:
      return titleCase(value);
  }
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function formatSize(value: unknown) {
  const labels: Record<string, string> = {
    F: 'Fine',
    D: 'Diminutive',
    T: 'Tiny',
    S: 'Small',
    M: 'Medium',
    L: 'Large',
    H: 'Huge',
    G: 'Gargantuan',
    V: 'Varies',
  };
  const sizes = arrayOfStrings(value).map((size) => labels[size] ?? size);
  return sizes.length > 0 ? sizes.join(' or ') : null;
}

function formatSpeed(value: unknown) {
  if (typeof value === 'number') {
    return `${value} ft.`;
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const parts = Object.entries(value as Record<string, unknown>).flatMap(([mode, speed]) => {
    if (typeof speed === 'number') {
      return [`${titleCase(mode)} ${speed} ft.`];
    }

    if (speed === true && mode !== 'walk') {
      return [`${titleCase(mode)} equal to walking speed`];
    }

    return [];
  });

  return parts.length > 0 ? parts.join(', ') : null;
}

function formatDarkvision(value: unknown) {
  if (typeof value === 'number') {
    return `${value} ft.`;
  }

  return value === true ? 'Yes' : null;
}

function formatFeatType(entry: CompendiumEntry) {
  const category = stringValue(entry.metadata.category);
  const featureTypes = arrayOfStrings(entry.metadata.featureType);

  if (category === 'FS' || featureTypes.some((featureType) => featureType.startsWith('FS'))) {
    return 'Fighting Style';
  }

  switch (category) {
    case 'O':
      return 'Origin';
    case 'G':
      return 'General';
    case 'EB':
      return 'Epic Boon';
    case 'D':
      return 'Dragonmark';
    default:
      return category ? titleCase(category) : 'Other';
  }
}

function formatDistance(distance: Record<string, unknown> | null) {
  if (!distance) {
    return null;
  }

  const type = stringValue(distance.type);
  const amount = numberValue(distance.amount);

  if (!type) {
    return null;
  }

  if (type === 'self' || type === 'touch' || type === 'sight' || type === 'unlimited' || type === 'special') {
    return titleCase(type);
  }

  return amount == null ? titleCase(type) : `${amount} ${type}`;
}

function formatRange(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const range = value as Record<string, unknown>;
  const type = stringValue(range.type);
  const distance = typeof range.distance === 'object' && range.distance != null && !Array.isArray(range.distance)
    ? formatDistance(range.distance as Record<string, unknown>)
    : null;

  if (type === 'point') {
    return distance;
  }

  if (type === 'line' || type === 'cone' || type === 'radius' || type === 'sphere' || type === 'cube') {
    return [distance, titleCase(type)].filter(Boolean).join(' ');
  }

  return distance ?? (type ? titleCase(type) : null);
}

function formatDurationUnit(value: string, amount: number) {
  return amount === 1 ? value : `${value}s`;
}

function formatDurationEntry(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const duration = value as Record<string, unknown>;
  const type = stringValue(duration.type);

  if (type === 'instant') {
    return 'Instantaneous';
  }

  if (type === 'permanent') {
    return 'Until dispelled';
  }

  if (type === 'special') {
    return 'Special';
  }

  if (type === 'timed' && duration.duration && typeof duration.duration === 'object' && !Array.isArray(duration.duration)) {
    const timed = duration.duration as Record<string, unknown>;
    const amount = numberValue(timed.amount) ?? 1;
    const unit = stringValue(timed.type) ?? 'time';
    const base = `${amount} ${formatDurationUnit(unit, amount)}`;
    return duration.concentration ? `Concentration, up to ${base}` : base;
  }

  return type ? titleCase(type) : null;
}

function formatDuration(value: unknown) {
  const entries = Array.isArray(value) ? value.map(formatDurationEntry).filter(Boolean) : [];
  return entries.length > 0 ? entries.join(', ') : null;
}

function formatComponents(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const components = value as Record<string, unknown>;
  const parts: string[] = [];

  if (components.v) {
    parts.push('V');
  }

  if (components.s) {
    parts.push('S');
  }

  if (components.m) {
    const material = typeof components.m === 'string' ? cleanInlineText(components.m) : 'M';
    parts.push(material === 'M' ? 'M' : `M (${material})`);
  }

  return parts.length > 0 ? parts.join(', ') : null;
}

function formatCastingTime(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  return value.map((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return null;
    }

    const record = entry as Record<string, unknown>;
    const number = numberValue(record.number) ?? 1;
    const unit = stringValue(record.unit) ?? 'action';
    const condition = stringValue(record.condition);
    const base = `${number} ${formatDurationUnit(unit, number)}`;
    return condition ? `${base}, ${cleanInlineText(condition)}` : base;
  }).filter(Boolean).join(', ');
}

function formatSpellLevel(entry: CompendiumEntry) {
  const level = numberValue(entry.metadata.level) ?? 0;
  return level === 0 ? 'Cantrip' : `Level ${level}`;
}

export function buildSpellFacts(entry: CompendiumEntry): DetailFact[] {
  const school = getSpellSchoolLabel(entry.metadata.school);
  const concentration = Boolean(entry.metadata.concentration) || formatDuration(entry.metadata.duration)?.toLowerCase().includes('concentration');
  const castingTime = formatCastingTime(entry.metadata.time);
  const range = formatRange(entry.metadata.range);
  const components = formatComponents(entry.metadata.components);
  const duration = formatDuration(entry.metadata.duration);

  return compactFacts([
    { label: 'Level', value: formatSpellLevel(entry) },
    school ? { label: 'School', value: school } : null,
    castingTime ? { label: 'Casting Time', value: castingTime } : null,
    range ? { label: 'Range', value: range } : null,
    components ? { label: 'Components', value: components } : null,
    duration ? { label: 'Duration', value: duration } : null,
    { label: 'Ritual', value: entry.metadata.ritual ? 'Yes' : 'No' },
    { label: 'Concentration', value: concentration ? 'Yes' : 'No' },
  ]);
}

export function buildSourceFacts(entry: Pick<CompendiumEntry, 'sourceCode' | 'rulesEdition' | 'isLegacy'>): DetailFact[] {
  return compactFacts([
    { label: 'Source', value: entry.sourceCode },
    { label: 'Edition', value: getEditionLabel(entry.rulesEdition as RulesEdition, entry.isLegacy) },
  ]);
}

function formatMoney(value: number) {
  if (value >= 100) {
    return `${value / 100} gp`;
  }

  if (value >= 10) {
    return `${value / 10} sp`;
  }

  return `${value} cp`;
}

function formatWeight(value: number) {
  return `${value} lb${value === 1 ? '' : 's'}`;
}

function detectAttunement(entry: CompendiumEntry) {
  const direct = entry.metadata.requiresAttunement;
  if (typeof direct === 'boolean') {
    return direct ? 'Required' : null;
  }

  const text = [entry.summary, entry.text, stringValue(entry.metadata.entriesText)].filter(Boolean).join(' ').toLowerCase();
  if (/requires attunement|requires attunement by|to attune|your attunement/.test(text)) {
    return 'Required';
  }

  return null;
}

function createEntityFromEntry(entry: CompendiumEntry): ContentEntity {
  return {
    id: entry.entityId ?? entry.id,
    entityType: 'item',
    parentEntityId: null,
    name: entry.name,
    sourceCode: entry.sourceCode,
    sourceName: entry.sourceName,
    rulesEdition: entry.rulesEdition,
    isLegacy: entry.isLegacy,
    isPrimary2024: entry.isPrimary2024,
    isSelectableInBuilder: entry.isSelectableInBuilder,
    searchText: entry.searchText,
    summary: entry.summary,
    categoryTags: [],
    metadata: entry.metadata,
    renderPayload: entry.renderPayload,
    updatedAt: entry.updatedAt,
  };
}

export function buildItemFacts(entry: CompendiumEntry): DetailFact[] {
  const itemEntity = createEntityFromEntry(entry);
  const rarity = getRarityLabel(entry.metadata.rarity);
  const itemType = stringValue(entry.metadata.type) || stringValue(entry.metadata.typeAlt) ? getItemTypeLabel(itemEntity) : null;
  const value = numberValue(entry.metadata.value);
  const weight = numberValue(entry.metadata.weight);
  const weaponCategory = stringValue(entry.metadata.weaponCategory);
  const damage = stringValue(entry.metadata.damage);
  const damageType = getDamageTypeLabel(entry.metadata.damageType);
  const armorClass = numberValue(entry.metadata.armorClass);
  const properties = arrayOfStrings(entry.metadata.property).map((property) => ITEM_PROPERTY_LABELS[property] ?? property).join(', ');
  const armorType = getArmorTypeLabel(itemEntity);
  const attunement = detectAttunement(entry);

  return compactFacts([
    { label: 'Kind', value: isMagicItem(itemEntity) ? 'Magic Item' : 'Equipment' },
    itemType ? { label: 'Type', value: itemType } : null,
    rarity ? { label: 'Rarity', value: rarity } : null,
    value != null ? { label: 'Value', value: formatMoney(value) } : null,
    weight != null ? { label: 'Weight', value: formatWeight(weight) } : null,
    weaponCategory ? { label: 'Weapon', value: titleCase(weaponCategory) } : null,
    armorType ? { label: 'Armor', value: armorType } : null,
    damage ? { label: 'Damage', value: damageType ? `${damage} ${damageType}` : damage } : null,
    armorClass != null ? { label: 'AC', value: String(armorClass) } : null,
    properties ? { label: 'Properties', value: properties } : null,
    attunement ? { label: 'Attunement', value: attunement } : null,
  ]);
}

export function buildFeatFacts(entry: CompendiumEntry): DetailFact[] {
  const ability = formatAbilityMetadata(entry.metadata.ability);

  return compactFacts([
    { label: 'Type', value: formatFeatType(entry) },
    ability ? { label: 'Ability', value: ability } : null,
    ...buildSourceFacts(entry),
  ]);
}

export function buildSpeciesFacts(entry: CompendiumEntry): DetailFact[] {
  const size = formatSize(entry.metadata.size);
  const speed = formatSpeed(entry.metadata.speed);
  const creatureTypes = arrayOfStrings(entry.metadata.creatureTypes).map(titleCase).join(', ');
  const darkvision = formatDarkvision(entry.metadata.darkvision);
  const traits = arrayOfStrings(entry.metadata.traits).map(cleanInlineText).join(', ');
  const ability = formatAbilityMetadata(entry.metadata.ability);

  return compactFacts([
    size ? { label: 'Size', value: size } : null,
    speed ? { label: 'Speed', value: speed } : null,
    creatureTypes ? { label: 'Creature Type', value: creatureTypes } : null,
    darkvision ? { label: 'Darkvision', value: darkvision } : null,
    traits ? { label: 'Traits', value: traits } : null,
    ability ? { label: 'Ability', value: ability } : null,
    ...buildSourceFacts(entry),
  ]);
}

export function buildBackgroundFacts(entry: CompendiumEntry, resolvedFeatNames: string[] = []): DetailFact[] {
  const ability = formatAbilityMetadata(entry.metadata.ability);
  const skills = formatObjectChoiceList(entry.metadata.skillProficiencies);
  const tools = formatObjectChoiceList(entry.metadata.toolProficiencies);
  const languages = formatObjectChoiceList(entry.metadata.languageProficiencies);

  return compactFacts([
    ability ? { label: 'Ability Scores', value: ability } : null,
    resolvedFeatNames.length > 0 ? { label: 'Granted Feat', value: resolvedFeatNames.join(', ') } : null,
    skills ? { label: 'Skills', value: skills } : null,
    tools ? { label: 'Tools', value: tools } : null,
    languages ? { label: 'Languages', value: languages } : null,
    ...buildSourceFacts(entry),
  ]);
}

export function getCompendiumTypeLabel(entry: Pick<CompendiumEntry, 'entryType' | 'metadata'>) {
  switch (entry.entryType) {
    case 'background':
      return 'Background';
    case 'item':
      return isMagicItem({ metadata: entry.metadata } as ContentEntity) ? 'Magic Item' : 'Equipment';
    case 'optionalfeature':
      return 'Option';
    case 'subclass':
      return 'Subclass';
    default:
      return entry.entryType.charAt(0).toUpperCase() + entry.entryType.slice(1);
  }
}

export function getEntityIdsFromMetadata(value: unknown) {
  return arrayOfStrings(value);
}

export function sortEntityNames(entities: ContentEntity[]) {
  return [...entities].sort((left, right) => left.name.localeCompare(right.name) || left.sourceCode.localeCompare(right.sourceCode));
}
