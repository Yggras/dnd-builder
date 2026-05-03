import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BuilderDraftPayload } from '@/features/builder/types';
import type { ContentEntity } from '@/shared/types/domain';
import { theme, typography } from '@/shared/ui/theme';

interface BuilderStepOriginProps {
  payload: BuilderDraftPayload;
  availableSpecies: readonly ContentEntity[];
  availableBackgrounds: readonly ContentEntity[];
  speciesEntitiesById: Record<string, ContentEntity>;
  backgroundEntitiesById: Record<string, ContentEntity>;
  featEntitiesById: Record<string, ContentEntity>;
  selectedSpecies: ContentEntity | null;
  selectedBackground: ContentEntity | null;
  originImpactSummary: string | null;
  applyOriginPayloadChange: (nextPayload: BuilderDraftPayload) => void;
  updateGrantedFeatSelection: (sourceKey: 'speciesStep' | 'backgroundStep', sourceId: string, featId: string) => void;
}

export function BuilderStepOrigin({
  payload,
  availableSpecies,
  availableBackgrounds,
  featEntitiesById,
  selectedSpecies,
  selectedBackground,
  originImpactSummary,
  applyOriginPayloadChange,
  updateGrantedFeatSelection,
}: BuilderStepOriginProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Species and background</Text>
        <Text style={styles.sectionMeta}>Origin steps</Text>
      </View>

      {originImpactSummary ? <Text style={styles.impactBanner}>{originImpactSummary}</Text> : null}

      <View style={styles.optionBlock}>
        <Text style={styles.optionBlockLabel}>Species</Text>
        <View style={styles.optionChipWrap}>
          {availableSpecies.map((species) => {
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
          {availableBackgrounds.map((background) => {
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
  summaryList: {
    gap: 6,
  },
  summaryListItem: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
});
