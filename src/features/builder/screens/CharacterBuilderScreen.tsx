import { useEffect, useMemo, useRef, useState } from 'react';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQueries, useQuery } from '@tanstack/react-query';

import { BuilderService } from '@/features/builder/services/BuilderService';
import type { BuilderDraftPayload } from '@/features/builder/types';
import {
  getGrantSelectionCount,
  getGrantTitle,
  getSubclassUnlockLevel,
  getSubclassUnlockLabel,
  reconcileClassStepPayload,
} from '@/features/builder/utils/classStep';
import {
  countAvailableAsiPoints,
  normalizeAbilityChoices,
  reconcileOriginAndAbilitiesPayload,
} from '@/features/builder/utils/originAndAbilities';
import { getStartingEquipmentOptionGroups, seedStartingEquipment } from '@/features/builder/utils/inventory';
import { deriveSourceSummary, mergeReviewIssues, summarizeSpellcasting } from '@/features/builder/utils/spellReview';
import { SQLiteContentRepository } from '@/features/content/adapters/SQLiteContentRepository';
import { ContentService } from '@/features/content/services/ContentService';
import { useCharacterRecord } from '@/features/characters/hooks/useCharacterRecord';
import { useSaveCharacterBuild } from '@/features/characters/hooks/useSaveCharacterBuild';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { Screen } from '@/shared/ui/Screen';
import type { ChoiceGrant, ContentEntity, BuilderStep, CharacterBuild } from '@/shared/types/domain';
import { theme, typography } from '@/shared/ui/theme';

const builderService = new BuilderService();
const contentService = new ContentService(new SQLiteContentRepository());

function buildClassAllocationId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `allocation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isBuilderDraftPayload(value: Record<string, unknown>): value is BuilderDraftPayload {
  return typeof value.version === 'number' && value.version === 1;
}

function formatStepLabel(step: BuilderStep) {
  return step.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

export function CharacterBuilderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ characterId?: string | string[] }>();
  const characterId = Array.isArray(params.characterId) ? params.characterId[0] : params.characterId ?? '';
  const { data, error, isLoading } = useCharacterRecord(characterId);
  const saveBuildMutation = useSaveCharacterBuild();
  const [draftBuild, setDraftBuild] = useState<CharacterBuild | null>(null);
  const lastSavedSnapshot = useRef<string | null>(null);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [classImpactSummary, setClassImpactSummary] = useState<string | null>(null);
  const [originImpactSummary, setOriginImpactSummary] = useState<string | null>(null);
  const [inventoryImpactSummary, setInventoryImpactSummary] = useState<string | null>(null);
  const [inventorySearch, setInventorySearch] = useState('');
  const [spellSearch, setSpellSearch] = useState('');
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);

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
    if (!draftBuild || !isBuilderDraftPayload(draftBuild.payload)) {
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

  const grantsByClassId = useMemo(() => {
    return Object.fromEntries(selectedClassIds.map((classId, index) => [classId, grantsQueries[index]?.data ?? []])) as Record<
      string,
      ChoiceGrant[]
    >;
  }, [selectedClassIds, grantsQueries]);

  const applicableGrants = useMemo(() => {
    if (!draftBuild || !isBuilderDraftPayload(draftBuild.payload)) {
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

  const featCategoryQueries = useQueries({
    queries: Array.from(
      new Set(applicableGrants.filter((grant) => grant.chooseKind === 'feat').flatMap((grant) => grant.categoryFilter)),
    ).map((categoryTag) => ({
      queryKey: ['builder', 'grant-options', 'feat', categoryTag],
      queryFn: () => contentService.listFeats(categoryTag),
    })),
  });

  const optionalFeatureCategoryQueries = useQueries({
    queries: Array.from(
      new Set(applicableGrants.filter((grant) => grant.chooseKind === 'optionalfeature').flatMap((grant) => grant.categoryFilter)),
    ).map((categoryTag) => ({
      queryKey: ['builder', 'grant-options', 'optionalfeature', categoryTag],
      queryFn: () => contentService.listOptionalFeatures(categoryTag),
    })),
  });

  const featOptionsByCategory = useMemo(() => {
    const categories = Array.from(
      new Set(applicableGrants.filter((grant) => grant.chooseKind === 'feat').flatMap((grant) => grant.categoryFilter)),
    );
    return Object.fromEntries(categories.map((category, index) => [category, featCategoryQueries[index]?.data ?? []])) as Record<
      string,
      ContentEntity[]
    >;
  }, [applicableGrants, featCategoryQueries]);

  const optionalFeatureOptionsByCategory = useMemo(() => {
    const categories = Array.from(
      new Set(applicableGrants.filter((grant) => grant.chooseKind === 'optionalfeature').flatMap((grant) => grant.categoryFilter)),
    );
    return Object.fromEntries(
      categories.map((category, index) => [category, optionalFeatureCategoryQueries[index]?.data ?? []]),
    ) as Record<string, ContentEntity[]>;
  }, [applicableGrants, optionalFeatureCategoryQueries]);

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

  useEffect(() => {
    if (!data?.character || !data.build) {
      return;
    }

    const syncedBuild = {
      ...data.build,
      payload: isBuilderDraftPayload(data.build.payload)
        ? data.build.payload
        : builderService.createEmptyDraftPayload(data.character.name),
    } satisfies CharacterBuild;

    setDraftBuild(syncedBuild);
    lastSavedSnapshot.current = JSON.stringify(syncedBuild);
  }, [data]);

  useEffect(() => {
    if (!draftBuild) {
      return;
    }

    const nextSnapshot = JSON.stringify(draftBuild);

    if (nextSnapshot === lastSavedSnapshot.current) {
      return;
    }

    const timeoutId = setTimeout(() => {
      lastSavedSnapshot.current = nextSnapshot;
      saveBuildMutation.mutate(draftBuild, {
        onError: () => {
          lastSavedSnapshot.current = null;
        },
      });
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [draftBuild, saveBuildMutation]);

  useEffect(() => {
    if (!draftBuild || !isBuilderDraftPayload(draftBuild.payload) || classesQuery.isLoading) {
      return;
    }

    const { payload: reconciledPayload } = reconcileClassStepPayload({
      payload: draftBuild.payload,
      classEntitiesById,
      grantsByClassId,
      grantOptionsByGrantId,
    });

    const currentIssuesSnapshot = JSON.stringify(draftBuild.payload.review.issues);
    const nextIssuesSnapshot = JSON.stringify(reconciledPayload.review.issues);

    if (currentIssuesSnapshot === nextIssuesSnapshot) {
      return;
    }

    setDraftBuild({
      ...draftBuild,
      payload: reconciledPayload,
    });
  }, [draftBuild, classesQuery.isLoading, classEntitiesById, grantsByClassId, grantOptionsByGrantId]);

  useEffect(() => {
    if (
      !draftBuild ||
      !isBuilderDraftPayload(draftBuild.payload) ||
      classesQuery.isLoading ||
      speciesQuery.isLoading ||
      backgroundsQuery.isLoading ||
      featsQuery.isLoading
    ) {
      return;
    }

    const { payload: reconciledPayload } = reconcileOriginAndAbilitiesPayload({
      payload: draftBuild.payload,
      classEntitiesById,
      speciesEntitiesById,
      backgroundEntitiesById,
      featEntitiesById,
    });

    const currentIssuesSnapshot = JSON.stringify(draftBuild.payload.review.issues);
    const nextIssuesSnapshot = JSON.stringify(reconciledPayload.review.issues);
    const currentAbilitySnapshot = JSON.stringify(draftBuild.payload.abilityPointsStep);
    const nextAbilitySnapshot = JSON.stringify(reconciledPayload.abilityPointsStep);
    const currentSpeciesSnapshot = JSON.stringify(draftBuild.payload.speciesStep);
    const nextSpeciesSnapshot = JSON.stringify(reconciledPayload.speciesStep);
    const currentBackgroundSnapshot = JSON.stringify(draftBuild.payload.backgroundStep);
    const nextBackgroundSnapshot = JSON.stringify(reconciledPayload.backgroundStep);

    if (
      currentIssuesSnapshot === nextIssuesSnapshot &&
      currentAbilitySnapshot === nextAbilitySnapshot &&
      currentSpeciesSnapshot === nextSpeciesSnapshot &&
      currentBackgroundSnapshot === nextBackgroundSnapshot
    ) {
      return;
    }

    setDraftBuild({
      ...draftBuild,
      payload: reconciledPayload,
    });
  }, [
    draftBuild,
    classesQuery.isLoading,
    speciesQuery.isLoading,
    backgroundsQuery.isLoading,
    featsQuery.isLoading,
    classEntitiesById,
    speciesEntitiesById,
    backgroundEntitiesById,
    featEntitiesById,
  ]);

  const validationSummary = useMemo(() => {
    if (!draftBuild || !isBuilderDraftPayload(draftBuild.payload)) {
      return null;
    }

    return builderService.summarizeIssues(draftBuild.payload.review.issues);
  }, [draftBuild]);

  if (isLoading) {
    return <LoadingState label="Loading builder draft..." />;
  }

  if (classesQuery.isLoading) {
    return <LoadingState label="Loading builder class options..." />;
  }

  if (speciesQuery.isLoading || backgroundsQuery.isLoading || featsQuery.isLoading) {
    return <LoadingState label="Loading origin and feat options..." />;
  }

  if (allItemsQuery.isLoading) {
    return <LoadingState label="Loading inventory options..." />;
  }

  if (allSpellsQuery.isLoading) {
    return <LoadingState label="Loading spell options..." />;
  }

  if (error) {
    return <ErrorState title="Builder unavailable" message={error instanceof Error ? error.message : 'Failed to load builder draft.'} />;
  }

  if (classesQuery.error) {
    return (
      <ErrorState
        title="Class content unavailable"
        message={classesQuery.error instanceof Error ? classesQuery.error.message : 'Failed to load class content.'}
      />
    );
  }

  if (speciesQuery.error || backgroundsQuery.error || featsQuery.error) {
    const firstError = speciesQuery.error ?? backgroundsQuery.error ?? featsQuery.error;
    return <ErrorState title="Origin content unavailable" message={firstError instanceof Error ? firstError.message : 'Failed to load origin content.'} />;
  }

  if (allItemsQuery.error) {
    return <ErrorState title="Inventory content unavailable" message={allItemsQuery.error instanceof Error ? allItemsQuery.error.message : 'Failed to load inventory content.'} />;
  }

  if (allSpellsQuery.error) {
    return <ErrorState title="Spell content unavailable" message={allSpellsQuery.error instanceof Error ? allSpellsQuery.error.message : 'Failed to load spell content.'} />;
  }

  if (!data?.character || !data.build || !draftBuild || !isBuilderDraftPayload(draftBuild.payload)) {
    return <ErrorState title="Draft unavailable" message="The requested character draft could not be loaded from the local roster." />;
  }

  const payload = draftBuild.payload;

  const applyClassPayloadChange = (nextPayload: BuilderDraftPayload) => {
    const { payload: reconciledPayload, impactSummary } = reconcileClassStepPayload({
      payload: nextPayload,
      classEntitiesById,
      grantsByClassId,
      grantOptionsByGrantId,
    });

    setDraftBuild({
      ...draftBuild,
      currentStep: 'class',
      payload: reconciledPayload,
    });
    setClassImpactSummary(impactSummary);
  };

  const updateCurrentStep = (step: BuilderStep) => {
    setDraftBuild((currentBuild) => (currentBuild ? { ...currentBuild, currentStep: step } : currentBuild));
  };

  const applyOriginPayloadChange = (nextPayload: BuilderDraftPayload) => {
    const { payload: reconciledPayload, impactSummary } = reconcileOriginAndAbilitiesPayload({
      payload: nextPayload,
      classEntitiesById,
      speciesEntitiesById,
      backgroundEntitiesById,
      featEntitiesById,
    });

    setDraftBuild({
      ...draftBuild,
      payload: reconciledPayload,
    });
    setOriginImpactSummary(impactSummary);
  };

  const updateCharacterName = (name: string) => {
    setDraftBuild((currentBuild) => {
      if (!currentBuild || !isBuilderDraftPayload(currentBuild.payload)) {
        return currentBuild;
      }

      return {
        ...currentBuild,
        payload: {
          ...currentBuild.payload,
          characteristicsStep: {
            ...currentBuild.payload.characteristicsStep,
            name,
          },
        },
      };
    });
  };

  const updateNotes = (notes: string) => {
    setDraftBuild((currentBuild) => {
      if (!currentBuild || !isBuilderDraftPayload(currentBuild.payload)) {
        return currentBuild;
      }

      return {
        ...currentBuild,
        payload: {
          ...currentBuild.payload,
          notesStep: {
            notes,
          },
        },
      };
    });
  };

  const addClassAllocation = (classId: string) => {
    applyClassPayloadChange({
      ...payload,
      classStep: {
        ...payload.classStep,
        allocations: [
          ...payload.classStep.allocations,
          {
            id: buildClassAllocationId(),
            classId,
            level: 1,
            subclassId: null,
          },
        ],
      },
    });
    setShowClassPicker(false);
  };

  const updateAllocation = (allocationId: string, updater: (current: BuilderDraftPayload['classStep']['allocations'][number]) => BuilderDraftPayload['classStep']['allocations'][number]) => {
    applyClassPayloadChange({
      ...payload,
      classStep: {
        ...payload.classStep,
        allocations: payload.classStep.allocations.map((allocation) =>
          allocation.id === allocationId ? updater(allocation) : allocation,
        ),
      },
    });
  };

  const removeAllocation = (allocationId: string) => {
    applyClassPayloadChange({
      ...payload,
      classStep: {
        ...payload.classStep,
        allocations: payload.classStep.allocations.filter((allocation) => allocation.id !== allocationId),
      },
    });
  };

  const updateFeatureSelection = (grantId: string, optionId: string, count: number) => {
    const existingSelection = payload.classStep.featureChoices.find((selection) => selection.grantId === grantId);
    const alreadySelected = existingSelection?.selectedOptionIds.includes(optionId) ?? false;
    const nextSelectedOptionIds = alreadySelected
      ? (existingSelection?.selectedOptionIds ?? []).filter((selectedOptionId) => selectedOptionId !== optionId)
      : [...(existingSelection?.selectedOptionIds ?? []), optionId].slice(0, count);

    applyClassPayloadChange({
      ...payload,
      classStep: {
        ...payload.classStep,
        featureChoices: [
          ...payload.classStep.featureChoices.filter((selection) => selection.grantId !== grantId),
          {
            grantId,
            selectedOptionIds: nextSelectedOptionIds,
          },
        ].filter((selection) => selection.selectedOptionIds.length > 0),
      },
    });
  };

  const totalAllocatedLevel = payload.classStep.allocations.reduce((sum, allocation) => sum + allocation.level, 0);
  const availableClasses = (classesQuery.data ?? []).filter(
    (classEntity) => !payload.classStep.allocations.some((allocation) => allocation.classId === classEntity.id),
  );
  const selectedSpecies = payload.speciesStep.speciesId ? speciesEntitiesById[payload.speciesStep.speciesId] : null;
  const selectedBackground = payload.backgroundStep.backgroundId ? backgroundEntitiesById[payload.backgroundStep.backgroundId] : null;
  const speciesAbilityRequirements = selectedSpecies
    ? normalizeAbilityChoices('species', selectedSpecies.id, selectedSpecies.metadata.ability)
    : null;
  const backgroundAbilityRequirements = selectedBackground
    ? normalizeAbilityChoices('background', selectedBackground.id, selectedBackground.metadata.ability)
    : null;
  const availableAsiPoints = countAvailableAsiPoints(payload, classEntitiesById);
  const spentAsiPoints = payload.abilityPointsStep.bonusSelections
    .filter((selection) => selection.sourceType === 'asi')
    .reduce((sum, selection) => sum + selection.amount, 0);
  const spellSummary = summarizeSpellcasting(payload, classEntitiesById, spellEntitiesById);
  const visibleSpellResults = Object.values(spellEntitiesById)
    .filter((spell) => spellSummary.applicableSpellIds.includes(spell.id))
    .filter((spell) => Number(spell.metadata.level ?? 0) <= spellSummary.maxSpellLevel)
    .filter((spell) => (spellSearch.trim() ? spell.searchText.toLowerCase().includes(spellSearch.trim().toLowerCase()) : true))
    .slice(0, 18);
  const allEntitiesById = {
    ...classEntitiesById,
    ...speciesEntitiesById,
    ...backgroundEntitiesById,
    ...featEntitiesById,
    ...itemEntitiesById,
    ...spellEntitiesById,
    ...Object.fromEntries(Object.values(subclassesByClassId).flat().map((entity) => [entity.id, entity])),
    ...Object.fromEntries(Object.values(grantOptionsByGrantId).flat().map((entity) => [entity.id, entity])),
  } satisfies Record<string, ContentEntity>;

  useEffect(() => {
    if (!draftBuild || !isBuilderDraftPayload(draftBuild.payload) || allSpellsQuery.isLoading) {
      return;
    }

    const nextIssues = mergeReviewIssues(draftBuild.payload, spellSummary.issues);
    const nextSourceSummary = deriveSourceSummary(draftBuild.payload, allEntitiesById);
    const issuesSnapshot = JSON.stringify(draftBuild.payload.review.issues);
    const nextIssuesSnapshot = JSON.stringify(nextIssues);
    const sourceSummarySnapshot = JSON.stringify(draftBuild.payload.review.sourceSummary);
    const nextSourceSummarySnapshot = JSON.stringify(nextSourceSummary);

    if (issuesSnapshot === nextIssuesSnapshot && sourceSummarySnapshot === nextSourceSummarySnapshot) {
      if (draftBuild.buildState === 'complete' && builderService.canComplete(draftBuild.payload.review.issues) === false) {
        setDraftBuild({
          ...draftBuild,
          buildState: 'draft',
        });
      }

      return;
    }

    const nextPayload: BuilderDraftPayload = {
      ...draftBuild.payload,
      review: {
        issues: nextIssues,
        sourceSummary: nextSourceSummary,
      },
    };

    setDraftBuild({
      ...draftBuild,
      buildState: draftBuild.buildState === 'complete' && builderService.canComplete(nextIssues) ? 'complete' : 'draft',
      payload: nextPayload,
    });
  }, [draftBuild, allSpellsQuery.isLoading, spellSummary, allEntitiesById]);

  const updateOriginAbilitySelection = (
    sourceType: 'species' | 'background',
    sourceId: string,
    ability: string,
    amount: number,
    allowMultiple: boolean,
  ) => {
    const existingSelections = payload.abilityPointsStep.bonusSelections.filter(
      (selection) => !(selection.sourceType === sourceType && selection.sourceId === sourceId && selection.amount === amount),
    );
    const currentlySelected = payload.abilityPointsStep.bonusSelections.some(
      (selection) =>
        selection.sourceType === sourceType && selection.sourceId === sourceId && selection.amount === amount && selection.ability === ability,
    );

    applyOriginPayloadChange({
      ...payload,
      currentStep: payload.currentStep,
      abilityPointsStep: {
        ...payload.abilityPointsStep,
        bonusSelections: currentlySelected
          ? existingSelections
          : [
              ...existingSelections,
              ...(allowMultiple
                ? [
                    {
                      sourceType,
                      sourceId,
                      ability,
                      amount,
                    },
                  ]
                : [
                    {
                      sourceType,
                      sourceId,
                      ability,
                      amount,
                    },
                  ]),
            ],
      },
    });
  };

  const updateGrantedFeatSelection = (sourceKey: 'speciesStep' | 'backgroundStep', sourceId: string, featId: string) => {
    applyOriginPayloadChange({
      ...payload,
      [sourceKey]: {
        ...payload[sourceKey],
        grantedFeatSelections: [{ sourceId, selectedFeatId: featId }],
      },
    } as BuilderDraftPayload);
  };

  const updateBaseAbilityScore = (ability: string, value: string) => {
    const parsedValue = Number.parseInt(value, 10);
    applyOriginPayloadChange({
      ...payload,
      abilityPointsStep: {
        ...payload.abilityPointsStep,
        baseScores: {
          ...payload.abilityPointsStep.baseScores,
          [ability]: Number.isFinite(parsedValue) ? parsedValue : 0,
        },
      },
    });
  };

  const updateAsiPoint = (ability: string, delta: number) => {
    const currentPoints = payload.abilityPointsStep.bonusSelections.filter(
      (selection) => selection.sourceType === 'asi' && selection.ability === ability,
    ).length;

    if (delta > 0 && spentAsiPoints >= availableAsiPoints) {
      return;
    }

    const retainedSelections = payload.abilityPointsStep.bonusSelections.filter(
      (selection, index, selections) =>
        !(
          selection.sourceType === 'asi' &&
          selection.ability === ability &&
          delta < 0 &&
          index === selections.findIndex((candidate) => candidate.sourceType === 'asi' && candidate.ability === ability)
        ),
    );

    applyOriginPayloadChange({
      ...payload,
      abilityPointsStep: {
        ...payload.abilityPointsStep,
        bonusSelections:
          delta > 0
            ? [
                ...payload.abilityPointsStep.bonusSelections,
                {
                  sourceType: 'asi',
                  sourceId: 'asi',
                  ability,
                  amount: 1,
                },
              ]
            : currentPoints > 0
              ? retainedSelections
              : payload.abilityPointsStep.bonusSelections,
      },
    });
  };

  const startingEquipmentOptionGroups = getStartingEquipmentOptionGroups(payload, classEntitiesById, backgroundEntitiesById);
  const itemSearchResults = inventorySearch.trim().length > 0 ? itemSearchQuery.data ?? [] : [];

  const updateStartingEquipmentChoice = (
    sourceType: 'class' | 'background',
    sourceId: string,
    bundleIndex: number,
    optionKey: string,
  ) => {
    setDraftBuild((currentBuild) => {
      if (!currentBuild || !isBuilderDraftPayload(currentBuild.payload)) {
        return currentBuild;
      }

      const nextPayload: BuilderDraftPayload = {
        ...currentBuild.payload,
        inventoryStep: {
          ...currentBuild.payload.inventoryStep,
          selectedStartingEquipment: [
            ...currentBuild.payload.inventoryStep.selectedStartingEquipment.filter(
              (selection) =>
                !(
                  selection.sourceType === sourceType &&
                  selection.sourceId === sourceId &&
                  selection.bundleIndex === bundleIndex
                ),
            ),
            { sourceType, sourceId, bundleIndex, optionKey },
          ],
        },
      };

      return {
        ...currentBuild,
        currentStep: 'inventory',
        payload: nextPayload,
      };
    });
  };

  const applyInventorySeed = () => {
    const { payload: seededPayload, summary } = seedStartingEquipment(payload, classEntitiesById, backgroundEntitiesById, itemEntitiesById);
    setDraftBuild({
      ...draftBuild,
      currentStep: 'inventory',
      payload: seededPayload,
    });
    setInventoryImpactSummary(summary);
  };

  const addManualItem = (itemId: string) => {
    const existingManualEntry = payload.inventoryStep.entries.find((entry) => entry.itemId === itemId && entry.source === 'manual-selection');
    const nextEntries = existingManualEntry
      ? payload.inventoryStep.entries.map((entry) =>
          entry.itemId === itemId && entry.source === 'manual-selection'
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry,
        )
      : [
          ...payload.inventoryStep.entries,
          {
            itemId,
            quantity: 1,
            equipped: false,
            attuned: false,
            source: 'manual-selection' as const,
          },
        ];

    setDraftBuild({
      ...draftBuild,
      currentStep: 'inventory',
      payload: {
        ...payload,
        inventoryStep: {
          ...payload.inventoryStep,
          entries: nextEntries,
        },
      },
    });
  };

  const updateInventoryEntry = (itemId: string, source: 'starting-equipment' | 'manual-selection', updater: (entry: typeof payload.inventoryStep.entries[number]) => typeof payload.inventoryStep.entries[number] | null) => {
    setDraftBuild({
      ...draftBuild,
      currentStep: 'inventory',
      payload: {
        ...payload,
        inventoryStep: {
          ...payload.inventoryStep,
          entries: payload.inventoryStep.entries.flatMap((entry) => {
            if (!(entry.itemId === itemId && entry.source === source)) {
              return [entry];
            }

            const updatedEntry = updater(entry);
            return updatedEntry ? [updatedEntry] : [];
          }),
        },
      },
    });
  };

  const updateSpellSelection = (spellId: string) => {
    const isSelected = payload.spellsStep.selectedSpellIds.includes(spellId);
    const nextSelectedSpellIds = isSelected
      ? payload.spellsStep.selectedSpellIds.filter((selectedSpellId) => selectedSpellId !== spellId)
      : [...payload.spellsStep.selectedSpellIds, spellId];

    setDraftBuild({
      ...draftBuild,
      currentStep: 'spells',
      buildState: 'draft',
      payload: {
        ...payload,
        spellsStep: {
          ...payload.spellsStep,
          selectedSpellIds: nextSelectedSpellIds,
        },
      },
    });
  };

  const updateSpellExceptionNotes = (notes: string) => {
    setDraftBuild({
      ...draftBuild,
      currentStep: 'spells',
      buildState: 'draft',
      payload: {
        ...payload,
        spellsStep: {
          ...payload.spellsStep,
          manualExceptionNotes: notes
            .split('\n')
            .map((entry) => entry.trim())
            .filter(Boolean),
        },
      },
    });
  };

  const completeBuild = () => {
    if (!validationSummary?.canComplete) {
      setCompletionMessage('Resolve all blockers and checklist items before completing the build.');
      return;
    }

    const completedBuild: CharacterBuild = {
      ...draftBuild,
      buildState: 'complete',
      currentStep: 'review',
      payload: {
        ...payload,
        review: {
          ...payload.review,
          sourceSummary: deriveSourceSummary(payload, allEntitiesById),
        },
      },
    };

    setDraftBuild(completedBuild);
    setCompletionMessage(null);
    router.push(`/(app)/characters/${encodeURIComponent(characterId)}/preview` as never);
  };

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.eyebrow}>Builder Shell</Text>
        <Text style={styles.title}>{payload.characteristicsStep.name || data.character.name}</Text>
        <Text style={styles.subtitle}>
          This shell loads and resumes the draft, autosaves changes locally, and keeps the step flow aligned with the `9a` contract while deeper step logic lands in later slices.
        </Text>

        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, draftBuild.buildState === 'complete' && styles.completeBadge]}>
            <Text style={[styles.statusBadgeLabel, draftBuild.buildState === 'complete' && styles.completeBadgeLabel]}>
              {draftBuild.buildState === 'complete' ? 'Complete' : 'Draft'}
            </Text>
          </View>
          <Text style={styles.statusText}>{saveBuildMutation.isPending ? 'Saving...' : 'Autosave ready'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Species and background</Text>
          <Text style={styles.sectionMeta}>Origin steps</Text>
        </View>

        {originImpactSummary ? <Text style={styles.impactBanner}>{originImpactSummary}</Text> : null}

        <View style={styles.optionBlock}>
          <Text style={styles.optionBlockLabel}>Species</Text>
          <View style={styles.optionChipWrap}>
            {(speciesQuery.data ?? []).map((species) => {
              const isSelected = payload.speciesStep.speciesId === species.id;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={species.id}
                  onPress={() =>
                    applyOriginPayloadChange({
                      ...payload,
                      speciesStep: {
                        ...payload.speciesStep,
                        speciesId: isSelected ? null : species.id,
                      },
                    })
                  }
                  style={({ pressed }) => [styles.optionChip, isSelected && styles.optionChipActive, pressed && styles.optionChipPressed]}
                >
                  <Text style={[styles.optionChipLabel, isSelected && styles.optionChipLabelActive]}>{species.name}</Text>
                </Pressable>
              );
            })}
          </View>
          {selectedSpecies ? (
            <View style={styles.summaryList}>
              {payload.speciesStep.appliedSummary.map((summaryEntry) => (
                <Text key={summaryEntry} style={styles.summaryListItem}>
                  {summaryEntry}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.optionBlock}>
          <Text style={styles.optionBlockLabel}>Background</Text>
          <View style={styles.optionChipWrap}>
            {(backgroundsQuery.data ?? []).map((background) => {
              const isSelected = payload.backgroundStep.backgroundId === background.id;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={background.id}
                  onPress={() =>
                    applyOriginPayloadChange({
                      ...payload,
                      backgroundStep: {
                        ...payload.backgroundStep,
                        backgroundId: isSelected ? null : background.id,
                      },
                    })
                  }
                  style={({ pressed }) => [styles.optionChip, isSelected && styles.optionChipActive, pressed && styles.optionChipPressed]}
                >
                  <Text style={[styles.optionChipLabel, isSelected && styles.optionChipLabelActive]}>{background.name}</Text>
                </Pressable>
              );
            })}
          </View>
          {selectedBackground ? (
            <View style={styles.summaryList}>
              {payload.backgroundStep.appliedSummary.map((summaryEntry) => (
                <Text key={summaryEntry} style={styles.summaryListItem}>
                  {summaryEntry}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        {selectedSpecies && payload.speciesStep.grantedFeatSelections.some((selection) => selection.selectedFeatId == null) ? (
          <View style={styles.optionBlock}>
            <Text style={styles.optionBlockLabel}>Species granted feat</Text>
            <View style={styles.optionChipWrap}>
              {((selectedSpecies.metadata.featIds as string[] | undefined) ?? []).filter((featId) => featEntitiesById[featId]).map((featId) => {
                const feat = featEntitiesById[featId];
                const isSelected = payload.speciesStep.grantedFeatSelections.some((selection) => selection.selectedFeatId === featId);
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={featId}
                    onPress={() => updateGrantedFeatSelection('speciesStep', selectedSpecies.id, featId)}
                    style={({ pressed }) => [styles.optionChip, isSelected && styles.optionChipActive, pressed && styles.optionChipPressed]}
                  >
                    <Text style={[styles.optionChipLabel, isSelected && styles.optionChipLabelActive]}>{feat?.name ?? featId}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {selectedBackground && payload.backgroundStep.grantedFeatSelections.some((selection) => selection.selectedFeatId == null) ? (
          <View style={styles.optionBlock}>
            <Text style={styles.optionBlockLabel}>Background granted feat</Text>
            <View style={styles.optionChipWrap}>
              {((selectedBackground.metadata.featIds as string[] | undefined) ?? []).filter((featId) => featEntitiesById[featId]).map((featId) => {
                const feat = featEntitiesById[featId];
                const isSelected = payload.backgroundStep.grantedFeatSelections.some((selection) => selection.selectedFeatId === featId);
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={featId}
                    onPress={() => updateGrantedFeatSelection('backgroundStep', selectedBackground.id, featId)}
                    style={({ pressed }) => [styles.optionChip, isSelected && styles.optionChipActive, pressed && styles.optionChipPressed]}
                  >
                    <Text style={[styles.optionChipLabel, isSelected && styles.optionChipLabelActive]}>{feat?.name ?? featId}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Ability points</Text>
          <Text style={styles.sectionMeta}>Base + guided bonuses</Text>
        </View>

        <View style={styles.abilityGrid}>
          {['str', 'dex', 'con', 'int', 'wis', 'cha'].map((ability) => (
            <View key={ability} style={styles.abilityCard}>
              <Text style={styles.abilityLabel}>{ability.toUpperCase()}</Text>
              <TextInput
                keyboardType="number-pad"
                onChangeText={(value) => updateBaseAbilityScore(ability, value)}
                style={styles.abilityInput}
                value={String(payload.abilityPointsStep.baseScores[ability] ?? '')}
              />
              <Text style={styles.abilityMeta}>Final {payload.abilityPointsStep.scores[ability] ?? payload.abilityPointsStep.baseScores[ability] ?? 0}</Text>
              <View style={styles.asiControls}>
                <Pressable accessibilityRole="button" onPress={() => updateAsiPoint(ability, -1)} style={({ pressed }) => [styles.levelButton, pressed && styles.levelButtonPressed]}>
                  <Text style={styles.levelButtonLabel}>-</Text>
                </Pressable>
                <Text style={styles.asiCounter}>
                  +{payload.abilityPointsStep.bonusSelections.filter((selection) => selection.sourceType === 'asi' && selection.ability === ability).length}
                </Text>
                <Pressable accessibilityRole="button" onPress={() => updateAsiPoint(ability, 1)} style={({ pressed }) => [styles.levelButton, pressed && styles.levelButtonPressed, spentAsiPoints >= availableAsiPoints && styles.levelButtonDisabled]}>
                  <Text style={styles.levelButtonLabel}>+</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.validationHint}>ASI points available: {availableAsiPoints}. Spent: {spentAsiPoints}.</Text>

        {[speciesAbilityRequirements, backgroundAbilityRequirements].filter(Boolean).map((requirement) =>
          requirement && requirement.choices.length > 0 ? (
            <View key={`${requirement.sourceType}-${requirement.sourceId}`} style={styles.optionBlock}>
              <Text style={styles.optionBlockLabel}>
                {requirement.sourceType === 'species' ? 'Species' : 'Background'} ability bonuses
              </Text>
              {requirement.choices.map((choice, index) => {
                const matchingSelections = payload.abilityPointsStep.bonusSelections.filter(
                  (selection) =>
                    selection.sourceType === requirement.sourceType &&
                    selection.sourceId === requirement.sourceId &&
                    selection.amount === choice.amount,
                );

                return (
                  <View key={`${requirement.sourceId}-${choice.amount}-${index}`} style={styles.choiceGroup}>
                    <Text style={styles.choiceGroupLabel}>
                      Choose {choice.count} ability{choice.count === 1 ? '' : ' abilities'} for +{choice.amount}
                    </Text>
                    <View style={styles.optionChipWrap}>
                      {choice.options.map((ability) => {
                        const isSelected = matchingSelections.some((selection) => selection.ability === ability);
                        return (
                          <Pressable
                            accessibilityRole="button"
                            key={`${requirement.sourceId}-${choice.amount}-${ability}`}
                            onPress={() => updateOriginAbilitySelection(requirement.sourceType, requirement.sourceId, ability, choice.amount, choice.count > 1)}
                            style={({ pressed }) => [styles.optionChip, isSelected && styles.optionChipActive, pressed && styles.optionChipPressed]}
                          >
                            <Text style={[styles.optionChipLabel, isSelected && styles.optionChipLabelActive]}>{ability.toUpperCase()}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null,
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Inventory</Text>
          <Text style={styles.sectionMeta}>Seed and edit gear</Text>
        </View>

        {inventoryImpactSummary ? <Text style={styles.impactBanner}>{inventoryImpactSummary}</Text> : null}

        {startingEquipmentOptionGroups.map((group) => {
          const selectedOption = payload.inventoryStep.selectedStartingEquipment.find(
            (selection) => selection.sourceType === group.sourceType && selection.sourceId === group.sourceId && selection.bundleIndex === group.bundleIndex,
          )?.optionKey;

          return (
            <View key={`${group.sourceType}-${group.sourceId}-${group.bundleIndex}`} style={styles.optionBlock}>
              <Text style={styles.optionBlockLabel}>{group.title}</Text>
              <View style={styles.optionChipWrap}>
                {group.choices.map((choice) => {
                  const isSelected = (selectedOption ?? group.choices[0]?.optionKey) === choice.optionKey;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={choice.optionKey}
                      onPress={() => updateStartingEquipmentChoice(group.sourceType, group.sourceId, group.bundleIndex, choice.optionKey)}
                      style={({ pressed }) => [styles.optionChip, isSelected && styles.optionChipActive, pressed && styles.optionChipPressed]}
                    >
                      <Text style={[styles.optionChipLabel, isSelected && styles.optionChipLabelActive]}>{choice.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}

        <Pressable accessibilityRole="button" onPress={applyInventorySeed} style={({ pressed }) => [styles.addClassButton, pressed && styles.addClassButtonPressed]}>
          <Text style={styles.addClassButtonLabel}>{payload.inventoryStep.entries.some((entry) => entry.source === 'starting-equipment') ? 'Reseed Starting Equipment' : 'Seed Starting Equipment'}</Text>
        </Pressable>

        <View style={styles.currencyRow}>
          <Text style={styles.optionBlockLabel}>Starting currency</Text>
          <Text style={styles.currencyValue}>
            {payload.inventoryStep.startingCurrency.gp} gp, {payload.inventoryStep.startingCurrency.sp} sp, {payload.inventoryStep.startingCurrency.cp} cp
          </Text>
        </View>

        {payload.inventoryStep.unresolvedStartingGear.length > 0 ? (
          <View style={styles.unresolvedPanel}>
            <Text style={styles.unresolvedTitle}>Unresolved starting gear</Text>
            {payload.inventoryStep.unresolvedStartingGear.map((entry) => (
              <Text key={entry} style={styles.unresolvedItem}>
                {entry}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={styles.optionBlock}>
          <Text style={styles.optionBlockLabel}>Add canonical items</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setInventorySearch}
            placeholder="Search equipment or magic items"
            placeholderTextColor={theme.colors.textFaint}
            style={styles.input}
            value={inventorySearch}
          />
          {inventorySearch.trim().length > 0 ? (
            <View style={styles.searchResults}>
              {itemSearchResults.slice(0, 12).map((item) => (
                <Pressable
                  accessibilityRole="button"
                  key={item.id}
                  onPress={() => addManualItem(item.id)}
                  style={({ pressed }) => [styles.searchResultRow, pressed && styles.optionChipPressed]}
                >
                  <Text style={styles.searchResultTitle}>{item.name}</Text>
                  <Text style={styles.searchResultMeta}>{item.sourceCode}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.inventoryList}>
          {payload.inventoryStep.entries.map((entry) => {
            const item = itemEntitiesById[entry.itemId];
            return (
              <View key={`${entry.itemId}-${entry.source}`} style={styles.inventoryCard}>
                <View style={styles.inventoryHeader}>
                  <View style={styles.inventoryHeading}>
                    <Text style={styles.inventoryTitle}>{item?.name ?? entry.itemId}</Text>
                    <Text style={styles.inventoryMeta}>{entry.source === 'starting-equipment' ? 'Seeded gear' : 'Manual add'}</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => updateInventoryEntry(entry.itemId, entry.source, () => null)}
                    style={({ pressed }) => [styles.removeButton, pressed && styles.removeButtonPressed]}
                  >
                    <Text style={styles.removeButtonLabel}>Remove</Text>
                  </Pressable>
                </View>
                <View style={styles.levelControls}>
                  <Pressable accessibilityRole="button" onPress={() => updateInventoryEntry(entry.itemId, entry.source, (current) => ({ ...current, quantity: Math.max(1, current.quantity - 1) }))} style={({ pressed }) => [styles.levelButton, pressed && styles.levelButtonPressed]}>
                    <Text style={styles.levelButtonLabel}>-</Text>
                  </Pressable>
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelBadgeLabel}>Qty {entry.quantity}</Text>
                  </View>
                  <Pressable accessibilityRole="button" onPress={() => updateInventoryEntry(entry.itemId, entry.source, (current) => ({ ...current, quantity: current.quantity + 1 }))} style={({ pressed }) => [styles.levelButton, pressed && styles.levelButtonPressed]}>
                    <Text style={styles.levelButtonLabel}>+</Text>
                  </Pressable>
                </View>
                <View style={styles.optionChipWrap}>
                  <Pressable accessibilityRole="button" onPress={() => updateInventoryEntry(entry.itemId, entry.source, (current) => ({ ...current, equipped: !current.equipped }))} style={({ pressed }) => [styles.optionChip, entry.equipped && styles.optionChipActive, pressed && styles.optionChipPressed]}>
                    <Text style={[styles.optionChipLabel, entry.equipped && styles.optionChipLabelActive]}>Equipped</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={() => updateInventoryEntry(entry.itemId, entry.source, (current) => ({ ...current, attuned: !current.attuned }))} style={({ pressed }) => [styles.optionChip, entry.attuned && styles.optionChipActive, pressed && styles.optionChipPressed]}>
                    <Text style={[styles.optionChipLabel, entry.attuned && styles.optionChipLabelActive]}>Attuned</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Class step</Text>
          <Text style={styles.sectionMeta}>Total level {totalAllocatedLevel}</Text>
        </View>

        <Text style={styles.sectionBodyText}>
          Class is the structural anchor of the build. Configure allocations, subclass timing, and class-owned feature choices here.
        </Text>

        {classImpactSummary ? <Text style={styles.impactBanner}>{classImpactSummary}</Text> : null}

        <View style={styles.allocationList}>
          {payload.classStep.allocations.map((allocation) => {
            const classEntity = classEntitiesById[allocation.classId];
            const subclassOptions = allocation.classId ? subclassesByClassId[allocation.classId] ?? [] : [];
            const subclassUnlockLabel = classEntity ? getSubclassUnlockLabel(classEntity) : null;
            const subclassUnlockLevel = classEntity ? getSubclassUnlockLevel(classEntity) : null;
            const canChooseSubclass = subclassUnlockLevel == null ? subclassOptions.length > 0 : allocation.level >= subclassUnlockLevel;

            return (
              <View key={allocation.id} style={styles.allocationCard}>
                <View style={styles.allocationHeader}>
                  <View style={styles.allocationHeading}>
                    <Text style={styles.allocationTitle}>{classEntity?.name ?? 'Unknown class'}</Text>
                    <Text style={styles.allocationMeta}>{subclassUnlockLabel ?? 'No structured subclass timing found'}</Text>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    disabled={payload.classStep.allocations.length === 1}
                    onPress={() => removeAllocation(allocation.id)}
                    style={({ pressed }) => [styles.removeButton, pressed && styles.removeButtonPressed, payload.classStep.allocations.length === 1 && styles.removeButtonDisabled]}
                  >
                    <Text style={styles.removeButtonLabel}>Remove</Text>
                  </Pressable>
                </View>

                <View style={styles.levelControls}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={allocation.level <= 1}
                    onPress={() => updateAllocation(allocation.id, (current) => ({ ...current, level: Math.max(1, current.level - 1) }))}
                    style={({ pressed }) => [styles.levelButton, pressed && styles.levelButtonPressed, allocation.level <= 1 && styles.levelButtonDisabled]}
                  >
                    <Text style={styles.levelButtonLabel}>-</Text>
                  </Pressable>
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelBadgeLabel}>Level {allocation.level}</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    disabled={totalAllocatedLevel >= 20}
                    onPress={() => updateAllocation(allocation.id, (current) => ({ ...current, level: current.level + 1 }))}
                    style={({ pressed }) => [styles.levelButton, pressed && styles.levelButtonPressed, totalAllocatedLevel >= 20 && styles.levelButtonDisabled]}
                  >
                    <Text style={styles.levelButtonLabel}>+</Text>
                  </Pressable>
                </View>

                {subclassOptions.length > 0 && canChooseSubclass ? (
                  <View style={styles.optionBlock}>
                    <Text style={styles.optionBlockLabel}>Subclass</Text>
                    <View style={styles.optionChipWrap}>
                      {subclassOptions.map((subclass) => {
                        const isSelected = allocation.subclassId === subclass.id;
                        return (
                          <Pressable
                            accessibilityRole="button"
                            key={subclass.id}
                            onPress={() => updateAllocation(allocation.id, (current) => ({ ...current, subclassId: isSelected ? null : subclass.id }))}
                            style={({ pressed }) => [styles.optionChip, isSelected && styles.optionChipActive, pressed && styles.optionChipPressed]}
                          >
                            <Text style={[styles.optionChipLabel, isSelected && styles.optionChipLabelActive]}>{subclass.name}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ) : subclassOptions.length > 0 ? (
                  <Text style={styles.lockedHint}>Subclass selection unlocks when this class reaches the qualifying level.</Text>
                ) : null}
              </View>
            );
          })}
        </View>

        <View style={styles.addClassArea}>
          <Pressable
            accessibilityRole="button"
            disabled={totalAllocatedLevel >= 20}
            onPress={() => setShowClassPicker((current) => !current)}
            style={({ pressed }) => [
              styles.addClassButton,
              pressed && styles.addClassButtonPressed,
              totalAllocatedLevel >= 20 && styles.addClassButtonDisabled,
            ]}
          >
            <Text style={styles.addClassButtonLabel}>{showClassPicker ? 'Hide class options' : 'Add Class'}</Text>
          </Pressable>

          {showClassPicker ? (
            <View style={styles.optionChipWrap}>
              {availableClasses.map((classEntity) => (
                <Pressable
                  accessibilityRole="button"
                  key={classEntity.id}
                  onPress={() => addClassAllocation(classEntity.id)}
                  style={({ pressed }) => [styles.optionChip, pressed && styles.optionChipPressed]}
                >
                  <Text style={styles.optionChipLabel}>{classEntity.name}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        {applicableGrants.length > 0 ? (
          <View style={styles.featureChoiceSection}>
            <Text style={styles.sectionTitle}>Class-owned feature choices</Text>
            {applicableGrants.map((grant) => {
              const selectedOptionIds = payload.classStep.featureChoices.find((selection) => selection.grantId === grant.id)?.selectedOptionIds ?? [];
              const options = grantOptionsByGrantId[grant.id] ?? [];

              return (
                <View key={grant.id} style={styles.featureChoiceCard}>
                  <Text style={styles.featureChoiceTitle}>{getGrantTitle(grant)}</Text>
                  <Text style={styles.featureChoiceMeta}>
                    Choose {getGrantSelectionCount(grant)} {grant.chooseKind === 'feat' ? 'feat option' : 'optional feature'}
                  </Text>
                  <View style={styles.optionChipWrap}>
                    {options.map((option) => {
                      const isSelected = selectedOptionIds.includes(option.id);

                      return (
                        <Pressable
                          accessibilityRole="button"
                          key={option.id}
                          onPress={() => updateFeatureSelection(grant.id, option.id, grant.count)}
                          style={({ pressed }) => [styles.optionChip, isSelected && styles.optionChipActive, pressed && styles.optionChipPressed]}
                        >
                          <Text style={[styles.optionChipLabel, isSelected && styles.optionChipLabelActive]}>{option.name}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {options.length === 0 ? <Text style={styles.emptyHint}>No structured builder options were found for this grant yet.</Text> : null}
                </View>
              );
            })}
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Step navigation</Text>
        <View style={styles.stepGrid}>
          {builderService.steps.map((step) => {
            const isActive = step === draftBuild.currentStep;

            return (
              <Pressable
                accessibilityRole="button"
                key={step}
                onPress={() => updateCurrentStep(step)}
                style={({ pressed }) => [styles.stepChip, isActive && styles.stepChipActive, pressed && styles.stepChipPressed]}
              >
                <Text style={[styles.stepChipLabel, isActive && styles.stepChipLabelActive]}>{formatStepLabel(step)}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Spells</Text>
          <Text style={styles.sectionMeta}>{spellSummary.isCaster ? `Cantrips ${payload.spellsStep.selectedSpellIds.filter((spellId) => Number(spellEntitiesById[spellId]?.metadata.level ?? 99) === 0).length}/${spellSummary.cantripLimit}` : 'No spellcasting'}</Text>
        </View>

        {spellSummary.isCaster ? (
          <>
            <Text style={styles.sectionBodyText}>
              Select spells from the structured class and subclass spell lists. Current maximum spell level: {spellSummary.maxSpellLevel}. Leveled spells selected: {payload.spellsStep.selectedSpellIds.filter((spellId) => Number(spellEntitiesById[spellId]?.metadata.level ?? 0) > 0).length}/{spellSummary.spellLimit}.
            </Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setSpellSearch}
              placeholder="Search applicable spells"
              placeholderTextColor={theme.colors.textFaint}
              style={styles.input}
              value={spellSearch}
            />
            <View style={styles.searchResults}>
              {visibleSpellResults.map((spell) => {
                const isSelected = payload.spellsStep.selectedSpellIds.includes(spell.id);
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={spell.id}
                    onPress={() => updateSpellSelection(spell.id)}
                    style={({ pressed }) => [styles.searchResultRow, isSelected && styles.optionChipActive, pressed && styles.optionChipPressed]}
                  >
                    <Text style={[styles.searchResultTitle, isSelected && styles.optionChipLabelActive]}>{spell.name}</Text>
                    <Text style={styles.searchResultMeta}>Level {String(spell.metadata.level ?? 0)} • {spell.sourceCode}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Spell exceptions</Text>
              <TextInput
                multiline
                onChangeText={updateSpellExceptionNotes}
                placeholder="Optional edge-case notes, one per line."
                placeholderTextColor={theme.colors.textFaint}
                style={[styles.input, styles.notesInput]}
                textAlignVertical="top"
                value={payload.spellsStep.manualExceptionNotes.join('\n')}
              />
            </View>
          </>
        ) : (
          <Text style={styles.sectionBodyText}>This build does not currently require spell selection.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Draft basics</Text>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Character name</Text>
          <TextInput
            autoCapitalize="words"
            autoCorrect={false}
            onChangeText={updateCharacterName}
            placeholder="Character name"
            placeholderTextColor={theme.colors.textFaint}
            style={styles.input}
            value={payload.characteristicsStep.name}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Notes</Text>
          <TextInput
            multiline
            onChangeText={updateNotes}
            placeholder="Optional reminders, ideas, or follow-up notes."
            placeholderTextColor={theme.colors.textFaint}
            style={[styles.input, styles.notesInput]}
            textAlignVertical="top"
            value={payload.notesStep.notes ?? ''}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Review</Text>
          <Text style={styles.sectionMeta}>{validationSummary?.canComplete ? 'Ready' : 'In progress'}</Text>
        </View>
        <View style={styles.validationGrid}>
          <View style={styles.validationCard}>
            <Text style={styles.validationLabel}>Blockers</Text>
            <Text style={styles.validationValue}>{validationSummary?.blockers.length ?? 0}</Text>
          </View>
          <View style={styles.validationCard}>
            <Text style={styles.validationLabel}>Checklist</Text>
            <Text style={styles.validationValue}>{validationSummary?.checklistItems.length ?? 0}</Text>
          </View>
          <View style={styles.validationCard}>
            <Text style={styles.validationLabel}>Notices</Text>
            <Text style={styles.validationValue}>{validationSummary?.notices.length ?? 0}</Text>
          </View>
          <View style={styles.validationCard}>
            <Text style={styles.validationLabel}>Overrides</Text>
            <Text style={styles.validationValue}>{validationSummary?.overrides.length ?? 0}</Text>
          </View>
        </View>
        <Text style={styles.validationHint}>
          Completion is currently contract-driven: a character can complete only when no unresolved blockers or checklist items remain.
        </Text>

        {payload.review.sourceSummary.sourceCodes.length > 0 ? (
          <View style={styles.reviewPanel}>
            <Text style={styles.reviewTitle}>Source summary</Text>
            <Text style={styles.reviewText}>Sources: {payload.review.sourceSummary.sourceCodes.join(', ')}</Text>
            <Text style={styles.reviewText}>Editions: {payload.review.sourceSummary.editionsUsed.join(', ') || 'None yet'}</Text>
            <Text style={styles.reviewText}>{payload.review.sourceSummary.usesLegacyContent ? 'Legacy content is in use.' : 'No legacy content selected.'}</Text>
          </View>
        ) : null}

        {payload.review.issues.length > 0 ? (
          <View style={styles.issueList}>
            {payload.review.issues.map((issue) => (
              <View key={issue.id} style={styles.issueCard}>
                <Text style={styles.issueTitle}>{issue.summary}</Text>
                <Text style={styles.issueMeta}>{formatStepLabel(issue.step)} • {issue.category}</Text>
                <Text style={styles.issueDetail}>{issue.detail}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {completionMessage ? <Text style={styles.emptyHint}>{completionMessage}</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={!validationSummary?.canComplete}
          onPress={completeBuild}
          style={({ pressed }) => [styles.completeButton, pressed && styles.addClassButtonPressed, !validationSummary?.canComplete && styles.addClassButtonDisabled]}
        >
          <Text style={styles.addClassButtonLabel}>Complete Character</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xl,
  },
  headerCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  eyebrow: {
    color: theme.colors.accentPrimarySoft,
    ...typography.eyebrow,
  },
  title: {
    color: theme.colors.textPrimary,
    ...typography.titleLg,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statusBadge: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  completeBadge: {
    backgroundColor: theme.colors.accentSuccess,
    borderColor: theme.colors.accentSuccessSoft,
  },
  statusBadgeLabel: {
    color: theme.colors.textSecondary,
    ...typography.meta,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  completeBadgeLabel: {
    color: theme.colors.backgroundDeep,
  },
  statusText: {
    color: theme.colors.textMuted,
    ...typography.meta,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    ...typography.sectionTitle,
  },
  sectionHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  sectionMeta: {
    color: theme.colors.textMuted,
    ...typography.meta,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sectionBodyText: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
  impactBanner: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderAccent,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    color: theme.colors.accentLegacySoft,
    fontSize: 14,
    lineHeight: 20,
    padding: theme.spacing.sm,
  },
  allocationList: {
    gap: theme.spacing.md,
  },
  allocationCard: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  allocationHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  allocationHeading: {
    flex: 1,
    gap: 4,
  },
  allocationTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  allocationMeta: {
    color: theme.colors.textMuted,
    ...typography.meta,
  },
  removeButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: theme.spacing.md,
  },
  removeButtonPressed: {
    borderColor: theme.colors.accentPrimary,
  },
  removeButtonDisabled: {
    opacity: 0.5,
  },
  removeButtonLabel: {
    color: theme.colors.textSecondary,
    ...typography.meta,
    fontWeight: '700',
  },
  levelControls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  levelButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  levelButtonPressed: {
    borderColor: theme.colors.accentPrimary,
  },
  levelButtonDisabled: {
    opacity: 0.5,
  },
  levelButtonLabel: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  levelBadge: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  levelBadgeLabel: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  optionBlock: {
    gap: theme.spacing.sm,
  },
  optionBlockLabel: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  optionChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  optionChip: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  optionChipActive: {
    backgroundColor: theme.colors.accentPrimaryDeep,
    borderColor: theme.colors.accentPrimary,
  },
  optionChipPressed: {
    borderColor: theme.colors.accentPrimary,
  },
  optionChipLabel: {
    color: theme.colors.textSecondary,
    ...typography.meta,
    fontWeight: '700',
  },
  optionChipLabelActive: {
    color: theme.colors.accentPrimarySoft,
  },
  lockedHint: {
    color: theme.colors.textMuted,
    ...typography.meta,
  },
  summaryList: {
    gap: 6,
  },
  summaryListItem: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
  abilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  abilityCard: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.sm,
    minWidth: '30%',
    padding: theme.spacing.sm,
  },
  abilityLabel: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  abilityInput: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    color: theme.colors.textPrimary,
    fontSize: 16,
    minHeight: 44,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 10,
  },
  abilityMeta: {
    color: theme.colors.textMuted,
    ...typography.meta,
  },
  asiControls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  asiCounter: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'center',
  },
  choiceGroup: {
    gap: theme.spacing.sm,
  },
  choiceGroupLabel: {
    color: theme.colors.textSecondary,
    ...typography.meta,
    fontWeight: '700',
  },
  addClassArea: {
    gap: theme.spacing.sm,
  },
  addClassButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.accentPrimary,
    borderColor: theme.colors.accentPrimarySoft,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
  },
  addClassButtonPressed: {
    backgroundColor: theme.colors.borderAccent,
  },
  addClassButtonDisabled: {
    backgroundColor: theme.colors.borderStrong,
    borderColor: theme.colors.borderStrong,
  },
  addClassButtonLabel: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  featureChoiceSection: {
    gap: theme.spacing.md,
  },
  featureChoiceCard: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  featureChoiceTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  featureChoiceMeta: {
    color: theme.colors.textMuted,
    ...typography.meta,
  },
  emptyHint: {
    color: theme.colors.accentLegacySoft,
    fontSize: 13,
    lineHeight: 18,
  },
  currencyRow: {
    gap: 4,
  },
  currencyValue: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  unresolvedPanel: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderAccent,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  unresolvedTitle: {
    color: theme.colors.accentLegacySoft,
    fontSize: 14,
    fontWeight: '700',
  },
  unresolvedItem: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
  searchResults: {
    gap: theme.spacing.sm,
  },
  searchResultRow: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    gap: 4,
    padding: theme.spacing.sm,
  },
  searchResultTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  searchResultMeta: {
    color: theme.colors.textMuted,
    ...typography.meta,
  },
  inventoryList: {
    gap: theme.spacing.md,
  },
  inventoryCard: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  inventoryHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  inventoryHeading: {
    flex: 1,
    gap: 4,
  },
  inventoryTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  inventoryMeta: {
    color: theme.colors.textMuted,
    ...typography.meta,
  },
  reviewPanel: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  reviewTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  reviewText: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
  issueList: {
    gap: theme.spacing.sm,
  },
  issueCard: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    gap: 4,
    padding: theme.spacing.sm,
  },
  issueTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  issueMeta: {
    color: theme.colors.textMuted,
    ...typography.meta,
    textTransform: 'uppercase',
  },
  issueDetail: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
  completeButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.accentSuccess,
    borderColor: theme.colors.accentSuccessSoft,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: theme.spacing.lg,
  },
  stepGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  stepChip: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  stepChipActive: {
    backgroundColor: theme.colors.accentPrimaryDeep,
    borderColor: theme.colors.accentPrimary,
  },
  stepChipPressed: {
    borderColor: theme.colors.accentPrimary,
  },
  stepChipLabel: {
    color: theme.colors.textSecondary,
    ...typography.meta,
    fontWeight: '700',
  },
  stepChipLabelActive: {
    color: theme.colors.accentPrimarySoft,
  },
  fieldGroup: {
    gap: theme.spacing.sm,
  },
  fieldLabel: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    color: theme.colors.textPrimary,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
  },
  notesInput: {
    minHeight: 132,
  },
  validationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  validationCard: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    gap: 4,
    minWidth: '47%',
    padding: theme.spacing.sm,
  },
  validationLabel: {
    color: theme.colors.textMuted,
    ...typography.meta,
    textTransform: 'uppercase',
  },
  validationValue: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  validationHint: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
});
