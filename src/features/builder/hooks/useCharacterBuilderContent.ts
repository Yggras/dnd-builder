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
  const asiFeatsQuery = useQuery({
    queryKey: ['builder', 'feats', 'asi'],
    queryFn: () => contentService.listAsiFeats(),
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
  const asiFeatEntitiesById = useMemo(
    () => Object.fromEntries((asiFeatsQuery.data ?? []).map((entity) => [entity.id, entity])) as Record<string, ContentEntity>,
    [asiFeatsQuery.data],
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
        if (grant.chooseKind === 'classFeatureOption' && grant.options && grant.options.length > 0) {
          const syntheticOptions: ContentEntity[] = grant.options.map((option) => ({
            id: `${grant.id}::${option.name}`,
            entityType: 'optionalfeature' as const,
            parentEntityId: null,
            name: option.name,
            sourceCode: '',
            sourceName: grant.sourceName,
            rulesEdition: '2024' as const,
            isLegacy: false,
            isPrimary2024: true,
            isSelectableInBuilder: true,
            searchText: option.name,
            summary: option.description || null,
            categoryTags: [],
            metadata: {},
            renderPayload: null,
            updatedAt: '',
          }));
          return [grant.id, syntheticOptions];
        }

        if (grant.chooseKind === 'expertise') {
          const allocation = draftBuild?.payload.classStep.allocations.find(
            (alloc) => alloc.classId === grant.sourceId,
          );
          if (!allocation) {
            return [grant.id, []];
          }

          const classEntity = classEntitiesById[allocation.classId];
          const startingProficiencies = classEntity?.metadata.startingProficiencies;
          const skillEntries = startingProficiencies && typeof startingProficiencies === 'object'
            ? (startingProficiencies as { skills?: unknown }).skills
            : null;

          const classSkillOptions = new Set<string>();
          if (Array.isArray(skillEntries)) {
            for (const entry of skillEntries) {
              if (entry && typeof entry === 'object') {
                const choose = (entry as { choose?: { from?: unknown[] } }).choose;
                if (choose && Array.isArray(choose.from)) {
                  for (const skill of choose.from) {
                    if (typeof skill === 'string') {
                      classSkillOptions.add(skill);
                    }
                  }
                }
              }
            }
          }

          const selectedClassSkills = new Set(
            (draftBuild?.payload.classStep.skillProficiencies ?? [])
              .filter((sel) => sel.classId === allocation.classId)
              .flatMap((sel) => sel.selectedSkills),
          );

          const backgroundId = draftBuild?.payload.backgroundStep.backgroundId;
          const backgroundEntity = backgroundId ? backgroundEntitiesById[backgroundId] : null;
          const backgroundSkills = new Set<string>();
          if (backgroundEntity) {
            const bgSkillProfs = backgroundEntity.metadata.skillProficiencies;
            if (Array.isArray(bgSkillProfs)) {
              for (const entry of bgSkillProfs) {
                if (entry && typeof entry === 'object') {
                  for (const [skill, value] of Object.entries(entry as Record<string, unknown>)) {
                    if (value === true && skill !== 'choose') {
                      backgroundSkills.add(skill);
                    }
                  }
                }
              }
            }
          }

          const proficientSkills = new Set([...selectedClassSkills, ...backgroundSkills]);

          const alreadyExpertiseGrantIds = applicableGrants
            .filter((g) => g.chooseKind === 'expertise' && g.sourceId === grant.sourceId && g.id !== grant.id && g.atLevel < grant.atLevel);
          const alreadyExpertiseSkills = new Set(
            alreadyExpertiseGrantIds.flatMap((g) => {
              const selection = draftBuild?.payload.classStep.featureChoices.find((sel) => sel.grantId === g.id);
              return (selection?.selectedOptionIds ?? []).map((optionId) => {
                const parts = optionId.split('::');
                return parts[parts.length - 1] ?? '';
              });
            }),
          );

          const SKILL_LABELS: Record<string, string> = {
            acrobatics: 'Acrobatics',
            animalHandling: 'Animal Handling',
            arcana: 'Arcana',
            athletics: 'Athletics',
            deception: 'Deception',
            history: 'History',
            insight: 'Insight',
            intimidation: 'Intimidation',
            investigation: 'Investigation',
            medicine: 'Medicine',
            nature: 'Nature',
            perception: 'Perception',
            performance: 'Performance',
            persuasion: 'Persuasion',
            religion: 'Religion',
            sleightOfHand: 'Sleight of Hand',
            stealth: 'Stealth',
            survival: 'Survival',
          };

          const syntheticOptions: ContentEntity[] = Array.from(proficientSkills)
            .filter((skill) => !alreadyExpertiseSkills.has(skill))
            .sort()
            .map((skill) => ({
              id: `${grant.id}::${skill}`,
              entityType: 'optionalfeature' as const,
              parentEntityId: null,
              name: SKILL_LABELS[skill] ?? skill,
              sourceCode: '',
              sourceName: grant.sourceName,
              rulesEdition: '2024' as const,
              isLegacy: false,
              isPrimary2024: true,
              isSelectableInBuilder: true,
              searchText: skill,
              summary: `Gain Expertise in ${SKILL_LABELS[skill] ?? skill}`,
              categoryTags: [],
              metadata: {},
              renderPayload: null,
              updatedAt: '',
            }));
          return [grant.id, syntheticOptions];
        }

        const sourceMap = grant.chooseKind === 'feat' ? featOptionsByCategory : optionalFeatureOptionsByCategory;
        const options = grant.categoryFilter.flatMap((categoryFilter) => sourceMap[categoryFilter] ?? []);
        const dedupedOptions = Array.from(new Map(options.map((option) => [option.id, option])).values());
        return [grant.id, dedupedOptions];
      }),
    ) as Record<string, ContentEntity[]>;
  }, [applicableGrants, featOptionsByCategory, optionalFeatureOptionsByCategory, draftBuild, classEntitiesById, backgroundEntitiesById]);

  const asiFeatOptions = useMemo(() => asiFeatsQuery.data ?? [], [asiFeatsQuery.data]);

  const allEntitiesById = useMemo(
    () =>
      buildBuilderEntityIndex({
        classEntitiesById,
        speciesEntitiesById,
        backgroundEntitiesById,
        featEntitiesById: { ...featEntitiesById, ...asiFeatEntitiesById },
        itemEntitiesById,
        spellEntitiesById,
        subclassEntitiesById,
        grantOptionsByGrantId,
      }),
    [
      backgroundEntitiesById,
      asiFeatEntitiesById,
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
    asiFeatsQuery,
    applicableGrants,
    asiFeatOptions,
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
