import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BuilderClassCard } from '@/features/builder/components/BuilderClassCard';
import { BuilderClassDetailSheet } from '@/features/builder/components/BuilderClassDetailSheet';
import { BuilderImpactConfirmationSheet } from '@/features/builder/components/BuilderImpactConfirmationSheet';
import type { BuilderDraftPayload } from '@/features/builder/types';
import { getClassEditionBadge } from '@/features/builder/utils/classMetadata';
import type { ChoiceGrant, ContentEntity } from '@/shared/types/domain';
import {
  getGrantSelectionCount,
  getGrantTitle,
  getSubclassUnlockLevel,
} from '@/features/builder/utils/classStep';
import { theme, typography } from '@/shared/ui/theme';

interface BuilderStepClassProps {
  payload: BuilderDraftPayload;
  classEntitiesById: Record<string, ContentEntity>;
  subclassesByClassId: Record<string, readonly ContentEntity[]>;
  applicableGrants: readonly ChoiceGrant[];
  grantOptionsByGrantId: Record<string, readonly ContentEntity[]>;
  availableClasses: readonly ContentEntity[];
  totalAllocatedLevel: number;
  classImpactSummary: string | null;
  addClassAllocation: (classId: string) => void;
  updateAllocation: (
    allocationId: string,
    updater: (current: BuilderDraftPayload['classStep']['allocations'][number]) => BuilderDraftPayload['classStep']['allocations'][number],
  ) => void;
  removeAllocation: (allocationId: string) => void;
  updateFeatureSelection: (grantId: string, optionId: string, count: number) => void;
}

function getAllocationStatusLabel(payload: BuilderDraftPayload, allocation: BuilderDraftPayload['classStep']['allocations'][number]) {
  const allocationIssues = payload.review.issues.filter(
    (issue) =>
      issue.step === 'class' &&
      !issue.resolvedByOverride &&
      (issue.id.includes(allocation.id) || issue.id.includes(allocation.classId) || issue.id === 'duplicate-class-allocations'),
  );

  if (allocationIssues.some((issue) => issue.category === 'blocker' || issue.category === 'checklist')) {
    return 'Fix';
  }

  if (allocationIssues.some((issue) => issue.category === 'notice')) {
    return 'Need';
  }

  return 'OK';
}

function buildRemovalImpacts(allocation: BuilderDraftPayload['classStep']['allocations'][number], classEntity?: ContentEntity) {
  const impacts = [`${classEntity?.name ?? 'This class'} will be removed from the build.`];

  if (allocation.subclassId) {
    impacts.push('Subclass selection will be cleared.');
  }

  impacts.push('Class-owned feature choices and spell selections will be reconciled after removal.');

  return impacts;
}

export function BuilderStepClass({
  payload,
  classEntitiesById,
  subclassesByClassId,
  applicableGrants,
  grantOptionsByGrantId,
  availableClasses,
  totalAllocatedLevel,
  classImpactSummary,
  addClassAllocation,
  updateAllocation,
  removeAllocation,
  updateFeatureSelection,
}: BuilderStepClassProps) {
  const router = useRouter();
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [detailClassId, setDetailClassId] = useState<string | null>(null);
  const [pendingRemoveAllocationId, setPendingRemoveAllocationId] = useState<string | null>(null);
  const hasSelectedClass = payload.classStep.allocations.length > 0;
  const detailClass = detailClassId ? classEntitiesById[detailClassId] ?? availableClasses.find((entry) => entry.id === detailClassId) ?? null : null;
  const detailClassIsSelected = Boolean(detailClassId && payload.classStep.allocations.some((allocation) => allocation.classId === detailClassId));
  const pendingRemoveAllocation = payload.classStep.allocations.find((allocation) => allocation.id === pendingRemoveAllocationId) ?? null;
  const pendingRemoveClass = pendingRemoveAllocation ? classEntitiesById[pendingRemoveAllocation.classId] : undefined;

  const openCompendiumForClass = (classEntity: ContentEntity) => {
    router.push(`/(app)/compendium/class/${encodeURIComponent(classEntity.id)}` as never);
  };

  const renderClassPicker = (classes: readonly ContentEntity[]) => (
    <View style={styles.classCardList}>
      {classes.map((classEntity) => (
        <BuilderClassCard key={classEntity.id} classEntity={classEntity} onPress={() => setDetailClassId(classEntity.id)} />
      ))}
      {classes.length === 0 ? <Text style={styles.emptyHint}>No additional builder-selectable classes are available.</Text> : null}
    </View>
  );

  const confirmClassChoice = () => {
    if (!detailClass || detailClassIsSelected) {
      setDetailClassId(null);
      return;
    }

    addClassAllocation(detailClass.id);
    setShowClassPicker(false);
    setDetailClassId(null);
  };

  const confirmRemoveClass = () => {
    if (!pendingRemoveAllocation) {
      setPendingRemoveAllocationId(null);
      return;
    }

    removeAllocation(pendingRemoveAllocation.id);
    setPendingRemoveAllocationId(null);
    setShowClassPicker(false);
  };

  return (
    <View style={styles.section}>
      {!hasSelectedClass ? renderClassPicker(availableClasses) : null}

      {hasSelectedClass ? (
        <>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Selected classes</Text>
            <Text style={styles.sectionMeta}>Total level {totalAllocatedLevel}</Text>
          </View>

          {classImpactSummary ? <Text style={styles.impactBanner}>{classImpactSummary}</Text> : null}

          <View style={styles.allocationList}>
            {payload.classStep.allocations.map((allocation) => {
              const classEntity = classEntitiesById[allocation.classId];
              const subclassOptions = allocation.classId ? subclassesByClassId[allocation.classId] ?? [] : [];
              const subclassUnlockLevel = classEntity ? getSubclassUnlockLevel(classEntity) : null;
              const canChooseSubclass = subclassUnlockLevel == null ? subclassOptions.length > 0 : allocation.level >= subclassUnlockLevel;
              const statusLabel = getAllocationStatusLabel(payload, allocation);

              return (
                <View key={allocation.id} style={styles.allocationCard}>
                  <View style={styles.allocationHeader}>
                    <View style={styles.allocationHeading}>
                      <View style={styles.allocationTitleRow}>
                        <Text style={styles.allocationTitle}>{classEntity?.name ?? 'Unknown class'}</Text>
                        <View style={[styles.statusBadge, statusLabel === 'Fix' && styles.statusBadgeFix, statusLabel === 'Need' && styles.statusBadgeNeed]}>
                          <Text style={[styles.statusBadgeLabel, statusLabel === 'Fix' && styles.statusBadgeLabelFix]}>{statusLabel}</Text>
                        </View>
                      </View>
                      {classEntity ? (
                        <View style={styles.badgeRow}>
                          <View style={[styles.editionBadge, classEntity.isLegacy && styles.legacyBadge]}>
                            <Text style={[styles.editionBadgeLabel, classEntity.isLegacy && styles.legacyBadgeLabel]}>{getClassEditionBadge(classEntity)}</Text>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.levelControlBlock}>
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
                    <Text style={styles.levelHelp}>Combined class levels cannot exceed 20. Level changes can unlock or clear class decisions.</Text>
                  </View>

                  <View style={styles.summaryActionRow}>
                    {classEntity ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setDetailClassId(classEntity.id)}
                        style={({ pressed }) => [styles.secondaryActionButton, pressed && styles.secondaryActionButtonPressed]}
                      >
                        <Text style={styles.secondaryActionLabel}>Details</Text>
                      </Pressable>
                    ) : null}
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setPendingRemoveAllocationId(allocation.id)}
                      style={({ pressed }) => [styles.removeButton, pressed && styles.removeButtonPressed]}
                    >
                      <Text style={styles.removeButtonLabel}>Remove</Text>
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
              <Text style={styles.addClassButtonLabel}>{showClassPicker ? 'Hide class options' : 'Add another class'}</Text>
            </Pressable>

            {showClassPicker ? renderClassPicker(availableClasses) : null}
          </View>
        </>
      ) : null}

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

      <BuilderClassDetailSheet
        classEntity={detailClass}
        isSelected={detailClassIsSelected}
        onChoose={confirmClassChoice}
        onClose={() => setDetailClassId(null)}
        onOpenCompendium={() => detailClass ? openCompendiumForClass(detailClass) : undefined}
        visible={Boolean(detailClass)}
      />

      <BuilderImpactConfirmationSheet
        confirmLabel="Remove class"
        impacts={pendingRemoveAllocation ? buildRemovalImpacts(pendingRemoveAllocation, pendingRemoveClass) : []}
        message="Removing a class can change level totals and invalidate related choices. You can add classes again afterward."
        onCancel={() => setPendingRemoveAllocationId(null)}
        onConfirm={confirmRemoveClass}
        title="Remove class?"
        visible={Boolean(pendingRemoveAllocation)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  classCardList: {
    gap: theme.spacing.md,
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
    gap: theme.spacing.md,
  },
  allocationHeading: {
    gap: theme.spacing.sm,
  },
  allocationTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  allocationTitle: {
    color: theme.colors.textPrimary,
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
  },
  badgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  editionBadge: {
    backgroundColor: theme.colors.accentPrimaryDeep,
    borderRadius: theme.radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  editionBadgeLabel: {
    color: theme.colors.accentPrimarySoft,
    fontSize: 12,
    fontWeight: '800',
  },
  legacyBadge: {
    backgroundColor: theme.colors.accentLegacy,
  },
  legacyBadgeLabel: {
    color: theme.colors.accentLegacySoft,
  },
  statusBadge: {
    backgroundColor: theme.colors.surfaceSuccess,
    borderColor: theme.colors.accentSuccess,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeFix: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.danger,
  },
  statusBadgeNeed: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.accentLegacy,
  },
  statusBadgeLabel: {
    color: theme.colors.accentSuccessSoft,
    fontSize: 11,
    fontWeight: '800',
  },
  statusBadgeLabelFix: {
    color: theme.colors.danger,
  },
  levelControlBlock: {
    gap: theme.spacing.xs,
  },
  levelControls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  levelHelp: {
    color: theme.colors.textMuted,
    ...typography.meta,
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
  summaryActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  secondaryActionButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  secondaryActionButtonPressed: {
    borderColor: theme.colors.accentPrimary,
  },
  secondaryActionLabel: {
    color: theme.colors.textSecondary,
    ...typography.meta,
    fontWeight: '800',
  },
  removeButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: theme.spacing.md,
  },
  removeButtonPressed: {
    borderColor: theme.colors.danger,
  },
  removeButtonLabel: {
    color: theme.colors.danger,
    ...typography.meta,
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
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
  },
  addClassButtonPressed: {
    borderColor: theme.colors.accentPrimary,
  },
  addClassButtonDisabled: {
    opacity: 0.5,
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
});
