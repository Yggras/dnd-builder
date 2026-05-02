import { useDeferredValue, useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { SQLiteContentRepository } from '@/features/content/adapters/SQLiteContentRepository';
import { ContentService } from '@/features/content/services/ContentService';
import type { CategoryBrowseState, CompendiumCategory, CompendiumCategorySort, FilterSection } from '@/features/compendium/types';
import {
  compareEdition,
  compendiumCategoryLabels,
  compendiumCategorySortOptions,
  createDefaultCompendiumFilters,
  getArmorTypeLabel,
  getCategoryDefaultSort,
  getDamageTypeLabel,
  getEditionLabel,
  getFeatTypeLabel,
  getItemTypeLabel,
  getRarityLabel,
  getSpellRoleTags,
  getSpellSchoolLabel,
  isMagicItem,
  sortByRarity,
  spellHasConcentration,
} from '@/features/compendium/utils/catalog';
import { queryKeys } from '@/shared/query/keys';
import type { ContentEntity } from '@/shared/types/domain';

const contentService = new ContentService(new SQLiteContentRepository());

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function metadataStrings(value: unknown) {
  return Array.isArray(value) ? value.filter(isNonEmptyString) : [];
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

function matchesQuery(entity: ContentEntity, query: string) {
  return !query || entity.searchText.toLowerCase().includes(query);
}

function buildFilterSections(category: CompendiumCategory, entries: ContentEntity[], filters: ReturnType<typeof createDefaultCompendiumFilters>): FilterSection[] {
  const sourceOptions = Array.from(new Map(entries.map((entry) => [entry.sourceCode, { value: entry.sourceCode, label: entry.sourceCode }])).values())
    .sort((left, right) => left.label.localeCompare(right.label));
  const editionSection: FilterSection = {
    key: 'editions',
    title: 'Edition',
    type: 'multi',
    options: [
      { label: '2024', value: '2024' },
      { label: '2014', value: '2014' },
    ],
  };
  const sourceSection: FilterSection = {
    key: 'sourceCodes',
    title: 'Source',
    type: 'multi',
    options: sourceOptions,
  };
  const baseSections: FilterSection[] = [editionSection, sourceSection];

  if (category === 'feats') {
    const featTypes = Array.from(new Set(entries.map(getFeatTypeLabel))).sort();
    return [
      {
        key: 'featTypes',
        title: 'Feat Type',
        type: 'multi',
        options: featTypes.map((value) => ({ value, label: value })),
      },
      ...baseSections,
    ];
  }

  if (category === 'items') {
    const rarities = sortByRarity(
      Array.from(new Set(entries.map((entry) => entry.metadata.rarity).filter((value): value is string => typeof value === 'string' && value.length > 0))),
    );
    const itemTypes = Array.from(new Set(entries.map(getItemTypeLabel))).sort();
    const weaponCategories = Array.from(
      new Set(entries.map((entry) => entry.metadata.weaponCategory).filter((value): value is string => typeof value === 'string' && value.length > 0)),
    ).sort();
    const armorTypes = Array.from(new Set(entries.map(getArmorTypeLabel).filter(isNonEmptyString))).sort();
    const damageTypes = Array.from(
      new Set(entries.map((entry) => getDamageTypeLabel(entry.metadata.damageType)).filter(isNonEmptyString)),
    ).sort();

    return [
      {
        key: 'itemKinds',
        title: 'Item Kind',
        type: 'multi',
        options: [
          { label: 'Mundane', value: 'mundane' },
          { label: 'Magic', value: 'magic' },
        ],
      },
      {
        key: 'itemRarities',
        title: 'Rarity',
        type: 'multi',
        options: rarities.map((value) => ({ value, label: getRarityLabel(value) ?? value })),
      },
      {
        key: 'itemTypes',
        title: 'Item Type',
        type: 'multi',
        options: itemTypes.map((value) => ({ value, label: value })),
      },
      {
        key: 'weaponCategories',
        title: 'Weapon Category',
        type: 'multi',
        options: weaponCategories.map((value) => ({ value, label: value.replace(/\b\w/g, (character) => character.toUpperCase()) })),
      },
      {
        key: 'armorTypes',
        title: 'Armor Type',
        type: 'multi',
        options: armorTypes.map((value) => ({ value: String(value), label: String(value) })),
      },
      {
        key: 'damageTypes',
        title: 'Damage Type',
        type: 'multi',
        options: damageTypes.map((value) => ({ value, label: value })),
      },
      ...baseSections,
    ];
  }

  if (category === 'spells') {
    const levels = Array.from(
      new Set(entries.map((entry) => Number(entry.metadata.level ?? -1)).filter((value) => Number.isInteger(value) && value >= 0)),
    ).sort((left, right) => left - right);
    const schools = Array.from(
      new Set(entries.map((entry) => getSpellSchoolLabel(entry.metadata.school)).filter((value): value is string => Boolean(value))),
    ).sort();
    const spellClasses = Array.from(new Set(entries.flatMap((entry) => metadataStrings(entry.metadata.classNames)))).sort();
    const damageTypes = Array.from(new Set(entries.flatMap((entry) => metadataStrings(entry.metadata.damageTypes)))).sort();
    const roles = Array.from(new Set(entries.flatMap(getSpellRoleTags))).sort();

    return [
      editionSection,
      {
        key: 'spellLevels',
        title: 'Level',
        type: 'multi',
        options: levels.map((value) => ({ value: String(value), label: value === 0 ? 'Cantrip' : `Level ${value}` })),
      },
      {
        key: 'spellSchools',
        title: 'School',
        type: 'multi',
        options: schools.map((value) => ({ value, label: value })),
      },
      {
        key: 'spellRoles',
        title: 'Role',
        type: 'multi',
        options: roles.map((value) => ({ value, label: value })),
      },
      {
        key: 'spellClasses',
        title: 'Class',
        type: 'multi',
        options: spellClasses.map((value) => ({ value, label: value })),
      },
      {
        key: 'spellDamageTypes',
        title: 'Damage Type',
        type: 'multi',
        options: damageTypes.map((value) => ({ value, label: getDamageTypeLabel(value) ?? value })),
      },
      {
        key: 'spellRitual',
        title: 'Ritual',
        type: 'toggle',
        options: [
          { value: 'all', label: 'All' },
          { value: 'yes', label: 'Ritual' },
          { value: 'no', label: 'Non-Ritual' },
        ],
        value: filters.spellRitual,
      },
      {
        key: 'spellConcentration',
        title: 'Concentration',
        type: 'toggle',
        options: [
          { value: 'all', label: 'All' },
          { value: 'yes', label: 'Concentration' },
          { value: 'no', label: 'Non-Concentration' },
        ],
        value: filters.spellConcentration,
      },
      sourceSection,
    ];
  }

  return baseSections;
}

function buildActiveChips(category: CompendiumCategory, filters: ReturnType<typeof createDefaultCompendiumFilters>) {
  const chips: Array<{ key: string; label: string }> = [];

  for (const edition of filters.editions) {
    chips.push({ key: `editions:${edition}`, label: edition });
  }

  for (const sourceCode of filters.sourceCodes) {
    chips.push({ key: `sourceCodes:${sourceCode}`, label: sourceCode });
  }

  if (category === 'feats') {
    for (const featType of filters.featTypes) {
      chips.push({ key: `featTypes:${featType}`, label: featType });
    }
  }

  if (category === 'items') {
    for (const itemKind of filters.itemKinds) {
      chips.push({ key: `itemKinds:${itemKind}`, label: itemKind === 'magic' ? 'Magic' : 'Mundane' });
    }
    for (const rarity of filters.itemRarities) {
      chips.push({ key: `itemRarities:${rarity}`, label: getRarityLabel(rarity) ?? rarity });
    }
    for (const itemType of filters.itemTypes) {
      chips.push({ key: `itemTypes:${itemType}`, label: itemType });
    }
    for (const weaponCategory of filters.weaponCategories) {
      chips.push({ key: `weaponCategories:${weaponCategory}`, label: weaponCategory });
    }
    for (const armorType of filters.armorTypes) {
      chips.push({ key: `armorTypes:${armorType}`, label: armorType });
    }
    for (const damageType of filters.damageTypes) {
      chips.push({ key: `damageTypes:${damageType}`, label: damageType });
    }
  }

  if (category === 'spells') {
    for (const level of filters.spellLevels) {
      chips.push({ key: `spellLevels:${level}`, label: level === 0 ? 'Cantrip' : `Level ${level}` });
    }
    for (const spellClass of filters.spellClasses) {
      chips.push({ key: `spellClasses:${spellClass}`, label: spellClass });
    }
    for (const damageType of filters.spellDamageTypes) {
      chips.push({ key: `spellDamageTypes:${damageType}`, label: getDamageTypeLabel(damageType) ?? damageType });
    }
    for (const school of filters.spellSchools) {
      chips.push({ key: `spellSchools:${school}`, label: school });
    }
    for (const role of filters.spellRoles) {
      chips.push({ key: `spellRoles:${role}`, label: role });
    }
    if (filters.spellRitual !== 'all') {
      chips.push({ key: `spellRitual:${filters.spellRitual}`, label: filters.spellRitual === 'yes' ? 'Ritual' : 'Non-Ritual' });
    }
    if (filters.spellConcentration !== 'all') {
      chips.push({
        key: `spellConcentration:${filters.spellConcentration}`,
        label: filters.spellConcentration === 'yes' ? 'Concentration' : 'Non-Concentration',
      });
    }
  }

  return chips;
}

function applyFilters(category: CompendiumCategory, entries: ContentEntity[], query: string, filters: ReturnType<typeof createDefaultCompendiumFilters>) {
  return entries.filter((entry) => {
    if (!matchesQuery(entry, query)) {
      return false;
    }

    const entryEdition = entry.isLegacy ? '2014' : '2024';
    if (filters.editions.length > 0 && !filters.editions.includes(entryEdition)) {
      return false;
    }

    if (filters.sourceCodes.length > 0 && !filters.sourceCodes.includes(entry.sourceCode)) {
      return false;
    }

    if (category === 'feats') {
      return filters.featTypes.length === 0 || filters.featTypes.includes(getFeatTypeLabel(entry));
    }

    if (category === 'items') {
      const itemKind = isMagicItem(entry) ? 'magic' : 'mundane';
      const rarity = typeof entry.metadata.rarity === 'string' ? entry.metadata.rarity : null;
      const itemType = getItemTypeLabel(entry);
      const weaponCategory = typeof entry.metadata.weaponCategory === 'string' ? entry.metadata.weaponCategory : null;
      const armorType = getArmorTypeLabel(entry);
      const damageType = getDamageTypeLabel(entry.metadata.damageType);

      return (
        (filters.itemKinds.length === 0 || filters.itemKinds.includes(itemKind)) &&
        (filters.itemRarities.length === 0 || (rarity != null && filters.itemRarities.includes(rarity))) &&
        (filters.itemTypes.length === 0 || filters.itemTypes.includes(itemType)) &&
        (filters.weaponCategories.length === 0 || (weaponCategory != null && filters.weaponCategories.includes(weaponCategory))) &&
        (filters.armorTypes.length === 0 || (armorType != null && filters.armorTypes.includes(armorType))) &&
        (filters.damageTypes.length === 0 || (damageType != null && filters.damageTypes.includes(damageType)))
      );
    }

    if (category === 'spells') {
      const level = Number(entry.metadata.level ?? -1);
      const school = getSpellSchoolLabel(entry.metadata.school);
      const spellClasses = metadataStrings(entry.metadata.classNames);
      const damageTypes = metadataStrings(entry.metadata.damageTypes);
      const roleTags = getSpellRoleTags(entry);
      const ritual = Boolean(entry.metadata.ritual);
      const concentration = spellHasConcentration(entry);

      return (
        (filters.spellLevels.length === 0 || filters.spellLevels.includes(level)) &&
        (filters.spellClasses.length === 0 || filters.spellClasses.some((spellClass) => spellClasses.includes(spellClass))) &&
        (filters.spellDamageTypes.length === 0 || filters.spellDamageTypes.some((damageType) => damageTypes.includes(damageType))) &&
        (filters.spellSchools.length === 0 || (school != null && filters.spellSchools.includes(school))) &&
        (filters.spellRoles.length === 0 || filters.spellRoles.some((role) => roleTags.includes(role))) &&
        (filters.spellRitual === 'all' || ritual === (filters.spellRitual === 'yes')) &&
        (filters.spellConcentration === 'all' || concentration === (filters.spellConcentration === 'yes'))
      );
    }

    return true;
  });
}

function compareBySource(left: ContentEntity, right: ContentEntity) {
  return left.sourceCode.localeCompare(right.sourceCode) || left.name.localeCompare(right.name);
}

function compareByFeatType(left: ContentEntity, right: ContentEntity) {
  return getFeatTypeLabel(left).localeCompare(getFeatTypeLabel(right)) || left.name.localeCompare(right.name);
}

function compareByType(left: ContentEntity, right: ContentEntity) {
  return getItemTypeLabel(left).localeCompare(getItemTypeLabel(right)) || left.name.localeCompare(right.name);
}

function compareByRarity(left: ContentEntity, right: ContentEntity) {
  const leftRarity = typeof left.metadata.rarity === 'string' ? left.metadata.rarity : 'none';
  const rightRarity = typeof right.metadata.rarity === 'string' ? right.metadata.rarity : 'none';
  const rarityOrder = sortByRarity([leftRarity, rightRarity]);

  if (leftRarity === rightRarity) {
    return left.name.localeCompare(right.name);
  }

  return rarityOrder[0] === leftRarity ? -1 : 1;
}

function compareBySpellLevel(left: ContentEntity, right: ContentEntity) {
  return Number(left.metadata.level ?? 99) - Number(right.metadata.level ?? 99) || left.name.localeCompare(right.name);
}

function compareBySpellSchool(left: ContentEntity, right: ContentEntity) {
  return (getSpellSchoolLabel(left.metadata.school) ?? '').localeCompare(getSpellSchoolLabel(right.metadata.school) ?? '') || left.name.localeCompare(right.name);
}

function sortEntries(entries: ContentEntity[], sort: CompendiumCategorySort) {
  return [...entries].sort((left, right) => {
    switch (sort) {
      case 'source':
        return compareBySource(left, right);
      case 'edition':
        return compareEdition(left, right);
      case 'feat-type':
        return compareByFeatType(left, right);
      case 'type':
        return compareByType(left, right);
      case 'rarity':
        return compareByRarity(left, right);
      case 'level':
        return compareBySpellLevel(left, right);
      case 'school':
        return compareBySpellSchool(left, right);
      case 'name':
      default:
        return left.name.localeCompare(right.name) || compareEdition(left, right);
    }
  });
}

function removeChip(filters: ReturnType<typeof createDefaultCompendiumFilters>, chipKey: string): ReturnType<typeof createDefaultCompendiumFilters> {
  const [sectionKey, rawValue] = chipKey.split(':');

  switch (sectionKey) {
    case 'editions':
      return { ...filters, editions: filters.editions.filter((value) => value !== rawValue) };
    case 'sourceCodes':
      return { ...filters, sourceCodes: filters.sourceCodes.filter((value) => value !== rawValue) };
    case 'featTypes':
      return { ...filters, featTypes: filters.featTypes.filter((value) => value !== rawValue) };
    case 'itemKinds':
      return { ...filters, itemKinds: filters.itemKinds.filter((value) => value !== rawValue) };
    case 'itemRarities':
      return { ...filters, itemRarities: filters.itemRarities.filter((value) => value !== rawValue) };
    case 'itemTypes':
      return { ...filters, itemTypes: filters.itemTypes.filter((value) => value !== rawValue) };
    case 'weaponCategories':
      return { ...filters, weaponCategories: filters.weaponCategories.filter((value) => value !== rawValue) };
    case 'armorTypes':
      return { ...filters, armorTypes: filters.armorTypes.filter((value) => value !== rawValue) };
    case 'damageTypes':
      return { ...filters, damageTypes: filters.damageTypes.filter((value) => value !== rawValue) };
    case 'spellLevels':
      return { ...filters, spellLevels: filters.spellLevels.filter((value) => String(value) !== rawValue) };
    case 'spellClasses':
      return { ...filters, spellClasses: filters.spellClasses.filter((value) => value !== rawValue) };
    case 'spellDamageTypes':
      return { ...filters, spellDamageTypes: filters.spellDamageTypes.filter((value) => value !== rawValue) };
    case 'spellSchools':
      return { ...filters, spellSchools: filters.spellSchools.filter((value) => value !== rawValue) };
    case 'spellRoles':
      return { ...filters, spellRoles: filters.spellRoles.filter((value) => value !== rawValue) };
    case 'spellRitual':
      return { ...filters, spellRitual: 'all' as const };
    case 'spellConcentration':
      return { ...filters, spellConcentration: 'all' as const };
    default:
      return filters;
  }
}

export function useCompendiumCategoryBrowse(category: CompendiumCategory): CategoryBrowseState {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(() => createDefaultCompendiumFilters());
  const [sort, setSort] = useState<CompendiumCategorySort>(getCategoryDefaultSort(category));
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const categoryQuery = useQuery({
    queryKey: queryKeys.compendiumCategory(category),
    queryFn: async () => {
      switch (category) {
        case 'classes':
          return contentService.browseClasses();
        case 'backgrounds':
          return contentService.browseBackgrounds();
        case 'feats':
          return contentService.browseFeats();
        case 'items':
          return contentService.browseItems();
        case 'species':
          return contentService.browseSpecies();
        case 'spells':
          return contentService.browseSpells();
      }
    },
  });

  const allEntries = categoryQuery.data ?? [];
  const entries = useMemo(() => sortEntries(applyFilters(category, allEntries, deferredQuery, filters), sort), [allEntries, category, deferredQuery, filters, sort]);
  const filterSections = useMemo(() => buildFilterSections(category, allEntries, filters), [allEntries, category, filters]);
  const activeChips = useMemo(() => buildActiveChips(category, filters), [category, filters]);

  return {
    category,
    title: compendiumCategoryLabels[category],
    query,
    setQuery,
    sort,
    setSort,
    filterSections,
    activeChips,
    entries,
    allEntries,
    isLoading: categoryQuery.isLoading,
    isFetching: categoryQuery.isFetching,
    error: categoryQuery.error,
    clearChip: (chipKey) => setFilters((current) => removeChip(current, chipKey)),
    clearAllFilters: () => setFilters(createDefaultCompendiumFilters()),
    toggleMultiFilter: (sectionKey, value) => {
      setFilters((current) => {
        switch (sectionKey) {
          case 'editions':
            return { ...current, editions: toggleValue(current.editions, value) as Array<'2014' | '2024'> };
          case 'sourceCodes':
            return { ...current, sourceCodes: toggleValue(current.sourceCodes, value) };
          case 'featTypes':
            return { ...current, featTypes: toggleValue(current.featTypes, value) };
          case 'itemKinds':
            return { ...current, itemKinds: toggleValue(current.itemKinds, value) as Array<'mundane' | 'magic'> };
          case 'itemRarities':
            return { ...current, itemRarities: toggleValue(current.itemRarities, value) };
          case 'itemTypes':
            return { ...current, itemTypes: toggleValue(current.itemTypes, value) };
          case 'weaponCategories':
            return { ...current, weaponCategories: toggleValue(current.weaponCategories, value) };
          case 'armorTypes':
            return { ...current, armorTypes: toggleValue(current.armorTypes, value) };
          case 'damageTypes':
            return { ...current, damageTypes: toggleValue(current.damageTypes, value) };
          case 'spellLevels':
            return {
              ...current,
              spellLevels: current.spellLevels.includes(Number(value))
                ? current.spellLevels.filter((entry) => entry !== Number(value))
                : [...current.spellLevels, Number(value)],
            };
          case 'spellClasses':
            return { ...current, spellClasses: toggleValue(current.spellClasses, value) };
          case 'spellDamageTypes':
            return { ...current, spellDamageTypes: toggleValue(current.spellDamageTypes, value) };
          case 'spellSchools':
            return { ...current, spellSchools: toggleValue(current.spellSchools, value) };
          case 'spellRoles':
            return { ...current, spellRoles: toggleValue(current.spellRoles, value) };
          default:
            return current;
        }
      });
    },
    setToggleFilter: (sectionKey, value) => {
      setFilters((current) => {
        if (sectionKey === 'spellRitual') {
          return { ...current, spellRitual: value };
        }

        if (sectionKey === 'spellConcentration') {
          return { ...current, spellConcentration: value };
        }

        return current;
      });
    },
    sortOptions: compendiumCategorySortOptions[category],
  };
}
