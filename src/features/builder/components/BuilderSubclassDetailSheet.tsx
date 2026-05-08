import { StyleSheet, Text, View } from 'react-native';

import { BuilderChoiceSheet } from '@/features/builder/components/BuilderChoiceSheet';
import { getClassEditionBadge } from '@/features/builder/utils/classMetadata';
import { buildSubclassFeatureRows } from '@/features/compendium/utils/classDetails';
import type { CompendiumEntry, ContentEntity } from '@/shared/types/domain';
import { theme, typography } from '@/shared/ui/theme';

interface BuilderSubclassDetailSheetProps {
  visible: boolean;
  subclass: ContentEntity | null;
  isLocked: boolean;
  isSelected: boolean;
  unlockLevel: number | null;
  onClose: () => void;
  onChoose: () => void;
  onRemove: () => void;
  onOpenCompendium: () => void;
}

function getFeaturePreviewRows(subclass: ContentEntity) {
  return buildSubclassFeatureRows({ metadata: subclass.metadata } as CompendiumEntry).slice(0, 4);
}

export function BuilderSubclassDetailSheet({
  visible,
  subclass,
  isLocked,
  isSelected,
  unlockLevel,
  onClose,
  onChoose,
  onRemove,
  onOpenCompendium,
}: BuilderSubclassDetailSheetProps) {
  const featureRows = subclass ? getFeaturePreviewRows(subclass) : [];
  const helperText = isLocked ? `Available at class level ${unlockLevel ?? 3}` : null;
  const primaryAction = isSelected
    ? { label: 'Remove subclass', onPress: onRemove, destructive: true }
    : { label: 'Choose subclass', onPress: onChoose, disabled: isLocked };

  return (
    <BuilderChoiceSheet
      visible={visible && Boolean(subclass)}
      title={subclass?.name ?? 'Subclass details'}
      subtitle="Subclass feature preview"
      onClose={onClose}
      helperText={helperText}
      primaryAction={primaryAction}
      secondaryAction={{ label: 'Open in Compendium', onPress: onOpenCompendium }}
    >
      {subclass ? (
        <>
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Feature Preview</Text>
            <View style={styles.previewList}>
              {featureRows.length > 0 ? featureRows.map((row) => (
                <View key={`${row.level}-${row.name}`} style={styles.previewRow}>
                  <Text style={styles.previewLevel}>{row.level == null ? 'Level ?' : `Level ${row.level}`}</Text>
                  <Text style={styles.previewName}>{row.name}</Text>
                </View>
              )) : <Text style={styles.emptyText}>Not structured yet.</Text>}
            </View>
          </View>

          <View style={styles.badgeRow}>
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceBadgeLabel}>{subclass.sourceCode}</Text>
            </View>
            <View style={[styles.editionBadge, subclass.isLegacy && styles.legacyBadge]}>
              <Text style={[styles.editionBadgeLabel, subclass.isLegacy && styles.legacyBadgeLabel]}>{getClassEditionBadge(subclass)}</Text>
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.summaryText}>{subclass.summary || 'No short subclass summary is structured yet.'}</Text>
          </View>
        </>
      ) : null}
    </BuilderChoiceSheet>
  );
}

const styles = StyleSheet.create({
  sectionBlock: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    ...typography.sectionTitle,
  },
  previewList: {
    gap: theme.spacing.sm,
  },
  previewRow: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    gap: 3,
    padding: theme.spacing.sm,
  },
  previewLevel: {
    color: theme.colors.textFaint,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  previewName: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  emptyText: {
    color: theme.colors.textMuted,
    ...typography.bodySm,
  },
  badgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  sourceBadge: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sourceBadgeLabel: {
    color: theme.colors.accentSuccessSoft,
    ...typography.meta,
    fontWeight: '800',
  },
  editionBadge: {
    backgroundColor: theme.colors.accentPrimaryDeep,
    borderRadius: theme.radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
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
  summaryText: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
});
