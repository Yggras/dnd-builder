import { useState } from 'react';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BuilderService } from '@/features/builder/services/BuilderService';
import { BuilderReviewSection } from '@/features/builder/components/BuilderReviewSection';
import { BuilderSpellsSection } from '@/features/builder/components/BuilderSpellsSection';
import { BuilderStepClass } from '@/features/builder/components/BuilderStepClass';
import { BuilderStepOrigin } from '@/features/builder/components/BuilderStepOrigin';
import { BuilderStepAbilityPoints } from '@/features/builder/components/BuilderStepAbilityPoints';
import { BuilderStepInventory } from '@/features/builder/components/BuilderStepInventory';
import { BuilderStepBasics } from '@/features/builder/components/BuilderStepBasics';
import { BuilderWizardStepper } from '@/features/builder/components/BuilderWizardStepper';
import { BuilderWizardNavigation } from '@/features/builder/components/BuilderWizardNavigation';
import { BuilderWizardSlide } from '@/features/builder/components/BuilderWizardSlide';
import { useBuilderController, WIZARD_PHASES } from '@/features/builder/hooks/useBuilderController';
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
  const [isBuildSuccess, setIsBuildSuccess] = useState(false);

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
      setIsBuildSuccess(true);
      
      setTimeout(() => {
        router.push(`/(app)/characters/${encodeURIComponent(characterId)}/preview` as never);
      }, 600);
    } catch {
      setIsCompletingBuild(false);
      setCompletionMessage('Unable to save the completed build. Resolve the save issue and try again.');
    }
  };

  const renderActivePhase = () => {
    switch (controller.activePhaseId) {
      case 'class':
        return (
          <>
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
          </>
        );
      case 'origin':
        return (
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
        );
      case 'abilities':
        return (
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
        );
      case 'inventory':
        return (
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
        );
      case 'basics':
        return (
          <BuilderStepBasics
            payload={payload}
            updateCharacterName={controller.updateCharacterName}
            updateNotes={controller.updateNotes}
          />
        );
      case 'review':
        return (
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
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.wrapper}>
      <View pointerEvents="none" style={styles.backdrop} />

      <View style={styles.headerCompact}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {payload.characteristicsStep.name || data.character.name}
          </Text>
          <View style={[styles.statusBadge, draftBuild.buildState === 'complete' && styles.completeBadge]}>
            <Text style={[styles.statusBadgeLabel, draftBuild.buildState === 'complete' && styles.completeBadgeLabel]}>
              {draftBuild.buildState === 'complete' ? 'Complete' : 'Draft'}
            </Text>
          </View>
        </View>
        <Text style={[styles.statusText, saveStatus === 'error' && styles.statusTextError]}>
          {getSaveStatusText(saveStatus, isCompletingBuild, saveError)}
        </Text>
      </View>

      <BuilderWizardStepper
        activePhaseId={controller.activePhaseId}
        getPhaseStatus={controller.getPhaseStatus}
        onPhaseSelect={controller.goToPhase}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} contentInsetAdjustmentBehavior="automatic">
        <BuilderWizardSlide activePhaseId={controller.activePhaseId} activePhaseIndex={controller.activePhaseIndex}>
          {renderActivePhase()}
        </BuilderWizardSlide>
      </ScrollView>

      <BuilderWizardNavigation
        activePhaseIndex={controller.activePhaseIndex}
        totalPhases={WIZARD_PHASES.length}
        canComplete={validationSummary?.canComplete ?? false}
        isCompletingBuild={isCompletingBuild}
        isBuildSuccess={isBuildSuccess}
        goToPreviousPhase={controller.goToPreviousPhase}
        goToNextPhase={controller.goToNextPhase}
        onCompleteBuild={completeBuild}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.backgroundDeep,
  },
  headerCompact: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  headerTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  title: {
    color: theme.colors.textPrimary,
    ...typography.titleLg,
    flexShrink: 1,
  },
  statusBadge: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  completeBadge: {
    backgroundColor: theme.colors.accentSuccess,
    borderColor: theme.colors.accentSuccessSoft,
  },
  statusBadgeLabel: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  completeBadgeLabel: {
    color: theme.colors.backgroundDeep,
  },
  statusText: {
    color: theme.colors.textMuted,
    ...typography.meta,
    marginTop: 4,
  },
  statusTextError: {
    color: theme.colors.danger,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.xl,
  },
});
