import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useCompendiumSearch, type CompendiumEntryTypeFilter } from '@/features/compendium/hooks/useCompendiumSearch';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { Screen } from '@/shared/ui/Screen';

const entryTypeOptions: { label: string; value: CompendiumEntryTypeFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Species', value: 'species' },
  { label: 'Classes', value: 'class' },
  { label: 'Subclasses', value: 'subclass' },
  { label: 'Feats', value: 'feat' },
  { label: 'Options', value: 'optionalfeature' },
  { label: 'Spells', value: 'spell' },
  { label: 'Items', value: 'item' },
];

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

export function CompendiumScreen() {
  const router = useRouter();
  const { data, error, isLoading, isFetching, query, setQuery, entryType, setEntryType } = useCompendiumSearch();

  if (isLoading && !data) {
    return <LoadingState label="Loading local compendium..." />;
  }

  if (error && !data) {
    return <ErrorState title="Compendium unavailable" message={error instanceof Error ? error.message : 'Compendium search failed.'} />;
  }

  const entries = data ?? [];

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Compendium</Text>
        <Text style={styles.title}>Search the local rules library</Text>
        <Text style={styles.description}>
          Browse seeded 5e content offline. Results favor 2024-first entries and show the first 100 matches.
        </Text>
      </View>

      <View style={styles.searchPanel}>
        <Text style={styles.label}>Search entries</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder="Search spells, feats, species, items..."
          placeholderTextColor="#64748B"
          style={styles.searchInput}
          value={query}
        />

        <View style={styles.filters}>
          {entryTypeOptions.map((option) => {
            const isActive = option.value === entryType;

            return (
              <Pressable
                key={option.value}
                onPress={() => setEntryType(option.value)}
                style={({ pressed }) => [styles.filterChip, isActive && styles.filterChipActive, pressed && styles.filterChipPressed]}
              >
                <Text style={[styles.filterChipLabel, isActive && styles.filterChipLabelActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>Results</Text>
        <Text style={styles.resultsMeta}>
          {entries.length} shown{isFetching ? ' • Updating...' : ''}
        </Text>
      </View>

      {entries.length ? (
        <View style={styles.resultsList}>
          {entries.map((entry) => (
            <Pressable
              key={entry.id}
              onPress={() => router.push(`/(app)/compendium/${encodeURIComponent(entry.id)}`)}
              style={({ pressed }) => [styles.resultCard, pressed && styles.resultCardPressed]}
            >
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>{entry.name}</Text>
                <View style={styles.badges}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeLabel}>{getEntryTypeLabel(entry.entryType)}</Text>
                  </View>
                  <View style={[styles.editionBadge, entry.isLegacy && styles.legacyBadge]}>
                    <Text style={[styles.editionBadgeLabel, entry.isLegacy && styles.legacyBadgeLabel]}>
                      {getEditionLabel(entry.rulesEdition, entry.isLegacy)}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.resultMetaText}>
                {entry.sourceCode} • {entry.sourceName}
              </Text>
              <Text numberOfLines={3} style={styles.resultSummary}>
                {entry.summary || entry.text || 'No summary available.'}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No entries matched</Text>
          <Text style={styles.emptyMessage}>Try a different search term or switch the type filter.</Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    paddingBottom: 32,
  },
  hero: {
    gap: 10,
  },
  eyebrow: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 30,
    fontWeight: '700',
  },
  description: {
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 22,
  },
  searchPanel: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  label: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  searchInput: {
    backgroundColor: '#020617',
    borderColor: '#334155',
    borderRadius: 14,
    borderWidth: 1,
    color: '#F8FAFC',
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  filterChipActive: {
    backgroundColor: '#312E81',
    borderColor: '#8B5CF6',
  },
  filterChipPressed: {
    opacity: 0.92,
  },
  filterChipLabel: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipLabelActive: {
    color: '#F5F3FF',
  },
  resultsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultsTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  resultsMeta: {
    color: '#94A3B8',
    fontSize: 13,
  },
  resultsList: {
    gap: 12,
  },
  resultCard: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  resultCardPressed: {
    borderColor: '#8B5CF6',
  },
  resultHeader: {
    gap: 10,
  },
  resultTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '700',
  },
  badges: {
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
  resultMetaText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  resultSummary: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 21,
  },
  emptyState: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    padding: 20,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyMessage: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 21,
  },
});
