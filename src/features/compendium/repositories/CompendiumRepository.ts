import type { CompendiumEntry } from '@/shared/types/domain';

export interface CompendiumRepository {
  searchEntries: (query: string, entryType?: string) => Promise<CompendiumEntry[]>;
  getEntryById: (id: string) => Promise<CompendiumEntry | null>;
}
