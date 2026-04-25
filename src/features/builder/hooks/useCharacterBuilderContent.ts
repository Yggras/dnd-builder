import { useMemo } from 'react';

import { useQueries, useQuery } from '@tanstack/react-query';

import type { BuilderCharacterBuild, BuilderDraftPayload } from '@/features/builder/types';
import { buildBuilderEntityIndex } from '@/features/builder/utils/review';
import { SQLiteContentRepository } from '@/features/content/adapters/SQLiteContentRepository';
import { ContentService } from '@/features/content/services/ContentService';
import type { ChoiceGrant, ContentEntity } from '@/shared/types/domain';

const contentService = new ContentService(new SQLiteContentRepository());

type UseCharacterBuilderContentOptions = {
  draftBuild: BuilderCharacterBuild | null;
  inventorySearch: string;
};

export function useCharacterBuilderContent({ draftBuild, inventorySearch }: UseCharacterBuilderContentOptions) {
  const classesQuery = useQuery({
    queryKey: ['builder', 'classes'],
    queryFn: () => contentService.listClasses(),
  });
  const speciesQuery = useQuery({
    queryKey: ['builder', 'species'],
    queryFn: () => contentService.listSpecies(),
  });
  const backgroundsQuery = useQuery({
    queryKey: ['builder', 'backgrounds'],
    queryFn: () => contentService.listBackgrounds(),
  });
  const featsQuery = useQuery({
    queryKey: ['builder', 'feats', 'all'],
    queryFn: () => contentService.listFeats(undefined),
  });
  const allItemsQuery = useQuery({
    queryKey: ['builder', 'items', 'all'],
    queryFn: () => contentService.listItems({ query: '' }),
  });
  const itemSearchQuery = useQuery({
    queryKey: ['builder', 'items', 'search', inventorySearch.trim()],
    queryFn: () => contentService.listItems({ query: inventorySearch.trim() }),
    enabled: inventorySearch.trim().length > 0,
  });
  const allSpellsQuery = useQuery({
    queryKey: ['builder', 'spells', 'all'],
    queryFn: () => contentService.listSpells({ query: '' }),
  });

  const selectedClassIds = useMemo(() => {
    if (!draftBuild) {
      return [] as string[];
    }

    return draftBuild.payload.classStep.allocations.map((allocation) => allocation.classId).filter(Boolean);
  }, [draftBuild]);

  const subclassesQueries = useQueries({
    queries: selectedClassIds.map((classId) => ({
      queryKey: ['builder', 'subclasses', classId],
      queryFn: () => contentService.listSubclasses(classId),
      enabled: Boolean(classId),
    })),
  });

  const grantsQueries = useQueries({
    queries: selectedClassIds.map((classId) => ({
      queryKey: ['builder', 'grants', classId],
      queryFn: () => contentService.listChoiceGrants(classId),
      enabled: Boolean(classId),
    })),
  });

  const classEntitiesById = useMemo(
    () => Object.fromEntries((classesQuery.data ?? []).map((classEntity) => [classEntity.id, classEntity])) as Record<string, ContentEntity>,
    [classesQuery.data],
  );
  const speciesEntitiesById = useMemo(
    () => Object.fromEntries((speciesQuery.data ?? []).map((entity) => [entity.id, entity])) as Record<string, ContentEntity>,
    [speciesQuery.data],
  );
  const backgroundEntitiesById = useMemo(
    () => Object.fromEntries((backgroundsQuery.data ?? []).map((entity) => [entity.id, entity])) as Record<string, ContentEntity>,
    [backgroundsQuery.data],
  );
  const featEntitiesById = useMemo(
    () => Object.fromEntries((featsQuery.data ?? []).map((entity) => [entity.id, entity])) as Record<string, ContentEntity>,
    [featsQuery.data],
  );
  const itemEntitiesById = useMemo(
    () => Object.fromEntries((allItemsQuery.data ?? []).map((entity) => [entity.id, entity])) as Record<string, ContentEntity>,
    [allItemsQuery.data],
  );
  const spellEntitiesById = useMemo(
    () => Object.fromEntries((allSpellsQuery.data ?? []).map((entity) => [entity.id, entity])) as Record<string, ContentEntity>,
    [allSpellsQuery.data],
  );

  const subclassesByClassId = useMemo(() => {
    return Object.fromEntries(
      selectedClassIds.map((classId, index) => [classId, subclassesQueries[index]?.data ?? []]),
    ) as Record<string, ContentEntity[]>;
  }, [selectedClassIds, subclassesQueries]);
  const subclassEntitiesById = useMemo(
    () =>
      Object.fromEntries(Object.values(subclassesByClassId).flat().map((entity) => [entity.id, entity])) as Record<
        string,
        ContentEntity
      >,
    [subclassesByClassId],
  );

  const grantsByClassId = useMemo(() => {
    return Object.fromEntries(selectedClassIds.map((classId, index) => [classId, grantsQueries[index]?.data ?? []])) as Record<
      string,
      ChoiceGrant[]
    >;
  }, [selectedClassIds, grantsQueries]);

  const applicableGrants = useMemo(() => {
    if (!draftBuild) {
      return [] as ChoiceGrant[];
    }

    return draftBuild.payload.classStep.allocations.flatMap((allocation) => {
      if (!allocation.classId) {
        return [] as ChoiceGrant[];
      }

      return (grantsByClassId[allocation.classId] ?? []).filter(
        (grant) => grant.visibility === 'builder' && grant.atLevel <= allocation.level,
      );
    });
  }, [draftBuild, grantsByClassId]);

  const featGrantCategories = useMemo(
    () => Array.from(new Set(applicableGrants.filter((grant) => grant.chooseKind === 'feat').flatMap((grant) => grant.categoryFilter))),
    [applicableGrants],
  );
  const optionalFeatureGrantCategories = useMemo(
    () =>
      Array.from(
        new Set(
          applicableGrants
            .filter((grant) => grant.chooseKind === 'optionalfeature')
            .flatMap((grant) => grant.categoryFilter),
        ),
      ),
    [applicableGrants],
  );

  const featCategoryQueries = useQueries({
    queries: featGrantCategories.map((categoryTag) => ({
      queryKey: ['builder', 'grant-options', 'feat', categoryTag],
      queryFn: () => contentService.listFeats(categoryTag),
    })),
  });

  const optionalFeatureCategoryQueries = useQueries({
    queries: optionalFeatureGrantCategories.map((categoryTag) => ({
      queryKey: ['builder', 'grant-options', 'optionalfeature', categoryTag],
      queryFn: () => contentService.listOptionalFeatures(categoryTag),
    })),
  });

  const featOptionsByCategory = useMemo(() => {
    return Object.fromEntries(featGrantCategories.map((category, index) => [category, featCategoryQueries[index]?.data ?? []])) as Record<
      string,
      ContentEntity[]
    >;
  }, [featGrantCategories, featCategoryQueries]);

  const optionalFeatureOptionsByCategory = useMemo(() => {
    return Object.fromEntries(
      optionalFeatureGrantCategories.map((category, index) => [category, optionalFeatureCategoryQueries[index]?.data ?? []]),
    ) as Record<string, ContentEntity[]>;
  }, [optionalFeatureGrantCategories, optionalFeatureCategoryQueries]);

  const grantOptionsByGrantId = useMemo(() => {
    return Object.fromEntries(
      applicableGrants.map((grant) => {
        const sourceMap = grant.chooseKind === 'feat' ? featOptionsByCategory : optionalFeatureOptionsByCategory;
        const options = grant.categoryFilter.flatMap((categoryFilter) => sourceMap[categoryFilter] ?? []);
        const dedupedOptions = Array.from(new Map(options.map((option) => [option.id, option])).values());
        return [grant.id, dedupedOptions];
      }),
    ) as Record<string, ContentEntity[]>;
  }, [applicableGrants, featOptionsByCategory, optionalFeatureOptionsByCategory]);

  const allEntitiesById = useMemo(
    () =>
      buildBuilderEntityIndex({
        classEntitiesById,
        speciesEntitiesById,
        backgroundEntitiesById,
        featEntitiesById,
        itemEntitiesById,
        spellEntitiesById,
        subclassEntitiesById,
        grantOptionsByGrantId,
      }),
    [
      backgroundEntitiesById,
      classEntitiesById,
      featEntitiesById,
      grantOptionsByGrantId,
      itemEntitiesById,
      speciesEntitiesById,
      spellEntitiesById,
      subclassEntitiesById,
    ],
  );

  return {
    allItemsQuery,
    allSpellsQuery,
    allEntitiesById,
    applicableGrants,
    backgroundEntitiesById,
    backgroundsQuery,
    classEntitiesById,
    classesQuery,
    featEntitiesById,
    featsQuery,
    grantOptionsByGrantId,
    grantsByClassId,
    itemEntitiesById,
    itemSearchQuery,
    selectedClassIds,
    speciesEntitiesById,
    speciesQuery,
    spellEntitiesById,
    subclassEntitiesById,
    subclassesByClassId,
  };
}
