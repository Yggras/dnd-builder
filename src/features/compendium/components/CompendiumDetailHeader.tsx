import { StyleSheet, Text, View } from 'react-native';

import { getCompendiumTypeLabel } from '@/features/compendium/utils/detailFacts';
import { getEditionLabel } from '@/features/compendium/utils/catalog';
import type { CompendiumEntry } from '@/shared/types/domain';
import { theme, typography } from '@/shared/ui/theme';

interface CompendiumDetailHeaderProps {
  entry: CompendiumEntry;
}

export function CompendiumDetailHeader({ entry }: CompendiumDetailHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>Compendium Entry</Text>
      <Text style={styles.title}>{entry.name}</Text>
      <Text style={styles.sourceText}>{entry.sourceName}</Text>
      <View style={styles.metaRow}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeLabel}>{getCompendiumTypeLabel(entry)}</Text>
        </View>
        <View style={[styles.editionBadge, entry.isLegacy && styles.legacyBadge]}>
          <Text style={[styles.editionBadgeLabel, entry.isLegacy && styles.legacyBadgeLabel]}>
            {getEditionLabel(entry.rulesEdition, entry.isLegacy)}
          </Text>
        </View>
        <View style={styles.sourceBadge}>
          <Text style={styles.sourceBadgeLabel}>{entry.sourceCode}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: theme.spacing.sm,
  },
  eyebrow: {
    color: theme.colors.accentPrimarySoft,
    ...typography.eyebrow,
  },
  title: {
    color: theme.colors.textPrimary,
    ...typography.titleLg,
  },
  sourceText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  typeBadge: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  typeBadgeLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  editionBadge: {
    backgroundColor: theme.colors.accentPrimaryDeep,
    borderRadius: theme.radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editionBadgeLabel: {
    color: theme.colors.accentPrimarySoft,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  legacyBadge: {
    backgroundColor: theme.colors.accentLegacy,
  },
  legacyBadgeLabel: {
    color: theme.colors.accentLegacySoft,
  },
  sourceBadge: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sourceBadgeLabel: {
    color: theme.colors.accentSuccessSoft,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
