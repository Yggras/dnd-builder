import type { ChoiceGrant, CompendiumEntry, ContentEntity } from '@/shared/types/domain';

export interface SpellQueryOptions {
  classId?: string;
  level?: number;
  query?: string;
  onlySelectableInBuilder?: boolean;
}

export interface ItemQueryOptions {
  query?: string;
  onlySelectableInBuilder?: boolean;
}

export interface ContentRepository {
  listSpecies: (onlySelectableInBuilder?: boolean) => Promise<ContentEntity[]>;
  listClasses: (onlySelectableInBuilder?: boolean) => Promise<ContentEntity[]>;
  listSubclasses: (classId: string, onlySelectableInBuilder?: boolean) => Promise<ContentEntity[]>;
  listFeats: (categoryTag?: string, onlySelectableInBuilder?: boolean) => Promise<ContentEntity[]>;
  listOptionalFeatures: (featureType?: string, onlySelectableInBuilder?: boolean) => Promise<ContentEntity[]>;
  listSpells: (options?: SpellQueryOptions) => Promise<ContentEntity[]>;
  listItems: (options?: ItemQueryOptions) => Promise<ContentEntity[]>;
  listChoiceGrants: (sourceId: string) => Promise<ChoiceGrant[]>;
  searchCompendiumEntries: (query: string, entryType?: string) => Promise<CompendiumEntry[]>;
}
