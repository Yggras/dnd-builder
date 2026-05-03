import { useState } from 'react';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BuilderService } from '@/features/builder/services/BuilderService';
import { BuilderReviewSection } from '@/features/builder/components/BuilderReviewSection';
import { BuilderSpellsSection } from '@/features/builder/components/BuilderSpellsSection';
import { BuilderStepClass } from '@/features/builder/components/BuilderStepClass';
import { BuilderStepOrigin } from '@/features/builder/components/BuilderStepOrigin';
import { BuilderStepAbilityPoints } from '@/features/builder/components/BuilderStepAbilityPoints';
import { BuilderStepInventory } from '@/features/builder/components/BuilderStepInventory';
import { BuilderStepBasics } from '@/features/builder/components/BuilderStepBasics';
import { useBuilderController } from '@/features/builder/hooks/useBuilderController';
import { useBuilderReconciliation } from '@/features/builder/hooks/useBuilderReconciliation';
import { useBuilderDraftState } from '@/features/builder/hooks/useBuilderDraftState';
import { useCharacterBuilderContent } from '@/features/builder/hooks/useCharacterBuilderContent';
import type { BuilderCharacterBuild } from '@/features/builder/types';
import { deriveSourceSummary } from '@/features/builder/utils/spellReview';
import { useCharacterRecord } from '@/features/characters/hooks/useCharacterRecord';
import { useSaveCharacterBuild } from '@/features/characters/hooks/useSaveCharacterBuild';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { Screen } from '@/shared/ui/Screen';
import type { BuilderStep } from '@/shared/types/domain';
import { theme, typography } from '@/shared/ui/theme';

const builderService = new BuilderService();

function formatStepLabel(step: BuilderStep) {
  return step.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function getSaveStatusText(saveStatus: 'saved' | 'dirty' | 'saving' | 'error', isCompletingBuild: boolean, saveError: Error | null) {
  if (isCompletingBuild || saveStatus === 'saving') {
    return 'Saving...';
  }

  if (saveStatus === 'dirty') {
    return 'Unsaved changes';
  }

  if (saveStatus === 'error') {
    return saveError?.message ?? 'Autosave failed';
  }

  return 'Autosave ready';
}

export function CharacterBuilderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ characterId?: string | string[] }>();
  const characterId = Array.isArray(params.characterId) ? params.characterId[0] : params.characterId ?? '';
  const { data, error, isLoading } = useCharacterRecord(characterId);
  const saveBuildMutation = useSaveCharacterBuild();

  const [inventorySearch, setInventorySearch] = useState('');
  const [spellSearch, setSpellSearch] = useState('');
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);

  const {
    draftBuild,
    isCompletingBuild,
    saveBuildNow,
    saveError,
    saveStatus,
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

  const controller = useBuilderController({
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
    availableClasses: classesQuery.data ?? [],
    spellSearch,
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
  const itemSearchResults = inventorySearch.trim().length > 0 ? itemSearchQuery.data ?? [] : [];

  const completeBuild = async () => {
    if (!validationSummary?.canComplete) {
      setCompletionMessage('Resolve all blockers and checklist items before completing the build.');
      return;
    }

    if (saveStatus === 'saving' || saveBuildMutation.isPending) {
      setCompletionMessage('Wait for the current save to finish before completing the build.');
      return;
    }

    if (saveStatus === 'error') {
      setCompletionMessage(saveError?.message ?? 'Resolve the current save issue before completing the build.');
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

    setIsCompletingBuild(true);
    setDraftBuild(completedBuild);
    setCompletionMessage(null);

    try {
      await saveBuildNow(completedBuild);
      setIsCompletingBuild(false);
      router.push(`/(app)/characters/${encodeURIComponent(characterId)}/preview` as never);
    } catch {
      setIsCompletingBuild(false);
      setCompletionMessage('Unable to save the completed build. Resolve the save issue and try again.');
    }
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
          <Text style={[styles.statusText, saveStatus === 'error' && styles.statusTextError]}>
            {getSaveStatusText(saveStatus, isCompletingBuild, saveError)}
          </Text>
        </View>
      </View>

      <BuilderStepOrigin
        applyOriginPayloadChange={controller.applyOriginPayloadChange}
        availableBackgrounds={backgroundsQuery.data ?? []}
        availableSpecies={speciesQuery.data ?? []}
        backgroundEntitiesById={backgroundEntitiesById}
        featEntitiesById={featEntitiesById}
        originImpactSummary={controller.originImpactSummary}
        payload={payload}
        selectedBackground={controller.selectedBackground}
        selectedSpecies={controller.selectedSpecies}
        speciesEntitiesById={speciesEntitiesById}
        updateGrantedFeatSelection={controller.updateGrantedFeatSelection}
      />

      <BuilderStepAbilityPoints
        availableAsiPoints={controller.availableAsiPoints}
        originAbilityPackageSelections={controller.originAbilityPackageSelections}
        originAbilityRequirements={controller.originAbilityRequirements}
        payload={payload}
        spentAsiPoints={controller.spentAsiPoints}
        updateAsiPoint={controller.updateAsiPoint}
        updateBaseAbilityScore={controller.updateBaseAbilityScore}
        updateOriginAbilityPackageSelection={controller.updateOriginAbilityPackageSelection}
        updateOriginAbilitySelection={controller.updateOriginAbilitySelection}
      />

      <BuilderStepInventory
        addManualItem={controller.addManualItem}
        applyInventorySeed={controller.applyInventorySeed}
        inventoryImpactSummary={controller.inventoryImpactSummary}
        inventorySearch={inventorySearch}
        itemEntitiesById={itemEntitiesById}
        itemSearchResults={itemSearchResults}
        payload={payload}
        setInventorySearch={setInventorySearch}
        startingEquipmentOptionGroups={controller.startingEquipmentOptionGroups}
        updateInventoryEntry={controller.updateInventoryEntry}
        updateStartingEquipmentChoice={controller.updateStartingEquipmentChoice}
      />

      <BuilderStepClass
        addClassAllocation={controller.addClassAllocation}
        applicableGrants={applicableGrants}
        availableClasses={controller.availableClasses}
        classEntitiesById={classEntitiesById}
        classImpactSummary={controller.classImpactSummary}
        grantOptionsByGrantId={grantOptionsByGrantId}
        payload={payload}
        removeAllocation={controller.removeAllocation}
        subclassesByClassId={subclassesByClassId}
        totalAllocatedLevel={controller.totalAllocatedLevel}
        updateAllocation={controller.updateAllocation}
        updateFeatureSelection={controller.updateFeatureSelection}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Step navigation</Text>
        <View style={styles.stepGrid}>
          {builderService.steps.map((step) => {
            const isActive = step === draftBuild.currentStep;

            return (
              <Pressable
                accessibilityRole="button"
                key={step}
                onPress={() => controller.updateCurrentStep(step)}
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
        selectedCantripCount={controller.selectedCantripCount}
        selectedKnownLeveledCount={controller.selectedKnownLeveledCount}
        selectedPreparedCount={controller.selectedPreparedCount}
        spellSearch={spellSearch}
        spellSummary={controller.spellSummary!}
        updateKnownSpellSelection={controller.updateKnownSpellSelection}
        updatePreparedSpellSelection={controller.updatePreparedSpellSelection}
        updateSpellExceptionNotes={controller.updateSpellExceptionNotes}
        visibleSpellResults={controller.visibleSpellResults}
      />

      <BuilderStepBasics
        payload={payload}
        updateCharacterName={controller.updateCharacterName}
        updateNotes={controller.updateNotes}
      />

      <BuilderReviewSection
        completionMessage={completionMessage}
        formatStepLabel={formatStepLabel}
        isCompletingBuild={isCompletingBuild}
        onCompleteBuild={completeBuild}
        payload={payload}
        reviewIssueGroups={controller.reviewIssueGroups}
        saveIsPending={saveStatus === 'saving' || saveBuildMutation.isPending || saveStatus === 'error'}
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
  statusTextError: {
    color: theme.colors.danger,
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
  stepGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  stepChip: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.pill,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
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
});
