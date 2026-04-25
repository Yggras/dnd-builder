import type { CompendiumCategory, CompendiumCategorySort, CompendiumFilters, SortOption } from '@/features/compendium/types';
import type { ContentEntity, RulesEdition } from '@/shared/types/domain';

const SPELL_SCHOOL_LABELS: Record<string, string> = {
  A: 'Abjuration',
  C: 'Conjuration',
  D: 'Divination',
  E: 'Enchantment',
  I: 'Illusion',
  N: 'Necromancy',
  T: 'Transmutation',
  V: 'Evocation',
};

const ITEM_TYPE_LABELS: Record<string, string> = {
  A: 'Ammunition',
  AT: 'Artisan Tool',
  EM: 'Eldritch Machine',
  EXP: 'Explosive',
  G: 'Gear',
  HA: 'Heavy Armor',
  INS: 'Instrument',
  LA: 'Light Armor',
  M: 'Melee Weapon',
  MA: 'Medium Armor',
  P: 'Potion',
  R: 'Ranged Weapon',
  RD: 'Rod',
  RG: 'Ring',
  S: 'Shield',
  SC: 'Scroll',
  SCF: 'Spellcasting Focus',
  ST: 'Staff',
  T: 'Tool',
  TG: 'Trade Good',
  VEH: 'Vehicle',
  W: 'Weapon',
  WD: 'Wand',
};

const DAMAGE_TYPE_LABELS: Record<string, string> = {
  A: 'Acid',
  B: 'Bludgeoning',
  C: 'Cold',
  F: 'Fire',
  FC: 'Force',
  L: 'Lightning',
  N: 'Necrotic',
  O: 'Poison',
  P: 'Piercing',
  PS: 'Psychic',
  R: 'Radiant',
  S: 'Slashing',
  T: 'Thunder',
};

const RARITY_ORDER = ['none', 'common', 'uncommon', 'rare', 'very rare', 'legendary', 'artifact', 'varies'];
const DEFAULT_FILTERS: CompendiumFilters = {
  sourceCodes: [],
  editions: [],
  featTypes: [],
  itemKinds: [],
  itemRarities: [],
  itemTypes: [],
  weaponCategories: [],
  armorTypes: [],
  damageTypes: [],
  spellLevels: [],
  spellSchools: [],
  spellRoles: [],
  spellRitual: 'all',
  spellConcentration: 'all',
};

export const compendiumCategoryLabels: Record<CompendiumCategory, string> = {
  classes: 'Classes',
  backgrounds: 'Backgrounds',
  feats: 'Feats',
  items: 'Items',
  species: 'Species',
  spells: 'Spells',
};

export const compendiumCategorySummaries: Record<CompendiumCategory, string> = {
  classes: 'Browse class identities and drill into their subclasses.',
  backgrounds: 'Search backgrounds by source and rules edition.',
  feats: 'Filter feats by type, source, and edition.',
  items: 'Browse mundane equipment and magic items in one library.',
  species: 'Search species with clean source and edition controls.',
  spells: 'Filter spells by level, school, role, and casting constraints.',
};

export const compendiumCategorySortOptions: Record<CompendiumCategory, SortOption[]> = {
  classes: [
    { label: 'Name', value: 'name' },
    { label: 'Source', value: 'source' },
    { label: 'Edition', value: 'edition' },
  ],
  backgrounds: [
    { label: 'Name', value: 'name' },
    { label: 'Source', value: 'source' },
    { label: 'Edition', value: 'edition' },
  ],
  feats: [
    { label: 'Name', value: 'name' },
    { label: 'Feat Type', value: 'feat-type' },
    { label: 'Source', value: 'source' },
    { label: 'Edition', value: 'edition' },
  ],
  items: [
    { label: 'Name', value: 'name' },
    { label: 'Rarity', value: 'rarity' },
    { label: 'Type', value: 'type' },
    { label: 'Source', value: 'source' },
    { label: 'Edition', value: 'edition' },
  ],
  species: [
    { label: 'Name', value: 'name' },
    { label: 'Source', value: 'source' },
    { label: 'Edition', value: 'edition' },
  ],
  spells: [
    { label: 'Name', value: 'name' },
    { label: 'Level', value: 'level' },
    { label: 'School', value: 'school' },
    { label: 'Source', value: 'source' },
    { label: 'Edition', value: 'edition' },
  ],
};

export function createDefaultCompendiumFilters(): CompendiumFilters {
  return { ...DEFAULT_FILTERS };
}

export function getEditionLabel(rulesEdition: RulesEdition, isLegacy: boolean) {
  return isLegacy || rulesEdition === '2014' ? '2014' : '2024';
}

export function compareEdition(left: ContentEntity, right: ContentEntity) {
  const leftRank = left.isLegacy ? 1 : 0;
  const rightRank = right.isLegacy ? 1 : 0;
  return leftRank - rightRank || left.name.localeCompare(right.name);
}

export function getCompendiumEntryIdFromEntityId(entityId: string) {
  return `${entityId.replace(/\|/g, '-')}|compendium`;
}

export function getSpellSchoolLabel(value: unknown) {
  if (typeof value !== 'string' || !value) {
    return null;
  }

  return SPELL_SCHOOL_LABELS[value] ?? value;
}

export function getFeatTypeLabel(entity: ContentEntity) {
  const category = typeof entity.metadata.category === 'string' ? entity.metadata.category : null;

  if (entity.categoryTags.some((tag) => tag.startsWith('FS'))) {
    return 'Fighting Style';
  }

  switch (category) {
    case 'O':
      return 'Origin';
    case 'G':
      return 'General';
    case 'EB':
      return 'Epic Boon';
    default:
      return 'Other';
  }
}

export function isMagicItem(entity: ContentEntity) {
  const category = typeof entity.metadata.category === 'string' ? entity.metadata.category.toLowerCase() : null;
  const rarity = typeof entity.metadata.rarity === 'string' ? entity.metadata.rarity.toLowerCase() : null;

  return !(category === 'basic' || rarity == null || rarity === 'none');
}

function getPrimaryItemTypeCode(entity: ContentEntity) {
  const rawType = typeof entity.metadata.type === 'string' ? entity.metadata.type : null;
  if (!rawType) {
    return null;
  }

  return rawType.split('|')[0] ?? null;
}

export function getItemTypeLabel(entity: ContentEntity) {
  const typeCode = getPrimaryItemTypeCode(entity);
  if (!typeCode) {
    return 'Other';
  }

  return ITEM_TYPE_LABELS[typeCode] ?? typeCode;
}

export function getArmorTypeLabel(entity: ContentEntity) {
  switch (getPrimaryItemTypeCode(entity)) {
    case 'LA':
      return 'Light Armor';
    case 'MA':
      return 'Medium Armor';
    case 'HA':
      return 'Heavy Armor';
    case 'S':
      return 'Shield';
    default:
      return null;
  }
}

export function getDamageTypeLabel(value: unknown) {
  if (typeof value !== 'string' || !value) {
    return null;
  }

  return DAMAGE_TYPE_LABELS[value] ?? value;
}

export function getRarityLabel(value: unknown) {
  if (typeof value !== 'string' || !value) {
    return null;
  }

  return value === 'none' ? 'None' : value.replace(/\b\w/g, (character) => character.toUpperCase());
}

export function sortByRarity(values: string[]) {
  return [...values].sort((left, right) => {
    const leftIndex = RARITY_ORDER.indexOf(left);
    const rightIndex = RARITY_ORDER.indexOf(right);
    return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex) || left.localeCompare(right);
  });
}

export function spellHasConcentration(entity: ContentEntity) {
  const durations = Array.isArray(entity.metadata.duration) ? entity.metadata.duration : [];
  return durations.some((duration) => Boolean((duration as { concentration?: unknown }).concentration));
}

export function getSpellRoleTags(entity: ContentEntity) {
  const explicitTags = Array.isArray(entity.metadata.roleTags)
    ? entity.metadata.roleTags.filter((value): value is string => typeof value === 'string' && value.length > 0)
    : [];

  if (explicitTags.length > 0) {
    return explicitTags;
  }

  const text = [entity.name, entity.searchText, typeof entity.metadata.entriesText === 'string' ? entity.metadata.entriesText : '']
    .join(' ')
    .toLowerCase();
  const tags = new Set<string>();

  if (/damage|attack|saving throw|hit point maximum reduced|explodes|cone|line|sphere|radius/.test(text)) {
    tags.add('Combat');
  }

  if (/regain hit points|restores hit points|healing|cure wounds|heal|revive|resurrection|temporary hit points/.test(text)) {
    tags.add('Healing');
  }

  if (/you gain|target gains|ally gains|bonus to|advantage on|speed increases|resistance to/.test(text)) {
    tags.add('Buff');
  }

  if (/disadvantage|frightened|charmed|blinded|poisoned|paralyzed|restrained|stunned|incapacitated|speed is reduced/.test(text)) {
    tags.add('Debuff');
  }

  if (/restrained|difficult terrain|can't move|can't take reactions|wall of|banish|teleport|forced movement|area/.test(text)) {
    tags.add('Control');
  }

  if (/summon|conjure|spirit appears|creature appears|familiar|elemental|undead spirit|you call forth/.test(text)) {
    tags.add('Summoning');
  }

  if (/ac increases|bonus to ac|ward|shield|protective|resistance to|immune to|can't be targeted/.test(text)) {
    tags.add('Defense');
  }

  if (tags.size === 0 || /ritual|detect|identify|comprehend|locate|scry|travel|teleportation circle|disguise|invisibility|message/.test(text)) {
    tags.add('Utility');
  }

  return [...tags].sort();
}

export function getCategoryDefaultSort(category: CompendiumCategory): CompendiumCategorySort {
  switch (category) {
    case 'spells':
      return 'level';
    default:
      return 'name';
  }
}
