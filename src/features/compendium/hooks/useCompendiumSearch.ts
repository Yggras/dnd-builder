import { useDeferredValue, useState } from 'react';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { SQLiteContentRepository } from '@/features/content/adapters/SQLiteContentRepository';
import { CompendiumService } from '@/features/compendium/services/CompendiumService';
import { queryKeys } from '@/shared/query/keys';

const compendiumService = new CompendiumService(new SQLiteContentRepository());

export type CompendiumEntryTypeFilter =
  | 'all'
  | 'species'
  | 'class'
  | 'subclass'
  | 'background'
  | 'feat'
  | 'optionalfeature'
  | 'spell'
  | 'equipment'
  | 'magicitem';

export function useCompendiumSearch() {
  const [query, setQuery] = useState('');
  const [entryType, setEntryType] = useState<CompendiumEntryTypeFilter>('all');
  const deferredQuery = useDeferredValue(query.trim());

  const resultsQuery = useQuery({
    queryKey: queryKeys.compendiumSearch(deferredQuery, entryType),
    queryFn: () => compendiumService.searchEntries(deferredQuery, entryType === 'all' ? undefined : entryType),
    placeholderData: keepPreviousData,
  });

  return {
    query,
    setQuery,
    entryType,
    setEntryType,
    deferredQuery,
    ...resultsQuery,
  };
}
