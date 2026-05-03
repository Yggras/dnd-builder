import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { BuilderDraftPayload } from '@/features/builder/types';
import type { NormalizedAbilityRequirement } from '@/features/builder/utils/originAndAbilities';
import { getSelectedOriginPackageId } from '@/features/builder/hooks/useBuilderController';
import { theme, typography } from '@/shared/ui/theme';

interface BuilderStepAbilityPointsProps {
  payload: BuilderDraftPayload;
  originAbilityRequirements: readonly NormalizedAbilityRequirement[];
  originAbilityPackageSelections: BuilderDraftPayload['abilityPointsStep']['originAbilityPackageSelections'];
  availableAsiPoints: number;
  spentAsiPoints: number;
  updateBaseAbilityScore: (ability: string, value: string) => void;
  updateAsiPoint: (ability: string, delta: number) => void;
  updateOriginAbilityPackageSelection: (sourceType: 'species' | 'background', sourceId: string, packageId: string) => void;
  updateOriginAbilitySelection: (
    sourceType: 'species' | 'background',
    sourceId: string,
    packageId: string,
    choiceGroupId: string,
    ability: string,
    amount: number,
    maxSelections: number,
  ) => void;
}

export function BuilderStepAbilityPoints({
  payload,
  originAbilityRequirements,
  originAbilityPackageSelections,
  availableAsiPoints,
  spentAsiPoints,
  updateBaseAbilityScore,
  updateAsiPoint,
  updateOriginAbilityPackageSelection,
  updateOriginAbilitySelection,
}: BuilderStepAbilityPointsProps) {
  return (
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
            <Text style={styles.abilityMeta}>
              Final {payload.abilityPointsStep.scores[ability] ?? payload.abilityPointsStep.baseScores[ability] ?? 0}
            </Text>
            <View style={styles.asiControls}>
              <Pressable
                accessibilityRole="button"
                onPress={() => updateAsiPoint(ability, -1)}
                style={({ pressed }) => [styles.levelButton, pressed && styles.levelButtonPressed]}
              >
                <Text style={styles.levelButtonLabel}>-</Text>
              </Pressable>
              <Text style={styles.asiCounter}>
                +{payload.abilityPointsStep.bonusSelections.filter((selection) => selection.sourceType === 'asi' && selection.ability === ability).length}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => updateAsiPoint(ability, 1)}
                style={({ pressed }) => [
                  styles.levelButton,
                  pressed && styles.levelButtonPressed,
                  spentAsiPoints >= availableAsiPoints && styles.levelButtonDisabled,
                ]}
              >
                <Text style={styles.levelButtonLabel}>+</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.validationHint}>
        ASI points available: {availableAsiPoints}. Spent: {spentAsiPoints}.
      </Text>

      {originAbilityRequirements.map((requirement) => {
        if (requirement.packages.length === 0) {
          return null;
        }

        const selectedPackageId = getSelectedOriginPackageId(requirement, originAbilityPackageSelections ?? []);
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
  validationHint: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
  optionBlock: {
    gap: theme.spacing.sm,
  },
  optionBlockLabel: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  fieldGroup: {
    gap: theme.spacing.sm,
  },
  choiceGroup: {
    gap: theme.spacing.sm,
  },
  choiceGroupLabel: {
    color: theme.colors.textSecondary,
    ...typography.meta,
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
});
