import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useCompendiumEntry } from '@/features/compendium/hooks/useCompendiumEntry';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { Screen } from '@/shared/ui/Screen';

function getEditionLabel(rulesEdition: string, isLegacy: boolean) {
  if (isLegacy || rulesEdition === '2014') {
    return '2014';
  }

  return '2024';
}

function getEntryTypeLabel(entryType: string) {
  switch (entryType) {
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
        <Text style={styles.title}>{entry.name}</Text>
        <View style={styles.metaRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeLabel}>{getEntryTypeLabel(entry.entryType)}</Text>
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
        <Text style={styles.sourceText}>{entry.sourceName}</Text>
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
    gap: 20,
    paddingBottom: 32,
  },
  header: {
    gap: 10,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 30,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeBadge: {
    backgroundColor: '#1E293B',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  typeBadgeLabel: {
    color: '#CBD5E1',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
  },
  editionBadge: {
    backgroundColor: '#312E81',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editionBadgeLabel: {
    color: '#EDE9FE',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
  },
  legacyBadge: {
    backgroundColor: '#78350F',
  },
  legacyBadgeLabel: {
    color: '#FDE68A',
  },
  sourceBadge: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sourceBadgeLabel: {
    color: '#93C5FD',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
  },
  sourceText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  summaryPanel: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: 18,
  },
  summaryLabel: {
    color: '#C4B5FD',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  summaryText: {
    color: '#E2E8F0',
    fontSize: 15,
    lineHeight: 23,
  },
  bodyPanel: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  bodyLabel: {
    color: '#C4B5FD',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  bodyText: {
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 24,
  },
});
