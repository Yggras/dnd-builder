import { getEditionLabel } from '@/features/compendium/utils/catalog';
import type { DetailFact } from '@/features/compendium/utils/detailFacts';
import { cleanInlineText, parseInlineText, type InlineTextToken } from '@/features/compendium/utils/inlineText';
import type { CompendiumEntry, ContentEntity } from '@/shared/types/domain';

export type FeatureProgressionRow = {
  name: string;
  level: number | null;
  sourceCode: string | null;
  isSubclassUnlock: boolean;
  detailEntries: unknown[];
};

type FeatureDetailRecord = {
  sourceCode?: unknown;
  entries?: unknown;
};

const ABILITY_LABELS: Record<string, string> = {
  cha: 'Charisma',
  con: 'Constitution',
  dex: 'Dexterity',
  int: 'Intelligence',
  str: 'Strength',
  wis: 'Wisdom',
};

const CASTER_PROGRESSION_LABELS: Record<string, string> = {
  artificer: 'Artificer',
  full: 'Full Caster',
  half: 'Half Caster',
  pact: 'Pact Magic',
  third: 'Third Caster',
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

function featureDetailRecord(value: unknown): FeatureDetailRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as FeatureDetailRecord : null;
}

function titleCase(value: string) {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatAbilityKey(value: string) {
  return ABILITY_LABELS[value.toLowerCase()] ?? titleCase(value);
}

function formatAbilityList(values: string[]) {
  if (values.length === 0) {
    return null;
  }

  if (values.length === 1) {
    return formatAbilityKey(values[0]);
  }

  return values.map(formatAbilityKey).join(' or ');
}

function formatPrimaryAbilities(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  const choices = value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return [];
    }

    return [formatAbilityList(Object.entries(entry).filter(([, enabled]) => Boolean(enabled)).map(([ability]) => ability))].filter(Boolean);
  });

  return choices.length > 0 ? choices.join(' or ') : null;
}

function formatHitDie(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const number = numberValue(record.number) ?? 1;
  const faces = numberValue(record.faces);

  if (!faces) {
    return null;
  }

  return number === 1 ? `d${faces}` : `${number}d${faces}`;
}

function formatCasterProgression(value: unknown) {
  const progression = stringValue(value);
  return progression ? CASTER_PROGRESSION_LABELS[progression] ?? titleCase(progression) : null;
}

function formatSpellcastingAbility(value: unknown) {
  const ability = stringValue(value);
  return ability ? formatAbilityKey(ability) : null;
}

function formatSimpleList(value: unknown) {
  const values = arrayOfStrings(value).map((entry) => titleCase(cleanInlineText(entry)));
  return values.length > 0 ? values.join(', ') : null;
}

function formatSkillChoices(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  const summaries = value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return [];
    }

    const choose = (entry as Record<string, unknown>).choose;
    if (!choose || typeof choose !== 'object' || Array.isArray(choose)) {
      return [];
    }

    const chooseRecord = choose as Record<string, unknown>;
    const count = numberValue(chooseRecord.count) ?? 1;
    const options = arrayOfStrings(chooseRecord.from).map(titleCase);

    if (options.length === 0) {
      return [];
    }

    return [`Choose ${count} from ${options.join(', ')}`];
  });

  return summaries.length > 0 ? summaries.join('; ') : null;
}

export function buildClassFacts(classEntity: ContentEntity): DetailFact[] {
  return compactFacts([
    { label: 'Hit Die', value: formatHitDie(classEntity.metadata.hitDie) ?? '' },
    { label: 'Primary Ability', value: formatPrimaryAbilities(classEntity.metadata.primaryAbility) ?? '' },
    { label: 'Saving Throws', value: formatSimpleList(classEntity.metadata.proficiency) ?? '' },
    { label: 'Spellcasting', value: formatSpellcastingAbility(classEntity.metadata.spellcastingAbility) ?? '' },
    { label: 'Progression', value: formatCasterProgression(classEntity.metadata.casterProgression) ?? '' },
    { label: 'Source', value: classEntity.sourceCode },
    { label: 'Edition', value: getEditionLabel(classEntity.rulesEdition, classEntity.isLegacy) },
  ]);
}

export function buildSubclassFacts(entry: CompendiumEntry, parentClass: ContentEntity | null): DetailFact[] {
  const shortName = stringValue(entry.metadata.shortName);

  return compactFacts([
    parentClass ? { label: 'Parent Class', value: parentClass.name } : null,
    shortName && shortName !== entry.name ? { label: 'Short Name', value: shortName } : null,
    { label: 'Spellcasting', value: formatSpellcastingAbility(entry.metadata.spellcastingAbility) ?? '' },
    { label: 'Progression', value: formatCasterProgression(entry.metadata.casterProgression) ?? '' },
    { label: 'Source', value: entry.sourceCode },
    { label: 'Edition', value: getEditionLabel(entry.rulesEdition, entry.isLegacy) },
  ]);
}

export function buildClassProficiencyFacts(classEntity: ContentEntity): DetailFact[] {
  const startingProficiencies = classEntity.metadata.startingProficiencies;
  if (!startingProficiencies || typeof startingProficiencies !== 'object' || Array.isArray(startingProficiencies)) {
    return [];
  }

  const proficiencies = startingProficiencies as Record<string, unknown>;
  return compactFacts([
    { label: 'Armor', value: formatSimpleList(proficiencies.armor) ?? '' },
    { label: 'Weapons', value: formatSimpleList(proficiencies.weapons) ?? '' },
    { label: 'Tools', value: formatSimpleList(proficiencies.tools) ?? '' },
    { label: 'Skills', value: formatSkillChoices(proficiencies.skills) ?? '' },
  ]);
}

function parseFeatureValue(value: unknown): { raw: string; isSubclassUnlock: boolean } | null {
  if (typeof value === 'string') {
    return { raw: value, isSubclassUnlock: false };
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const raw = stringValue(record.classFeature) ?? stringValue(record.subclassFeature);

  return raw ? { raw, isSubclassUnlock: Boolean(record.gainSubclassFeature) } : null;
}

function parseFeatureReference(value: unknown, detailValue?: unknown): FeatureProgressionRow | null {
  const parsed = parseFeatureValue(value);
  if (!parsed) {
    return null;
  }

  const detail = featureDetailRecord(detailValue);
  const parts = parsed.raw.split('|').map((part) => cleanInlineText(part).trim()).filter(Boolean);
  const numericParts = parts.map((part) => Number.parseInt(part, 10)).filter((part) => Number.isInteger(part));
  const sourceCode = parts.find((part) => /^[A-Z][A-Z0-9]+$/.test(part)) ?? null;
  const detailSourceCode = stringValue(detail?.sourceCode);
  const detailEntries = Array.isArray(detail?.entries) ? detail.entries : [];

  return {
    name: parts[0] ?? cleanInlineText(parsed.raw),
    level: numericParts.length > 0 ? numericParts[numericParts.length - 1] : null,
    sourceCode: detailSourceCode ?? sourceCode,
    isSubclassUnlock: parsed.isSubclassUnlock,
    detailEntries,
  };
}

function sortProgressionRows(rows: FeatureProgressionRow[]) {
  return [...rows].sort((left, right) => {
    const leftLevel = left.level ?? 999;
    const rightLevel = right.level ?? 999;
    return leftLevel - rightLevel || left.name.localeCompare(right.name);
  });
}

export function buildClassFeatureRows(classEntity: ContentEntity) {
  const details = Array.isArray(classEntity.metadata.classFeatureDetails) ? classEntity.metadata.classFeatureDetails : [];
  const rows = Array.isArray(classEntity.metadata.classFeatures)
    ? classEntity.metadata.classFeatures.map((feature, index) => parseFeatureReference(feature, details[index])).filter((row): row is FeatureProgressionRow => Boolean(row))
    : [];

  return sortProgressionRows(rows);
}

export function buildSubclassFeatureRows(entry: CompendiumEntry) {
  const details = Array.isArray(entry.metadata.subclassFeatureDetails) ? entry.metadata.subclassFeatureDetails : [];
  const rows = Array.isArray(entry.metadata.subclassFeatures)
    ? entry.metadata.subclassFeatures.map((feature, index) => parseFeatureReference(feature, details[index])).filter((row): row is FeatureProgressionRow => Boolean(row))
    : [];

  return sortProgressionRows(rows);
}

export function buildStartingEquipmentLines(classEntity: ContentEntity): InlineTextToken[][] {
  const startingEquipment = classEntity.metadata.startingEquipment;
  if (!startingEquipment || typeof startingEquipment !== 'object' || Array.isArray(startingEquipment)) {
    return [];
  }

  const entries = (startingEquipment as Record<string, unknown>).entries;
  return arrayOfStrings(entries).map(parseInlineText).filter((tokens) => tokens.length > 0);
}

export function getAdditionalSpellIds(entry: CompendiumEntry) {
  return arrayOfStrings(entry.metadata.additionalSpellIds);
}

export function getParentClassIdFromSubclassEntry(entry: CompendiumEntry) {
  const entityId = entry.entityId;
  if (!entityId) {
    return null;
  }

  const parts = entityId.split('|');
  const subclassIndex = parts.indexOf('subclass');
  if (subclassIndex === -1 || parts.length <= subclassIndex + 2) {
    return null;
  }

  return [parts[subclassIndex + 1], parts[subclassIndex + 2]].filter(Boolean).join('|') || null;
}
