import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BuilderClassCard } from '@/features/builder/components/BuilderClassCard';
import { BuilderClassDetailSheet } from '@/features/builder/components/BuilderClassDetailSheet';
import { BuilderFeatureChoiceGroup } from '@/features/builder/components/BuilderFeatureChoiceGroup';
import { BuilderFeatureOptionDetailSheet } from '@/features/builder/components/BuilderFeatureOptionDetailSheet';
import { BuilderImpactConfirmationSheet } from '@/features/builder/components/BuilderImpactConfirmationSheet';
import { BuilderSubclassCard } from '@/features/builder/components/BuilderSubclassCard';
import { BuilderSubclassDetailSheet } from '@/features/builder/components/BuilderSubclassDetailSheet';
import type { BuilderDraftPayload } from '@/features/builder/types';
import { getClassEditionBadge } from '@/features/builder/utils/classMetadata';
import { getCompendiumEntryIdFromEntityId } from '@/features/compendium/utils/catalog';
import type { ChoiceGrant, ContentEntity } from '@/shared/types/domain';
import { getSubclassUnlockLevel } from '@/features/builder/utils/classStep';
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

type SubclassDetailTarget = {
  allocationId: string;
  subclassId: string;
};

type SubclassChangeTarget = {
  allocationId: string;
  subclassId: string | null;
};

type FeatureOptionDetailTarget = {
  grantId: string;
  optionId: string;
};

type DecisionItem =
  | { kind: 'subclass'; level: number }
  | { kind: 'grant'; level: number; grant: ChoiceGrant };

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

function getSubclassIssues(payload: BuilderDraftPayload, allocationId: string) {
  return payload.review.issues.filter((issue) => issue.step === 'class' && !issue.resolvedByOverride && issue.id === `subclass-required-${allocationId}`);
}

function getGrantIssues(payload: BuilderDraftPayload, grantId: string) {
  return payload.review.issues.filter(
    (issue) => issue.step === 'class' && !issue.resolvedByOverride && (issue.id === `grant-options-${grantId}` || issue.id === `grant-selection-${grantId}`),
  );
}

function hasSubclassDependentSelections(payload: BuilderDraftPayload) {
  return Array.isArray(payload.spellsStep.selections) && payload.spellsStep.selections.length > 0;
}

function buildSubclassChangeImpacts() {
  return ['Existing spell selections may need review after this subclass change.'];
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
  const [detailSubclass, setDetailSubclass] = useState<SubclassDetailTarget | null>(null);
  const [detailFeatureOption, setDetailFeatureOption] = useState<FeatureOptionDetailTarget | null>(null);
  const [pendingRemoveAllocationId, setPendingRemoveAllocationId] = useState<string | null>(null);
  const [pendingSubclassChange, setPendingSubclassChange] = useState<SubclassChangeTarget | null>(null);
  const hasSelectedClass = payload.classStep.allocations.length > 0;
  const detailClass = detailClassId ? classEntitiesById[detailClassId] ?? availableClasses.find((entry) => entry.id === detailClassId) ?? null : null;
  const detailClassIsSelected = Boolean(detailClassId && payload.classStep.allocations.some((allocation) => allocation.classId === detailClassId));
  const detailSubclassAllocation = detailSubclass ? payload.classStep.allocations.find((allocation) => allocation.id === detailSubclass.allocationId) ?? null : null;
  const detailSubclassEntity = detailSubclassAllocation && detailSubclass ? (subclassesByClassId[detailSubclassAllocation.classId] ?? []).find((subclass) => subclass.id === detailSubclass.subclassId) ?? null : null;
  const detailSubclassUnlockLevel = detailSubclassAllocation ? getSubclassUnlockLevel(classEntitiesById[detailSubclassAllocation.classId]) : null;
  const detailSubclassIsLocked = detailSubclassAllocation ? detailSubclassUnlockLevel != null && detailSubclassAllocation.level < detailSubclassUnlockLevel : false;
  const detailSubclassIsSelected = Boolean(detailSubclassAllocation && detailSubclassEntity && detailSubclassAllocation.subclassId === detailSubclassEntity.id);
  const detailGrant = detailFeatureOption ? applicableGrants.find((grant) => grant.id === detailFeatureOption.grantId) ?? null : null;
  const detailGrantOptions = detailGrant ? grantOptionsByGrantId[detailGrant.id] ?? [] : [];
  const detailFeatureOptionEntity = detailFeatureOption ? detailGrantOptions.find((option) => option.id === detailFeatureOption.optionId) ?? null : null;
  const detailSelectedOptionIds = detailGrant ? payload.classStep.featureChoices.find((selection) => selection.grantId === detailGrant.id)?.selectedOptionIds ?? [] : [];
  const detailFeatureIsSelected = detailFeatureOptionEntity ? detailSelectedOptionIds.includes(detailFeatureOptionEntity.id) : false;
  const detailFeatureIsFull = detailGrant ? detailSelectedOptionIds.length >= detailGrant.count : false;
  const detailSelectedOptionNames = detailSelectedOptionIds.map((optionId) => detailGrantOptions.find((option) => option.id === optionId)?.name ?? optionId);
  const pendingRemoveAllocation = payload.classStep.allocations.find((allocation) => allocation.id === pendingRemoveAllocationId) ?? null;
  const pendingRemoveClass = pendingRemoveAllocation ? classEntitiesById[pendingRemoveAllocation.classId] : undefined;

  const openCompendiumForClass = (classEntity: ContentEntity) => {
    router.push(`/(app)/compendium/class/${encodeURIComponent(classEntity.id)}` as never);
  };

  const openCompendiumForEntity = (entity: ContentEntity) => {
    router.push(`/(app)/compendium/${encodeURIComponent(getCompendiumEntryIdFromEntityId(entity.id))}` as never);
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

  const applySubclassChange = (change: SubclassChangeTarget) => {
    updateAllocation(change.allocationId, (current) => ({ ...current, subclassId: change.subclassId }));
    setDetailSubclass(null);
  };

  const requestSubclassChange = (change: SubclassChangeTarget) => {
    const allocation = payload.classStep.allocations.find((entry) => entry.id === change.allocationId);
    const changesExistingSubclass = Boolean(allocation?.subclassId && allocation.subclassId !== change.subclassId);

    if (changesExistingSubclass && hasSubclassDependentSelections(payload)) {
      setPendingSubclassChange(change);
      return;
    }

    applySubclassChange(change);
  };

  const confirmSubclassChange = () => {
    if (pendingSubclassChange) {
      applySubclassChange(pendingSubclassChange);
    }

    setPendingSubclassChange(null);
  };

  const chooseFeatureOption = () => {
    if (!detailGrant || !detailFeatureOptionEntity || (!detailFeatureIsSelected && detailFeatureIsFull)) {
      return;
    }

    updateFeatureSelection(detailGrant.id, detailFeatureOptionEntity.id, detailGrant.count);
    setDetailFeatureOption(null);
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
              const subclassDecisionLevel = subclassUnlockLevel ?? 3;
              const statusLabel = getAllocationStatusLabel(payload, allocation);
              const classGrants = applicableGrants.filter((grant) => grant.sourceId === allocation.classId);
              const decisionItems: DecisionItem[] = [
                ...classGrants.map((grant): DecisionItem => ({ kind: 'grant', level: grant.atLevel, grant })),
                ...(subclassOptions.length > 0 ? [{ kind: 'subclass' as const, level: subclassDecisionLevel }] : []),
              ].sort((left, right) => left.level - right.level || (left.kind === 'subclass' ? -1 : 1));

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

                  {decisionItems.length > 0 ? (
                    <View style={styles.decisionList}>
                      {decisionItems.map((decision) => {
                        if (decision.kind === 'subclass') {
                          const subclassIssues = getSubclassIssues(payload, allocation.id);
                          const isLocked = allocation.level < decision.level;

                          return (
                            <View key={`subclass-${allocation.id}`} style={styles.decisionBlock}>
                              <View style={styles.decisionHeader}>
                                <Text style={styles.decisionTitle}>Subclass</Text>
                                <Text style={styles.decisionMeta}>Level {decision.level}</Text>
                              </View>
                              {subclassIssues.length > 0 ? (
                                <View style={styles.issueList}>
                                  {subclassIssues.map((issue) => <Text key={issue.id} style={styles.issueText}>{issue.summary}</Text>)}
                                </View>
                              ) : null}
                              <View style={styles.subclassCardList}>
                                {subclassOptions.map((subclass) => (
                                  <BuilderSubclassCard
                                    key={subclass.id}
                                    subclass={subclass}
                                    isLocked={isLocked}
                                    isSelected={allocation.subclassId === subclass.id}
                                    unlockLevel={decision.level}
                                    onPress={() => setDetailSubclass({ allocationId: allocation.id, subclassId: subclass.id })}
                                  />
                                ))}
                              </View>
                            </View>
                          );
                        }

                        const selectedOptionIds = payload.classStep.featureChoices.find((selection) => selection.grantId === decision.grant.id)?.selectedOptionIds ?? [];
                        const options = grantOptionsByGrantId[decision.grant.id] ?? [];
                        const grantIssues = getGrantIssues(payload, decision.grant.id);

                        return (
                          <BuilderFeatureChoiceGroup
                            key={decision.grant.id}
                            grant={decision.grant}
                            options={options}
                            selectedOptionIds={selectedOptionIds}
                            issues={grantIssues}
                            onOpenOption={(option) => setDetailFeatureOption({ grantId: decision.grant.id, optionId: option.id })}
                            onOpenClassCompendium={() => classEntity ? openCompendiumForClass(classEntity) : undefined}
                          />
                        );
                      })}
                    </View>
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

      <BuilderClassDetailSheet
        classEntity={detailClass}
        isSelected={detailClassIsSelected}
        onChoose={confirmClassChoice}
        onClose={() => setDetailClassId(null)}
        onOpenCompendium={() => detailClass ? openCompendiumForClass(detailClass) : undefined}
        visible={Boolean(detailClass)}
      />

      <BuilderSubclassDetailSheet
        subclass={detailSubclassEntity}
        isLocked={detailSubclassIsLocked}
        isSelected={detailSubclassIsSelected}
        unlockLevel={detailSubclassUnlockLevel}
        onChoose={() => detailSubclassAllocation && detailSubclassEntity ? requestSubclassChange({ allocationId: detailSubclassAllocation.id, subclassId: detailSubclassEntity.id }) : undefined}
        onRemove={() => detailSubclassAllocation ? requestSubclassChange({ allocationId: detailSubclassAllocation.id, subclassId: null }) : undefined}
        onClose={() => setDetailSubclass(null)}
        onOpenCompendium={() => detailSubclassEntity ? openCompendiumForEntity(detailSubclassEntity) : undefined}
        visible={Boolean(detailSubclassEntity)}
      />

      <BuilderFeatureOptionDetailSheet
        grant={detailGrant}
        option={detailFeatureOptionEntity}
        isSelected={detailFeatureIsSelected}
        isFull={detailFeatureIsFull}
        selectedOptionNames={detailSelectedOptionNames}
        onChoose={chooseFeatureOption}
        onRemove={chooseFeatureOption}
        onClose={() => setDetailFeatureOption(null)}
        onOpenCompendium={() => detailFeatureOptionEntity ? openCompendiumForEntity(detailFeatureOptionEntity) : undefined}
        visible={Boolean(detailFeatureOptionEntity && detailGrant)}
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

      <BuilderImpactConfirmationSheet
        confirmLabel="Confirm subclass change"
        impacts={buildSubclassChangeImpacts()}
        message="Changing this subclass may affect spell options tied to the current build."
        onCancel={() => setPendingSubclassChange(null)}
        onConfirm={confirmSubclassChange}
        title="Change subclass?"
        visible={Boolean(pendingSubclassChange)}
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
  decisionList: {
    gap: theme.spacing.md,
  },
  decisionBlock: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  decisionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  decisionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  decisionMeta: {
    color: theme.colors.textMuted,
    ...typography.meta,
  },
  issueList: {
    gap: theme.spacing.xs,
  },
  issueText: {
    color: theme.colors.accentLegacySoft,
    ...typography.meta,
    fontWeight: '700',
  },
  subclassCardList: {
    gap: theme.spacing.sm,
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
  emptyHint: {
    color: theme.colors.accentLegacySoft,
    fontSize: 13,
    lineHeight: 18,
  },
});
