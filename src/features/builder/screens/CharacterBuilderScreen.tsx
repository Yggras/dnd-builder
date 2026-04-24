import { useEffect, useMemo, useRef, useState } from 'react';

import { useLocalSearchParams } from 'expo-router';
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
  const params = useLocalSearchParams<{ characterId?: string | string[] }>();
  const characterId = Array.isArray(params.characterId) ? params.characterId[0] : params.characterId ?? '';
  const { data, error, isLoading } = useCharacterRecord(characterId);
  const saveBuildMutation = useSaveCharacterBuild();
  const [draftBuild, setDraftBuild] = useState<CharacterBuild | null>(null);
  const lastSavedSnapshot = useRef<string | null>(null);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [classImpactSummary, setClassImpactSummary] = useState<string | null>(null);

  const classesQuery = useQuery({
    queryKey: ['builder', 'classes'],
    queryFn: () => contentService.listClasses(),
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
        <Text style={styles.sectionTitle}>Validation contract</Text>
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
