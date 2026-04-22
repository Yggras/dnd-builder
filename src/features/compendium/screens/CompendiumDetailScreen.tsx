import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useCompendiumEntry } from '@/features/compendium/hooks/useCompendiumEntry';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { Screen } from '@/shared/ui/Screen';
import { theme, typography } from '@/shared/ui/theme';

function getEditionLabel(rulesEdition: string, isLegacy: boolean) {
  if (isLegacy || rulesEdition === '2014') {
    return '2014';
  }

  return '2024';
}

function isEquipmentEntry(metadata: Record<string, unknown>) {
  const category = typeof metadata.category === 'string' ? metadata.category.toLowerCase() : null;
  const rarity = typeof metadata.rarity === 'string' ? metadata.rarity.toLowerCase() : null;

  return category === 'basic' || rarity == null || rarity === 'none';
}

function getEntryTypeLabel(entryType: string, metadata: Record<string, unknown>) {
  switch (entryType) {
    case 'background':
      return 'Background';
    case 'item':
      return isEquipmentEntry(metadata) ? 'Equipment' : 'Magic Item';
    case 'optionalfeature':
      return 'Option';
    case 'subclass':
      return 'Subclass';
    default:
      return entryType.charAt(0).toUpperCase() + entryType.slice(1);
  }
}

function flattenRenderPayload(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(flattenRenderPayload);
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  const record = value as { name?: unknown; entries?: unknown; items?: unknown };
  const parts: string[] = [];

  if (typeof record.name === 'string') {
    parts.push(record.name);
  }

  parts.push(...flattenRenderPayload(record.entries));
  parts.push(...flattenRenderPayload(record.items));

  return parts;
}

export function CompendiumDetailScreen() {
  const params = useLocalSearchParams<{ entryId?: string | string[] }>();
  const entryId = Array.isArray(params.entryId) ? params.entryId[0] : params.entryId ?? '';
  const { data: entry, error, isLoading } = useCompendiumEntry(entryId);

  if (isLoading) {
    return <LoadingState label="Loading compendium entry..." />;
  }

  if (error) {
    return <ErrorState title="Entry unavailable" message={error instanceof Error ? error.message : 'Failed to load entry.'} />;
  }

  if (!entry) {
    return <ErrorState title="Entry not found" message="The requested compendium entry could not be found in the local library." />;
  }

  const fallbackText = flattenRenderPayload(entry.renderPayload).join('\n\n').trim();
  const bodyText = (entry.text || fallbackText).trim() || 'No detail text is available for this entry yet.';

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Compendium Entry</Text>
        <Text style={styles.title}>{entry.name}</Text>
        <Text style={styles.sourceText}>{entry.sourceName}</Text>
        <View style={styles.metaRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeLabel}>{getEntryTypeLabel(entry.entryType, entry.metadata)}</Text>
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

      {entry.summary ? (
        <View style={styles.summaryPanel}>
          <Text style={styles.summaryLabel}>Summary</Text>
          <Text style={styles.summaryText}>{entry.summary}</Text>
        </View>
      ) : null}

      <View style={styles.bodyPanel}>
        <Text style={styles.bodyLabel}>Details</Text>
        <Text style={styles.bodyText}>{bodyText}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
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
  sourceText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  summaryPanel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  summaryLabel: {
    color: theme.colors.accentPrimarySoft,
    ...typography.eyebrow,
  },
  summaryText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
  },
  bodyPanel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  bodyLabel: {
    color: theme.colors.accentPrimarySoft,
    ...typography.eyebrow,
  },
  bodyText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 24,
  },
});
