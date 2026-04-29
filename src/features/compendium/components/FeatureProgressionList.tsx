import { StyleSheet, Text, View } from 'react-native';

import type { FeatureProgressionRow } from '@/features/compendium/utils/classDetails';
import { theme } from '@/shared/ui/theme';

interface FeatureProgressionListProps {
  rows: FeatureProgressionRow[];
  emptyLabel?: string;
}

export function FeatureProgressionList({ rows, emptyLabel = 'No feature progression is available for this entry yet.' }: FeatureProgressionListProps) {
  if (rows.length === 0) {
    return <Text style={styles.emptyText}>{emptyLabel}</Text>;
  }

  return (
    <View style={styles.list}>
      {rows.map((row, index) => (
        <View key={`${row.level ?? 'unknown'}:${row.name}:${index}`} style={[styles.row, row.isSubclassUnlock && styles.unlockRow]}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelLabel}>{row.level == null ? 'Level ?' : `Level ${row.level}`}</Text>
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureName}>{row.name}</Text>
            <Text style={styles.featureMeta}>
              {[row.sourceCode, row.isSubclassUnlock ? 'Subclass unlock' : null].filter(Boolean).join(' • ')}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: theme.spacing.sm,
  },
  row: {
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  unlockRow: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderAccent,
  },
  levelBadge: {
    backgroundColor: theme.colors.accentPrimaryDeep,
    borderRadius: theme.radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  levelLabel: {
    color: theme.colors.accentPrimarySoft,
    fontSize: 11,
    fontWeight: '800',
  },
  featureContent: {
    flex: 1,
    gap: 3,
  },
  featureName: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  featureMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
});
