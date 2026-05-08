import { getEditionLabel } from '@/features/compendium/utils/catalog';
import { buildClassFeatureRows } from '@/features/compendium/utils/classDetails';
import { cleanInlineText } from '@/features/compendium/utils/inlineText';
import { getSubclassUnlockLevel } from '@/features/builder/utils/classStep';
import type { ContentEntity } from '@/shared/types/domain';

export type ClassFact = {
  label: string;
  value: string;
};

const UNKNOWN = 'Unknown';
const NOT_STRUCTURED = 'Not structured yet';

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
  '1/2': 'Half Caster',
  '1/3': 'Third Caster',
};

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

export function formatClassHitDie(classEntity: ContentEntity) {
  const hitDie = classEntity.metadata.hitDie;
  if (!hitDie || typeof hitDie !== 'object' || Array.isArray(hitDie)) {
    return UNKNOWN;
  }

  const record = hitDie as Record<string, unknown>;
  const diceCount = numberValue(record.number) ?? 1;
  const faces = numberValue(record.faces);

  if (!faces) {
    return UNKNOWN;
  }

  return diceCount === 1 ? `d${faces}` : `${diceCount}d${faces}`;
}

export function formatClassPrimaryAbilities(classEntity: ContentEntity) {
  const value = classEntity.metadata.primaryAbility;
  if (!Array.isArray(value)) {
    return UNKNOWN;
  }

  const choices = value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return [];
    }

    const abilities = Object.entries(entry)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([ability]) => ability);
    const label = formatAbilityList(abilities);
    return label ? [label] : [];
  });

  return choices.length > 0 ? choices.join(' or ') : UNKNOWN;
}

export function formatClassSavingThrows(classEntity: ContentEntity) {
  const proficiencies = arrayOfStrings(classEntity.metadata.proficiency).map(formatAbilityKey);
  return proficiencies.length > 0 ? proficiencies.join(', ') : UNKNOWN;
}

function getStartingProficiencies(classEntity: ContentEntity) {
  const value = classEntity.metadata.startingProficiencies;
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
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

    return options.length > 0 ? [`Choose ${count} from ${options.join(', ')}`] : [];
  });

  return summaries.length > 0 ? summaries.join('; ') : null;
}

export function formatClassArmorProficiencies(classEntity: ContentEntity) {
  return formatSimpleList(getStartingProficiencies(classEntity)?.armor) ?? UNKNOWN;
}

export function formatClassWeaponProficiencies(classEntity: ContentEntity) {
  return formatSimpleList(getStartingProficiencies(classEntity)?.weapons) ?? UNKNOWN;
}

export function formatClassToolProficiencies(classEntity: ContentEntity) {
  return formatSimpleList(getStartingProficiencies(classEntity)?.tools) ?? NOT_STRUCTURED;
}

export function formatClassSkillProficiencies(classEntity: ContentEntity) {
  return formatSkillChoices(getStartingProficiencies(classEntity)?.skills) ?? NOT_STRUCTURED;
}

export function formatClassSpellcastingStatus(classEntity: ContentEntity) {
  const ability = stringValue(classEntity.metadata.spellcastingAbility);
  const progression = stringValue(classEntity.metadata.casterProgression);
  const hasCantrips = Array.isArray(classEntity.metadata.cantripProgression) && classEntity.metadata.cantripProgression.length > 0;
  const hasPrepared = Array.isArray(classEntity.metadata.preparedSpellsProgression) && classEntity.metadata.preparedSpellsProgression.length > 0;
  const hasKnown = Array.isArray(classEntity.metadata.spellsKnownProgression) && classEntity.metadata.spellsKnownProgression.length > 0;

  if (!ability && !progression && !hasCantrips && !hasPrepared && !hasKnown) {
    return 'Non-spellcasting';
  }

  const parts = [
    ability ? formatAbilityKey(ability) : null,
    progression ? CASTER_PROGRESSION_LABELS[progression] ?? titleCase(progression) : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' • ') : 'Spellcasting';
}

export function getClassSpellcastingBadge(classEntity: ContentEntity) {
  return formatClassSpellcastingStatus(classEntity) === 'Non-spellcasting' ? 'Non-spellcasting' : 'Spellcasting';
}

export function getClassEditionBadge(classEntity: ContentEntity) {
  return getEditionLabel(classEntity.rulesEdition, classEntity.isLegacy);
}

export function buildCompactClassFacts(classEntity: ContentEntity): ClassFact[] {
  return [
    { label: 'Hit Die', value: formatClassHitDie(classEntity) },
    { label: 'Primary', value: formatClassPrimaryAbilities(classEntity) },
    { label: 'Saves', value: formatClassSavingThrows(classEntity) },
    { label: 'Armor', value: formatClassArmorProficiencies(classEntity) },
    { label: 'Weapons', value: formatClassWeaponProficiencies(classEntity) },
    { label: 'Spellcasting', value: formatClassSpellcastingStatus(classEntity) },
  ];
}

export function buildExpandedClassFacts(classEntity: ContentEntity): ClassFact[] {
  const subclassUnlockLevel = getSubclassUnlockLevel(classEntity);

  return [
    ...buildCompactClassFacts(classEntity),
    { label: 'Skills', value: formatClassSkillProficiencies(classEntity) },
    { label: 'Tools', value: formatClassToolProficiencies(classEntity) },
    { label: 'Multiclass Prerequisites', value: formatClassPrimaryAbilities(classEntity) === UNKNOWN ? NOT_STRUCTURED : `${formatClassPrimaryAbilities(classEntity)} 13+` },
    { label: 'Subclass', value: subclassUnlockLevel == null ? NOT_STRUCTURED : `Unlocks at class level ${subclassUnlockLevel}` },
  ];
}

export function buildClassKeyLevels(classEntity: ContentEntity) {
  const featureRows = buildClassFeatureRows(classEntity);
  const levelOneFeatures = featureRows.filter((row) => row.level === 1 && !row.isSubclassUnlock).map((row) => row.name);
  const subclassUnlockLevel = getSubclassUnlockLevel(classEntity);
  const levels: string[] = [];

  levels.push(levelOneFeatures.length > 0 ? `Level 1: ${levelOneFeatures.slice(0, 3).join(', ')}` : `Level 1: ${NOT_STRUCTURED}`);

  if (subclassUnlockLevel != null) {
    levels.push(`Level ${subclassUnlockLevel}: Subclass choice unlocks`);
  }

  return levels;
}
