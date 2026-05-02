import type { ContentEntity, RulesEdition } from '@/shared/types/domain';

export type { CompendiumEntry } from '@/shared/types/domain';

export type CompendiumCategory = 'classes' | 'backgrounds' | 'feats' | 'items' | 'species' | 'spells';

export type CompendiumCategorySort =
  | 'name'
  | 'source'
  | 'edition'
  | 'feat-type'
  | 'rarity'
  | 'type'
  | 'level'
  | 'school';

export interface CompendiumFilters {
  sourceCodes: string[];
  editions: RulesEdition[];
  featTypes: string[];
  itemKinds: Array<'mundane' | 'magic'>;
  itemRarities: string[];
  itemTypes: string[];
  weaponCategories: string[];
  armorTypes: string[];
  damageTypes: string[];
  spellLevels: number[];
  spellClasses: string[];
  spellDamageTypes: string[];
  spellSchools: string[];
  spellRoles: string[];
  spellRitual: 'all' | 'yes' | 'no';
  spellConcentration: 'all' | 'yes' | 'no';
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterSection {
  key: string;
  title: string;
  type: 'multi' | 'toggle';
  options: FilterOption[];
  value?: 'all' | 'yes' | 'no';
}

export interface SortOption {
  label: string;
  value: CompendiumCategorySort;
}

export interface CategoryBrowseState {
  category: CompendiumCategory;
  title: string;
  query: string;
  setQuery: (value: string) => void;
  sort: CompendiumCategorySort;
  setSort: (value: CompendiumCategorySort) => void;
  filterSections: FilterSection[];
  activeChips: Array<{ key: string; label: string }>;
  entries: ContentEntity[];
  allEntries: ContentEntity[];
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  clearChip: (key: string) => void;
  clearAllFilters: () => void;
  toggleMultiFilter: (sectionKey: string, value: string) => void;
  setToggleFilter: (sectionKey: string, value: 'all' | 'yes' | 'no') => void;
  sortOptions: SortOption[];
}
