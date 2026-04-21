import type { CompendiumEntry } from '@/shared/types/domain';

export interface CompendiumRepository {
  searchEntries: (query: string) => Promise<CompendiumEntry[]>;
}
