import type { CompendiumRepository } from '@/features/compendium/repositories/CompendiumRepository';

export class CompendiumService {
  constructor(private readonly repository: CompendiumRepository) {}

  searchEntries(query: string) {
    return this.repository.searchEntries(query);
  }
}
