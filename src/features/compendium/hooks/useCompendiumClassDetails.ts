import { useQuery } from '@tanstack/react-query';

import { SQLiteContentRepository } from '@/features/content/adapters/SQLiteContentRepository';
import { ContentService } from '@/features/content/services/ContentService';
import { queryKeys } from '@/shared/query/keys';

const contentService = new ContentService(new SQLiteContentRepository());

export function useCompendiumClassDetails(classId: string) {
  const classesQuery = useQuery({
    queryKey: queryKeys.compendiumClass(classId),
    queryFn: () => contentService.getContentEntitiesByIds([classId]),
    enabled: Boolean(classId),
  });

  const subclassesQuery = useQuery({
    queryKey: queryKeys.compendiumSubclasses(classId),
    queryFn: () => contentService.browseSubclasses(classId),
    enabled: Boolean(classId),
  });

  return {
    classEntity: classesQuery.data?.[0] ?? null,
    subclasses: subclassesQuery.data ?? [],
    isLoading: classesQuery.isLoading || subclassesQuery.isLoading,
    isFetching: classesQuery.isFetching || subclassesQuery.isFetching,
    error: classesQuery.error ?? subclassesQuery.error,
  };
}
