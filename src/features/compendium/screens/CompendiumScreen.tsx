import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';

import { useCompendiumSearch, type CompendiumEntryTypeFilter } from '@/features/compendium/hooks/useCompendiumSearch';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { theme, typography } from '@/shared/ui/theme';

const entryTypeOptions: { label: string; value: CompendiumEntryTypeFilter }[] = [
  { label: 'All entries', value: 'all' },
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  if (isLoading && !data) {
    return <LoadingState label="Loading local compendium..." />;
  }

  if (error && !data) {
    return <ErrorState title="Compendium unavailable" message={error instanceof Error ? error.message : 'Compendium search failed.'} />;
  }

  const entries = data ?? [];
  const activeFilterLabel = useMemo(
    () => entryTypeOptions.find((option) => option.value === entryType)?.label ?? 'All entries',
    [entryType],
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View pointerEvents="none" style={styles.backdrop} />

      <FlatList
        contentContainerStyle={styles.content}
        data={entries}
        keyExtractor={(entry) => entry.id}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No entries matched</Text>
            <Text style={styles.emptyMessage}>Try a different search or switch the filter.</Text>
          </View>
        }
        ListHeaderComponent={
          <View style={styles.stickyHeader}>
            <View style={styles.searchRow}>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setQuery}
                placeholder="Search spells, feats, species, items..."
                placeholderTextColor={theme.colors.textFaint}
                returnKeyType="search"
                style={styles.searchInput}
                value={query}
              />

              {query ? (
                <Pressable accessibilityRole="button" onPress={() => setQuery('')} style={({ pressed }) => [styles.utilityButton, pressed && styles.utilityButtonPressed]}>
                  <Text style={styles.utilityButtonLabel}>Clear</Text>
                </Pressable>
              ) : null}

              <Pressable accessibilityRole="button" onPress={() => setIsFilterOpen(true)} style={({ pressed }) => [styles.utilityButton, styles.filterButton, pressed && styles.utilityButtonPressed]}>
                <Text style={styles.filterButtonLabel}>{entryType === 'all' ? 'Filter' : activeFilterLabel}</Text>
              </Pressable>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>
                {activeFilterLabel} • {entries.length} shown
              </Text>
              {isFetching ? <Text style={styles.updatingText}>Updating...</Text> : null}
            </View>
          </View>
        }
        renderItem={({ item: entry }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/(app)/compendium/${encodeURIComponent(entry.id)}`)}
            style={({ pressed }) => [styles.resultRow, pressed && styles.resultRowPressed]}
          >
            <View style={styles.resultTopRow}>
              <Text numberOfLines={1} style={styles.resultTitle}>
                {entry.name}
              </Text>

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

            <Text numberOfLines={1} style={styles.resultMetaText}>
              {entry.sourceCode} • {entry.sourceName}
            </Text>

            <Text numberOfLines={1} style={styles.resultSummary}>
              {entry.summary || entry.text || 'No summary available.'}
            </Text>
          </Pressable>
        )}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      />

      <Modal animationType="slide" onRequestClose={() => setIsFilterOpen(false)} transparent visible={isFilterOpen}>
        <Pressable onPress={() => setIsFilterOpen(false)} style={styles.modalBackdrop}>
          <Pressable onPress={() => undefined} style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filter entries</Text>
              <Pressable accessibilityRole="button" onPress={() => setIsFilterOpen(false)} style={({ pressed }) => [styles.sheetCloseButton, pressed && styles.utilityButtonPressed]}>
                <Text style={styles.sheetCloseLabel}>Done</Text>
              </Pressable>
            </View>

            <View style={styles.sheetOptions}>
              {entryTypeOptions.map((option) => {
                const isActive = option.value === entryType;

                return (
                  <Pressable
                    accessibilityRole="button"
                    key={option.value}
                    onPress={() => {
                      setEntryType(option.value);
                      setIsFilterOpen(false);
                    }}
                    style={({ pressed }) => [styles.sheetOption, isActive && styles.sheetOptionActive, pressed && styles.sheetOptionPressed]}
                  >
                    <Text style={[styles.sheetOptionLabel, isActive && styles.sheetOptionLabelActive]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.backgroundDeep,
  },
  content: {
    paddingBottom: theme.spacing.xxl,
  },
  stickyHeader: {
    backgroundColor: theme.colors.background,
    borderBottomColor: theme.colors.borderSubtle,
    borderBottomWidth: 1,
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  searchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    color: theme.colors.textPrimary,
    flex: 1,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
  },
  utilityButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
  },
  filterButton: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderAccent,
    maxWidth: 140,
  },
  utilityButtonPressed: {
    borderColor: theme.colors.accentPrimary,
  },
  utilityButtonLabel: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  filterButtonLabel: {
    color: theme.colors.accentPrimarySoft,
    fontSize: 13,
    fontWeight: '700',
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  summaryText: {
    color: theme.colors.textMuted,
    ...typography.meta,
  },
  updatingText: {
    color: theme.colors.accentSuccessSoft,
    ...typography.meta,
    fontWeight: '700',
  },
  resultRow: {
    backgroundColor: theme.colors.surface,
    borderBottomColor: theme.colors.borderSubtle,
    borderBottomWidth: 1,
    gap: 6,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  resultRowPressed: {
    backgroundColor: theme.colors.surfaceElevated,
  },
  resultTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  resultTitle: {
    color: theme.colors.textPrimary,
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  badges: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: 6,
  },
  typeBadge: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  typeBadgeLabel: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  editionBadge: {
    backgroundColor: theme.colors.accentPrimaryDeep,
    borderRadius: theme.radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editionBadgeLabel: {
    color: theme.colors.accentPrimarySoft,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  legacyBadge: {
    backgroundColor: theme.colors.accentLegacy,
  },
  legacyBadgeLabel: {
    color: theme.colors.accentLegacySoft,
  },
  resultMetaText: {
    color: theme.colors.textMuted,
    ...typography.meta,
  },
  resultSummary: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyState: {
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  emptyTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyMessage: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
  modalBackdrop: {
    backgroundColor: theme.colors.overlay,
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radii.lg,
    borderTopRightRadius: theme.radii.lg,
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: theme.colors.borderStrong,
    borderRadius: theme.radii.pill,
    height: 4,
    width: 40,
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  sheetTitle: {
    color: theme.colors.textPrimary,
    ...typography.sectionTitle,
  },
  sheetCloseButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  sheetCloseLabel: {
    color: theme.colors.accentPrimarySoft,
    fontSize: 14,
    fontWeight: '700',
  },
  sheetOptions: {
    gap: theme.spacing.sm,
  },
  sheetOption: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  sheetOptionActive: {
    backgroundColor: theme.colors.accentPrimaryDeep,
    borderColor: theme.colors.accentPrimary,
  },
  sheetOptionPressed: {
    borderColor: theme.colors.accentPrimarySoft,
  },
  sheetOptionLabel: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  sheetOptionLabelActive: {
    color: theme.colors.textPrimary,
  },
});
