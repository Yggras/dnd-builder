import { useQuery } from '@tanstack/react-query';

import { SQLiteContentRepository } from '@/features/content/adapters/SQLiteContentRepository';
import { CompendiumService } from '@/features/compendium/services/CompendiumService';
import { queryKeys } from '@/shared/query/keys';

const compendiumService = new CompendiumService(new SQLiteContentRepository());

export function useCompendiumEntry(entryId: string) {
  return useQuery({
    queryKey: queryKeys.compendiumEntry(entryId),
    queryFn: () => compendiumService.getEntryById(entryId),
    enabled: Boolean(entryId),
  });
}
