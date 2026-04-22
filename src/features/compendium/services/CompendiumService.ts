import type { CompendiumRepository } from '@/features/compendium/repositories/CompendiumRepository';

export class CompendiumService {
  constructor(private readonly repository: CompendiumRepository) {}

  searchEntries(query: string, entryType?: string) {
    return this.repository.searchEntries(query, entryType);
  }

  getEntryById(id: string) {
    return this.repository.getEntryById(id);
  }
}
