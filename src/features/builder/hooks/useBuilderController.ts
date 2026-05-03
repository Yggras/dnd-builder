import { useState } from 'react';
import type {
  BuilderCharacterBuild,
  BuilderDraftPayload,
} from '@/features/builder/types';
import type { BuilderStep, ChoiceGrant, ContentEntity } from '@/shared/types/domain';
import { reconcileClassStepPayload } from '@/features/builder/utils/classStep';
import {
  countAvailableAsiPoints,
  normalizeAbilityChoices,
  type NormalizedAbilityRequirement,
  reconcileOriginAndAbilitiesPayload,
} from '@/features/builder/utils/originAndAbilities';
import { getStartingEquipmentOptionGroups, seedStartingEquipment } from '@/features/builder/utils/inventory';
import { getBuilderIssueGroups } from '@/features/builder/utils/review';
import { summarizeSpellcasting } from '@/features/builder/utils/spellReview';

function buildClassAllocationId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `allocation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getSelectedOriginPackageId(
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

interface UseBuilderControllerProps {
  draftBuild: BuilderCharacterBuild | null;
  setDraftBuild: React.Dispatch<React.SetStateAction<BuilderCharacterBuild | null>>;
  allEntitiesById: Record<string, ContentEntity>;
  classEntitiesById: Record<string, ContentEntity>;
  speciesEntitiesById: Record<string, ContentEntity>;
  backgroundEntitiesById: Record<string, ContentEntity>;
  featEntitiesById: Record<string, ContentEntity>;
  spellEntitiesById: Record<string, ContentEntity>;
  itemEntitiesById: Record<string, ContentEntity>;
  subclassEntitiesById: Record<string, ContentEntity>;
  grantsByClassId: Record<string, ChoiceGrant[]>;
  grantOptionsByGrantId: Record<string, ContentEntity[]>;
  availableClasses: readonly ContentEntity[];
  spellSearch: string;
}

export function useBuilderController({
  draftBuild,
  setDraftBuild,
  allEntitiesById,
  classEntitiesById,
  speciesEntitiesById,
  backgroundEntitiesById,
  featEntitiesById,
  spellEntitiesById,
  itemEntitiesById,
  subclassEntitiesById,
  grantsByClassId,
  grantOptionsByGrantId,
  availableClasses: allClasses,
  spellSearch,
}: UseBuilderControllerProps) {
  const [classImpactSummary, setClassImpactSummary] = useState<string | null>(null);
  const [originImpactSummary, setOriginImpactSummary] = useState<string | null>(null);
  const [inventoryImpactSummary, setInventoryImpactSummary] = useState<string | null>(null);

  const payload = draftBuild?.payload;

  const applyClassPayloadChange = (nextPayload: BuilderDraftPayload) => {
    setDraftBuild((currentBuild) => {
      if (!currentBuild) return currentBuild;
      const { payload: reconciledPayload, impactSummary } = reconcileClassStepPayload({
        payload: nextPayload,
        classEntitiesById,
        grantsByClassId,
        grantOptionsByGrantId,
      });

      setClassImpactSummary(impactSummary);

      return {
        ...currentBuild,
        currentStep: 'class',
        payload: reconciledPayload,
      };
    });
  };

  const updateCurrentStep = (step: BuilderStep) => {
    setDraftBuild((currentBuild) => (currentBuild ? { ...currentBuild, currentStep: step } : currentBuild));
  };

  const applyOriginPayloadChange = (nextPayload: BuilderDraftPayload) => {
    setDraftBuild((currentBuild) => {
      if (!currentBuild) return currentBuild;
      const { payload: reconciledPayload, impactSummary } = reconcileOriginAndAbilitiesPayload({
        payload: nextPayload,
        classEntitiesById,
        speciesEntitiesById,
        backgroundEntitiesById,
        featEntitiesById,
      });

      setOriginImpactSummary(impactSummary);

      return {
        ...currentBuild,
        payload: reconciledPayload,
      };
    });
  };

  const updateCharacterName = (name: string) => {
    setDraftBuild((currentBuild) => {
      if (!currentBuild) return currentBuild;
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
      if (!currentBuild) return currentBuild;
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
    if (!payload) return;
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
  };

  const updateAllocation = (
    allocationId: string,
    updater: (current: BuilderDraftPayload['classStep']['allocations'][number]) => BuilderDraftPayload['classStep']['allocations'][number],
  ) => {
    if (!payload) return;
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
    if (!payload) return;
    applyClassPayloadChange({
      ...payload,
      classStep: {
        ...payload.classStep,
        allocations: payload.classStep.allocations.filter((allocation) => allocation.id !== allocationId),
      },
    });
  };

  const updateFeatureSelection = (grantId: string, optionId: string, count: number) => {
    if (!payload) return;
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

  const updateOriginAbilitySelection = (
    sourceType: 'species' | 'background',
    sourceId: string,
    packageId: string,
    choiceGroupId: string,
    ability: string,
    amount: number,
    maxSelections: number,
  ) => {
    if (!payload) return;
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
    if (!payload) return;
    applyOriginPayloadChange({
      ...payload,
      abilityPointsStep: {
        ...payload.abilityPointsStep,
        bonusSelections: payload.abilityPointsStep.bonusSelections.filter(
          (selection) => !(selection.sourceType === sourceType && selection.sourceId === sourceId),
        ),
        originAbilityPackageSelections: [
          ...(payload.abilityPointsStep.originAbilityPackageSelections ?? []).filter(
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
    if (!payload) return;
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
    if (!payload) return;
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

  const availableAsiPoints = payload ? countAvailableAsiPoints(payload, classEntitiesById) : 0;
  const spentAsiPoints = payload
    ? payload.abilityPointsStep.bonusSelections
        .filter((selection) => selection.sourceType === 'asi')
        .reduce((sum, selection) => sum + selection.amount, 0)
    : 0;

  const updateAsiPoint = (ability: string, delta: number) => {
    if (!payload) return;
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

  const updateStartingEquipmentChoice = (
    sourceType: 'class' | 'background',
    sourceId: string,
    bundleIndex: number,
    optionKey: string,
  ) => {
    setDraftBuild((currentBuild) => {
      if (!currentBuild) return currentBuild;

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
    setDraftBuild((currentBuild) => {
      if (!currentBuild) return currentBuild;
      const { payload: seededPayload, summary } = seedStartingEquipment(
        currentBuild.payload,
        classEntitiesById,
        backgroundEntitiesById,
        itemEntitiesById,
      );
      setInventoryImpactSummary(summary);
      return {
        ...currentBuild,
        currentStep: 'inventory',
        payload: seededPayload,
      };
    });
  };

  const addManualItem = (itemId: string) => {
    setDraftBuild((currentBuild) => {
      if (!currentBuild) return currentBuild;
      const existingManualEntry = currentBuild.payload.inventoryStep.entries.find(
        (entry) => entry.itemId === itemId && entry.source === 'manual-selection',
      );
      const nextEntries = existingManualEntry
        ? currentBuild.payload.inventoryStep.entries.map((entry) =>
            entry.itemId === itemId && entry.source === 'manual-selection'
              ? { ...entry, quantity: entry.quantity + 1 }
              : entry,
          )
        : [
            ...currentBuild.payload.inventoryStep.entries,
            {
              itemId,
              quantity: 1,
              equipped: false,
              attuned: false,
              source: 'manual-selection' as const,
            },
          ];

      return {
        ...currentBuild,
        currentStep: 'inventory',
        payload: {
          ...currentBuild.payload,
          inventoryStep: {
            ...currentBuild.payload.inventoryStep,
            entries: nextEntries,
          },
        },
      };
    });
  };

  const updateInventoryEntry = (
    itemId: string,
    source: 'starting-equipment' | 'manual-selection',
    updater: (entry: BuilderDraftPayload['inventoryStep']['entries'][number]) => BuilderDraftPayload['inventoryStep']['entries'][number] | null,
  ) => {
    setDraftBuild((currentBuild) => {
      if (!currentBuild) return currentBuild;
      return {
        ...currentBuild,
        currentStep: 'inventory',
        payload: {
          ...currentBuild.payload,
          inventoryStep: {
            ...currentBuild.payload.inventoryStep,
            entries: currentBuild.payload.inventoryStep.entries.flatMap((entry) => {
              if (!(entry.itemId === itemId && entry.source === source)) {
                return [entry];
              }

              const updatedEntry = updater(entry);
              return updatedEntry ? [updatedEntry] : [];
            }),
          },
        },
      };
    });
  };

  const spellSummary = payload ? summarizeSpellcasting(payload, classEntitiesById, subclassEntitiesById, spellEntitiesById) : null;

  const updateKnownSpellSelection = (spellId: string) => {
    setDraftBuild((currentBuild) => {
      if (!currentBuild) return currentBuild;

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
      if (!currentBuild || !spellSummary) return currentBuild;

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
    setDraftBuild((currentBuild) => {
      if (!currentBuild) return currentBuild;
      return {
        ...currentBuild,
        currentStep: 'spells',
        buildState: 'draft',
        payload: {
          ...currentBuild.payload,
          spellsStep: {
            ...currentBuild.payload.spellsStep,
            manualExceptionNotes: notes
              .split('\n')
              .map((entry) => entry.trim())
              .filter(Boolean),
          },
        },
      };
    });
  };

  const clearImpactSummaries = () => {
    setClassImpactSummary(null);
    setOriginImpactSummary(null);
    setInventoryImpactSummary(null);
  };

  // Derived state that drives the UI
  const totalAllocatedLevel = payload ? payload.classStep.allocations.reduce((sum, allocation) => sum + allocation.level, 0) : 0;
  
  const availableClasses = payload 
    ? allClasses.filter((classEntity) => !payload.classStep.allocations.some((allocation) => allocation.classId === classEntity.id))
    : [];
    
  const selectedSpecies = payload?.speciesStep.speciesId ? speciesEntitiesById[payload.speciesStep.speciesId] : null;
  const selectedBackground = payload?.backgroundStep.backgroundId ? backgroundEntitiesById[payload.backgroundStep.backgroundId] : null;
  
  const speciesAbilityRequirements = selectedSpecies
    ? normalizeAbilityChoices('species', selectedSpecies.id, selectedSpecies.metadata.ability)
    : null;
  const backgroundAbilityRequirements = selectedBackground
    ? normalizeAbilityChoices('background', selectedBackground.id, selectedBackground.metadata.ability)
    : null;
  const originAbilityPackageSelections = payload?.abilityPointsStep.originAbilityPackageSelections ?? [];
  const originAbilityRequirements = [speciesAbilityRequirements, backgroundAbilityRequirements].filter(
    (requirement): requirement is NormalizedAbilityRequirement => Boolean(requirement),
  );

  const selectedCantripCount = payload?.spellsStep.selectedSpellIds.filter(
    (spellId) => Number(spellEntitiesById[spellId]?.metadata.level ?? 99) === 0,
  ).length ?? 0;
  const selectedKnownLeveledCount = payload?.spellsStep.selectedSpellIds.filter(
    (spellId) => Number(spellEntitiesById[spellId]?.metadata.level ?? 0) > 0,
  ).length ?? 0;
  const selectedPreparedCount = payload?.spellsStep.preparedSpellIds.filter(
    (spellId) => Number(spellEntitiesById[spellId]?.metadata.level ?? 0) > 0,
  ).length ?? 0;

  const visibleSpellResults = Object.values(spellEntitiesById)
    .filter((spell) => spellSummary?.applicableSpellIds.includes(spell.id))
    .filter((spell) => Number(spell.metadata.level ?? 0) <= (spellSummary?.maxSpellLevel ?? 0))
    .filter((spell) => (spellSearch.trim() ? spell.searchText.toLowerCase().includes(spellSearch.trim().toLowerCase()) : true))
    .slice(0, 18);

  const reviewIssueGroups = payload ? getBuilderIssueGroups(payload.review.issues) : [];
  
  const startingEquipmentOptionGroups = payload ? getStartingEquipmentOptionGroups(payload, classEntitiesById, backgroundEntitiesById) : [];

  return {
    classImpactSummary,
    originImpactSummary,
    inventoryImpactSummary,
    clearImpactSummaries,
    totalAllocatedLevel,
    availableClasses,
    selectedSpecies,
    selectedBackground,
    originAbilityPackageSelections,
    originAbilityRequirements,
    availableAsiPoints,
    spentAsiPoints,
    spellSummary,
    selectedCantripCount,
    selectedKnownLeveledCount,
    selectedPreparedCount,
    visibleSpellResults,
    reviewIssueGroups,
    startingEquipmentOptionGroups,

    updateCurrentStep,
    applyClassPayloadChange,
    applyOriginPayloadChange,
    updateCharacterName,
    updateNotes,
    addClassAllocation,
    updateAllocation,
    removeAllocation,
    updateFeatureSelection,
    updateOriginAbilitySelection,
    updateOriginAbilityPackageSelection,
    updateGrantedFeatSelection,
    updateBaseAbilityScore,
    updateAsiPoint,
    updateStartingEquipmentChoice,
    applyInventorySeed,
    addManualItem,
    updateInventoryEntry,
    updateKnownSpellSelection,
    updatePreparedSpellSelection,
    updateSpellExceptionNotes,
  };
}
