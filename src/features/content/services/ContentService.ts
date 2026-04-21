import type { ContentRepository, ItemQueryOptions, SpellQueryOptions } from '@/features/content/repositories/ContentRepository';

export class ContentService {
  constructor(private readonly repository: ContentRepository) {}

  listSpecies() {
    return this.repository.listSpecies(true);
  }

  listClasses() {
    return this.repository.listClasses(true);
  }

  listSubclasses(classId: string) {
    return this.repository.listSubclasses(classId, true);
  }

  listFeats(categoryTag?: string) {
    return this.repository.listFeats(categoryTag, true);
  }

  listOptionalFeatures(featureType?: string) {
    return this.repository.listOptionalFeatures(featureType, true);
  }

  listSpells(options: SpellQueryOptions = {}) {
    return this.repository.listSpells({ ...options, onlySelectableInBuilder: options.onlySelectableInBuilder ?? true });
  }

  listItems(options: ItemQueryOptions = {}) {
    return this.repository.listItems({ ...options, onlySelectableInBuilder: options.onlySelectableInBuilder ?? true });
  }

  listChoiceGrants(sourceId: string) {
    return this.repository.listChoiceGrants(sourceId);
  }

  searchCompendiumEntries(query: string, entryType?: string) {
    return this.repository.searchCompendiumEntries(query, entryType);
  }
}
