import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RenderBlockList } from '@/features/compendium/components/RenderBlockList';
import type { InlineReferenceContext } from '@/features/compendium/utils/inlineReferences';
import type { FeatureProgressionRow } from '@/features/compendium/utils/classDetails';
import { buildRenderBlocksFromEntries } from '@/features/compendium/utils/detailBlocks';
import { theme } from '@/shared/ui/theme';

interface FeatureProgressionListProps {
  rows: FeatureProgressionRow[];
  emptyLabel?: string;
  referenceContext?: InlineReferenceContext;
}

export function FeatureProgressionList({ rows, emptyLabel = 'No feature progression is available for this entry yet.', referenceContext }: FeatureProgressionListProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set());

  if (rows.length === 0) {
    return <Text style={styles.emptyText}>{emptyLabel}</Text>;
  }

  function toggleRow(rowKey: string) {
    setExpandedKeys((currentKeys) => {
      const nextKeys = new Set(currentKeys);
      if (nextKeys.has(rowKey)) {
        nextKeys.delete(rowKey);
      } else {
        nextKeys.add(rowKey);
      }
      return nextKeys;
    });
  }

  return (
    <View style={styles.list}>
      {rows.map((row, index) => {
        const rowKey = `${row.ref}:${index}`;
        const hasDetails = row.detailEntries.length > 0;
        const isExpanded = expandedKeys.has(rowKey);

        return (
          <Pressable
            key={rowKey}
            accessibilityRole={hasDetails ? 'button' : undefined}
            disabled={!hasDetails}
            onPress={() => toggleRow(rowKey)}
            style={({ pressed }) => [
              styles.row,
              row.isSubclassUnlock && styles.unlockRow,
              hasDetails && styles.expandableRow,
              pressed && styles.pressedRow,
            ]}
          >
            <View style={styles.rowHeader}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelLabel}>{row.level == null ? 'Level ?' : `Level ${row.level}`}</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureName}>{row.name}</Text>
                <Text style={styles.featureMeta}>
                  {[row.sourceCode, row.isSubclassUnlock ? 'Subclass unlock' : null].filter(Boolean).join(' • ')}
                </Text>
                {hasDetails ? (
                  <Text style={styles.expandLabel}>{isExpanded ? 'Hide details' : 'Show details'}</Text>
                ) : null}
              </View>
            </View>

            {isExpanded ? (
              <View style={styles.detailPanel}>
                <RenderBlockList blocks={buildRenderBlocksFromEntries(row.detailEntries)} referenceContext={referenceContext} />
              </View>
            ) : null}
          </Pressable>
        );
      })}
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
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  rowHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  expandableRow: {
    borderColor: theme.colors.borderAccent,
  },
  pressedRow: {
    opacity: 0.86,
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
  expandLabel: {
    color: theme.colors.accentPrimarySoft,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
    marginTop: 2,
  },
  detailPanel: {
    borderColor: theme.colors.borderSubtle,
    borderTopWidth: 1,
    marginTop: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
    width: '100%',
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
});
