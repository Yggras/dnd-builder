import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BuilderDraftPayload } from '@/features/builder/types';
import type { ChoiceGrant, ContentEntity } from '@/shared/types/domain';
import {
  getGrantSelectionCount,
  getGrantTitle,
  getSubclassUnlockLevel,
  getSubclassUnlockLabel,
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
  const [showClassPicker, setShowClassPicker] = useState(false);

  return (
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
                onPress={() => {
                  addClassAllocation(classEntity.id);
                  setShowClassPicker(false);
                }}
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
});
