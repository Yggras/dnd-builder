import { useMemo, useState } from 'react';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BuilderService } from '@/features/builder/services/BuilderService';
import { BuilderReviewSection } from '@/features/builder/components/BuilderReviewSection';
import { BuilderSpellsSection } from '@/features/builder/components/BuilderSpellsSection';
import { useBuilderReconciliation } from '@/features/builder/hooks/useBuilderReconciliation';
import { useBuilderDraftState } from '@/features/builder/hooks/useBuilderDraftState';
import { useCharacterBuilderContent } from '@/features/builder/hooks/useCharacterBuilderContent';
import type { BuilderCharacterBuild, BuilderDraftPayload } from '@/features/builder/types';
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
  type NormalizedAbilityRequirement,
  reconcileOriginAndAbilitiesPayload,
} from '@/features/builder/utils/originAndAbilities';
import { getStartingEquipmentOptionGroups, seedStartingEquipment } from '@/features/builder/utils/inventory';
import { getBuilderIssueGroups } from '@/features/builder/utils/review';
import { deriveSourceSummary, summarizeSpellcasting } from '@/features/builder/utils/spellReview';
import { useCharacterRecord } from '@/features/characters/hooks/useCharacterRecord';
import { useSaveCharacterBuild } from '@/features/characters/hooks/useSaveCharacterBuild';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { Screen } from '@/shared/ui/Screen';
import type { BuilderStep } from '@/shared/types/domain';
import { theme, typography } from '@/shared/ui/theme';

const builderService = new BuilderService();

function buildClassAllocationId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `allocation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatStepLabel(step: BuilderStep) {
  return step.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function getSelectedOriginPackageId(
  requirement: NormalizedAbilityRequirement,
  packageSelections: BuilderDraftPayload['abilityPointsStep']['originAbilityPackageSelections'],
) {
  if (requirement.packages.length === 1) {
    return requirement.packages[0]?.id ?? null;
  }

  return (
    packageSelections.find(
      (selection) => selection.sourceType === requirement.sourceType && selection.sourceId === requirement.sourceId,
    )?.packageId ?? null
  );
}

export function CharacterBuilderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ characterId?: string | string[] }>();
  const characterId = Array.isArray(params.characterId) ? params.characterId[0] : params.characterId ?? '';
  const { data, error, isLoading } = useCharacterRecord(characterId);
  const saveBuildMutation = useSaveCharacterBuild();
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [classImpactSummary, setClassImpactSummary] = useState<string | null>(null);
  const [originImpactSummary, setOriginImpactSummary] = useState<string | null>(null);
  const [inventoryImpactSummary, setInventoryImpactSummary] = useState<string | null>(null);
  const [inventorySearch, setInventorySearch] = useState('');
  const [spellSearch, setSpellSearch] = useState('');
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);
  const {
    draftBuild,
    isCompletingBuild,
    lastSavedSnapshot,
    setDraftBuild,
    setIsCompletingBuild,
  } = useBuilderDraftState({ data, saveBuildMutation });
  const {
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
    speciesEntitiesById,
    speciesQuery,
    spellEntitiesById,
    subclassEntitiesById,
    subclassesByClassId,
  } = useCharacterBuilderContent({ draftBuild, inventorySearch });
  const validationSummary = useBuilderReconciliation({
    allEntitiesById,
    allSpellsLoading: allSpellsQuery.isLoading,
    backgroundEntitiesById,
    backgroundsLoading: backgroundsQuery.isLoading,
    classEntitiesById,
    classesLoading: classesQuery.isLoading,
    draftBuild,
    featEntitiesById,
    featsLoading: featsQuery.isLoading,
    grantOptionsByGrantId,
    grantsByClassId,
    setDraftBuild,
    speciesEntitiesById,
    speciesLoading: speciesQuery.isLoading,
    spellEntitiesById,
    subclassEntitiesById,
  });

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

  if (!data?.character || !data.build || !draftBuild) {
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
      if (!currentBuild) {
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
      if (!currentBuild) {
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
  const originAbilityPackageSelections = payload.abilityPointsStep.originAbilityPackageSelections ?? [];
  const originAbilityRequirements = [speciesAbilityRequirements, backgroundAbilityRequirements].filter(
    (requirement): requirement is NormalizedAbilityRequirement => Boolean(requirement),
  );
  const availableAsiPoints = countAvailableAsiPoints(payload, classEntitiesById);
  const spentAsiPoints = payload.abilityPointsStep.bonusSelections
    .filter((selection) => selection.sourceType === 'asi')
    .reduce((sum, selection) => sum + selection.amount, 0);
  const spellSummary = summarizeSpellcasting(payload, classEntitiesById, subclassEntitiesById, spellEntitiesById);
  const selectedCantripCount = payload.spellsStep.selectedSpellIds.filter(
    (spellId) => Number(spellEntitiesById[spellId]?.metadata.level ?? 99) === 0,
  ).length;
  const selectedKnownLeveledCount = payload.spellsStep.selectedSpellIds.filter(
    (spellId) => Number(spellEntitiesById[spellId]?.metadata.level ?? 0) > 0,
  ).length;
  const selectedPreparedCount = payload.spellsStep.preparedSpellIds.filter(
    (spellId) => Number(spellEntitiesById[spellId]?.metadata.level ?? 0) > 0,
  ).length;
  const visibleSpellResults = Object.values(spellEntitiesById)
    .filter((spell) => spellSummary.applicableSpellIds.includes(spell.id))
    .filter((spell) => Number(spell.metadata.level ?? 0) <= spellSummary.maxSpellLevel)
    .filter((spell) => (spellSearch.trim() ? spell.searchText.toLowerCase().includes(spellSearch.trim().toLowerCase()) : true))
    .slice(0, 18);
  const reviewIssueGroups = getBuilderIssueGroups(payload.review.issues);

  const updateOriginAbilitySelection = (
    sourceType: 'species' | 'background',
    sourceId: string,
    packageId: string,
    choiceGroupId: string,
    ability: string,
    amount: number,
    maxSelections: number,
  ) => {
    const groupSelections = payload.abilityPointsStep.bonusSelections.filter(
      (selection) =>
        selection.sourceType === sourceType &&
        selection.sourceId === sourceId &&
        selection.packageId === packageId &&
        selection.choiceGroupId === choiceGroupId,
    );
    const nonGroupSelections = payload.abilityPointsStep.bonusSelections.filter(
      (selection) =>
        !(
          selection.sourceType === sourceType &&
          selection.sourceId === sourceId &&
          selection.packageId === packageId &&
          selection.choiceGroupId === choiceGroupId
        ),
    );
    const currentlySelected = groupSelections.some((selection) => selection.ability === ability);
    const nextGroupSelections = currentlySelected
      ? groupSelections.filter((selection) => selection.ability !== ability)
      : [
          ...groupSelections,
          {
            sourceType,
            sourceId,
            ability,
            amount,
            packageId,
            choiceGroupId,
          },
        ].slice(0, maxSelections);

    applyOriginPayloadChange({
      ...payload,
      abilityPointsStep: {
        ...payload.abilityPointsStep,
        bonusSelections: [...nonGroupSelections, ...nextGroupSelections],
      },
    });
  };

  const updateOriginAbilityPackageSelection = (
    sourceType: 'species' | 'background',
    sourceId: string,
    packageId: string,
  ) => {
    applyOriginPayloadChange({
      ...payload,
      abilityPointsStep: {
        ...payload.abilityPointsStep,
        bonusSelections: payload.abilityPointsStep.bonusSelections.filter(
          (selection) => !(selection.sourceType === sourceType && selection.sourceId === sourceId),
        ),
        originAbilityPackageSelections: [
          ...originAbilityPackageSelections.filter(
            (selection) => !(selection.sourceType === sourceType && selection.sourceId === sourceId),
          ),
          {
            sourceType,
            sourceId,
            packageId,
          },
        ],
      },
    });
  };

  const updateGrantedFeatSelection = (sourceKey: 'speciesStep' | 'backgroundStep', sourceId: string, featId: string) => {
    if (sourceKey === 'speciesStep') {
      applyOriginPayloadChange({
        ...payload,
        speciesStep: {
          ...payload.speciesStep,
          grantedFeatSelections: [{ sourceId, selectedFeatId: featId }],
        },
      });
      return;
    }

    applyOriginPayloadChange({
      ...payload,
      backgroundStep: {
        ...payload.backgroundStep,
        grantedFeatSelections: [{ sourceId, selectedFeatId: featId }],
      },
    });
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
      if (!currentBuild) {
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

  const updateKnownSpellSelection = (spellId: string) => {
    setDraftBuild((currentBuild) => {
      if (!currentBuild) {
        return currentBuild;
      }

      const isSelected = currentBuild.payload.spellsStep.selectedSpellIds.includes(spellId);
      const nextSelectedSpellIds = isSelected
        ? currentBuild.payload.spellsStep.selectedSpellIds.filter((selectedSpellId) => selectedSpellId !== spellId)
        : [...currentBuild.payload.spellsStep.selectedSpellIds, spellId];
      const spellLevel = Number(spellEntitiesById[spellId]?.metadata.level ?? 0);

      return {
        ...currentBuild,
        currentStep: 'spells',
        buildState: 'draft',
        payload: {
          ...currentBuild.payload,
          spellsStep: {
            ...currentBuild.payload.spellsStep,
            selectedSpellIds: nextSelectedSpellIds,
            preparedSpellIds:
              spellLevel > 0 && isSelected
                ? currentBuild.payload.spellsStep.preparedSpellIds.filter((preparedSpellId) => preparedSpellId !== spellId)
                : currentBuild.payload.spellsStep.preparedSpellIds,
          },
        },
      };
    });
  };

  const updatePreparedSpellSelection = (spellId: string) => {
    if (Number(spellEntitiesById[spellId]?.metadata.level ?? 0) === 0) {
      return;
    }

    setDraftBuild((currentBuild) => {
      if (!currentBuild) {
        return currentBuild;
      }

      const isPrepared = currentBuild.payload.spellsStep.preparedSpellIds.includes(spellId);
      const nextPreparedSpellIds = isPrepared
        ? currentBuild.payload.spellsStep.preparedSpellIds.filter((preparedSpellId) => preparedSpellId !== spellId)
        : [...currentBuild.payload.spellsStep.preparedSpellIds, spellId];
      const nextSelectedSpellIds = isPrepared
        ? spellSummary.usesKnownSpells
          ? currentBuild.payload.spellsStep.selectedSpellIds
          : currentBuild.payload.spellsStep.selectedSpellIds.filter((selectedSpellId) => selectedSpellId !== spellId)
        : Array.from(new Set([...currentBuild.payload.spellsStep.selectedSpellIds, spellId]));

      return {
        ...currentBuild,
        currentStep: 'spells',
        buildState: 'draft',
        payload: {
          ...currentBuild.payload,
          spellsStep: {
            ...currentBuild.payload.spellsStep,
            selectedSpellIds: nextSelectedSpellIds,
            preparedSpellIds: nextPreparedSpellIds,
          },
        },
      };
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

    if (saveBuildMutation.isPending) {
      setCompletionMessage('Wait for the current save to finish before completing the build.');
      return;
    }

    const completedBuild: BuilderCharacterBuild = {
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

    const completedSnapshot = JSON.stringify(completedBuild);
    lastSavedSnapshot.current = completedSnapshot;
    setIsCompletingBuild(true);
    setDraftBuild(completedBuild);
    setCompletionMessage(null);
    saveBuildMutation.mutate(completedBuild, {
      onSuccess: () => {
        setIsCompletingBuild(false);
        router.push(`/(app)/characters/${encodeURIComponent(characterId)}/preview` as never);
      },
      onError: () => {
        lastSavedSnapshot.current = null;
        setIsCompletingBuild(false);
        setCompletionMessage('Unable to save the completed build. Resolve the save issue and try again.');
      },
    });
  };

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.eyebrow}>Character Builder</Text>
        <Text style={styles.title}>{payload.characteristicsStep.name || data.character.name}</Text>
        <Text style={styles.subtitle}>
          This guided draft wizard resumes saved progress, autosaves locally, and keeps class, spells, origin, inventory, and review state aligned as the build evolves.
        </Text>

        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, draftBuild.buildState === 'complete' && styles.completeBadge]}>
            <Text style={[styles.statusBadgeLabel, draftBuild.buildState === 'complete' && styles.completeBadgeLabel]}>
              {draftBuild.buildState === 'complete' ? 'Complete' : 'Draft'}
            </Text>
          </View>
          <Text style={styles.statusText}>{isCompletingBuild || saveBuildMutation.isPending ? 'Saving...' : 'Autosave ready'}</Text>
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

        {originAbilityRequirements.map((requirement) => {
          if (requirement.packages.length === 0) {
            return null;
          }

          const selectedPackageId = getSelectedOriginPackageId(
            requirement,
            originAbilityPackageSelections,
          );
          const activePackage = requirement.packages.find((abilityPackage) => abilityPackage.id === selectedPackageId) ?? null;

          return (
            <View key={`${requirement.sourceType}-${requirement.sourceId}`} style={styles.optionBlock}>
              <Text style={styles.optionBlockLabel}>
                {requirement.sourceType === 'species' ? 'Species' : 'Background'} ability bonuses
              </Text>

              {requirement.packages.length > 1 ? (
                <View style={styles.fieldGroup}>
                  <Text style={styles.choiceGroupLabel}>Choose a bonus package</Text>
                  <View style={styles.optionChipWrap}>
                    {requirement.packages.map((abilityPackage) => {
                      const isSelected = selectedPackageId === abilityPackage.id;

                      return (
                        <Pressable
                          accessibilityRole="button"
                          key={abilityPackage.id}
                          onPress={() =>
                            updateOriginAbilityPackageSelection(
                              requirement.sourceType,
                              requirement.sourceId,
                              abilityPackage.id,
                            )
                          }
                          style={({ pressed }) => [
                            styles.optionChip,
                            isSelected && styles.optionChipActive,
                            pressed && styles.optionChipPressed,
                          ]}
                        >
                          <Text style={[styles.optionChipLabel, isSelected && styles.optionChipLabelActive]}>
                            {abilityPackage.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {activePackage?.choices.map((choice, index) => {
                const matchingSelections = payload.abilityPointsStep.bonusSelections.filter(
                  (selection) =>
                    selection.sourceType === requirement.sourceType &&
                    selection.sourceId === requirement.sourceId &&
                    selection.packageId === activePackage.id &&
                    selection.choiceGroupId === choice.id &&
                    selection.amount === choice.amount,
                );

                return (
                  <View key={`${activePackage.id}-${choice.id}-${index}`} style={styles.choiceGroup}>
                    <Text style={styles.choiceGroupLabel}>
                      Choose {choice.count} ability{choice.count === 1 ? '' : ' abilities'} for +{choice.amount}
                    </Text>
                    <View style={styles.optionChipWrap}>
                      {choice.options.map((ability) => {
                        const isSelected = matchingSelections.some((selection) => selection.ability === ability);

                        return (
                          <Pressable
                            accessibilityRole="button"
                            key={`${choice.id}-${ability}`}
                            onPress={() =>
                              updateOriginAbilitySelection(
                                requirement.sourceType,
                                requirement.sourceId,
                                activePackage.id,
                                choice.id,
                                ability,
                                choice.amount,
                                choice.count,
                              )
                            }
                            style={({ pressed }) => [
                              styles.optionChip,
                              isSelected && styles.optionChipActive,
                              pressed && styles.optionChipPressed,
                            ]}
                          >
                            <Text style={[styles.optionChipLabel, isSelected && styles.optionChipLabelActive]}>
                              {ability.toUpperCase()}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}
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

      <BuilderSpellsSection
        onSpellSearchChange={setSpellSearch}
        payload={payload}
        selectedCantripCount={selectedCantripCount}
        selectedKnownLeveledCount={selectedKnownLeveledCount}
        selectedPreparedCount={selectedPreparedCount}
        spellSearch={spellSearch}
        spellSummary={spellSummary}
        updateKnownSpellSelection={updateKnownSpellSelection}
        updatePreparedSpellSelection={updatePreparedSpellSelection}
        updateSpellExceptionNotes={updateSpellExceptionNotes}
        visibleSpellResults={visibleSpellResults}
      />

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

      <BuilderReviewSection
        completionMessage={completionMessage}
        formatStepLabel={formatStepLabel}
        isCompletingBuild={isCompletingBuild}
        onCompleteBuild={completeBuild}
        payload={payload}
        reviewIssueGroups={reviewIssueGroups}
        saveIsPending={saveBuildMutation.isPending}
        validationSummary={validationSummary}
      />
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
  spellResultHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  spellResultHeading: {
    flex: 1,
    gap: 4,
  },
  spellActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    justifyContent: 'flex-end',
  },
  spellActionButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 32,
    paddingHorizontal: theme.spacing.sm,
  },
  spellActionButtonActive: {
    backgroundColor: theme.colors.accentPrimaryDeep,
    borderColor: theme.colors.accentPrimary,
  },
  spellActionLabel: {
    color: theme.colors.textSecondary,
    ...typography.meta,
    fontWeight: '700',
  },
  spellActionLabelActive: {
    color: theme.colors.accentPrimarySoft,
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
