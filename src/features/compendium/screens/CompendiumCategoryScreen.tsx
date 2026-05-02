import { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { useCompendiumCategoryBrowse } from '@/features/compendium/hooks/useCompendiumCategoryBrowse';
import type { CompendiumCategory } from '@/features/compendium/types';
import {
  compendiumCategoryLabels,
  compendiumCategorySummaries,
  getCompendiumEntryIdFromEntityId,
  getEditionLabel,
  getFeatTypeLabel,
  getItemTypeLabel,
  getRarityLabel,
  getSpellRoleTags,
  getSpellSchoolLabel,
  isMagicItem,
  spellHasConcentration,
} from '@/features/compendium/utils/catalog';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { theme, typography } from '@/shared/ui/theme';

const validCategories: CompendiumCategory[] = ['classes', 'backgrounds', 'feats', 'items', 'species', 'spells'];

function parseCategory(value: string | string[] | undefined): CompendiumCategory | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && validCategories.includes(candidate as CompendiumCategory) ? (candidate as CompendiumCategory) : null;
}

function renderMeta(category: CompendiumCategory, entry: Parameters<typeof useCompendiumCategoryBrowse>[0] extends never ? never : any) {
  switch (category) {
    case 'feats':
      return getFeatTypeLabel(entry);
    case 'items': {
      const parts = [isMagicItem(entry) ? 'Magic' : 'Mundane', getItemTypeLabel(entry), getRarityLabel(entry.metadata.rarity)].filter(Boolean);
      return parts.join(' • ');
    }
    case 'spells': {
      const parts = [
        Number(entry.metadata.level ?? 0) === 0 ? 'Cantrip' : `Level ${Number(entry.metadata.level ?? 0)}`,
        getSpellSchoolLabel(entry.metadata.school),
      ];
      if (Boolean(entry.metadata.ritual)) {
        parts.push('Ritual');
      }
      if (spellHasConcentration(entry)) {
        parts.push('Concentration');
      }
      return parts.filter(Boolean).join(' • ');
    }
    default:
      return `${entry.sourceCode} • ${getEditionLabel(entry.rulesEdition, entry.isLegacy)}`;
  }
}

export function CompendiumCategoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string | string[] }>();
  const category = parseCategory(params.category);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const browse = useCompendiumCategoryBrowse(category ?? 'classes');

  if (!category) {
    return <ErrorState title="Category unavailable" message="That compendium category does not exist." />;
  }

  if (browse.isLoading && browse.allEntries.length === 0) {
    return <LoadingState label={`Loading ${browse.title.toLowerCase()}...`} />;
  }

  if (browse.error && browse.allEntries.length === 0) {
    return (
      <ErrorState
        title="Compendium unavailable"
        message={browse.error instanceof Error ? browse.error.message : `Failed to load ${browse.title.toLowerCase()}.`}
      />
    );
  }

  const activeSortLabel = browse.sortOptions.find((option) => option.value === browse.sort)?.label ?? 'Sort';
  const activeFilterCount = browse.activeChips.length;
  const summaryText = `${browse.entries.length} of ${browse.allEntries.length} shown`;

  return (
    <View style={styles.safeArea}>
      <View pointerEvents="none" style={styles.backdrop} />
      <FlatList
        contentContainerStyle={styles.content}
        data={browse.entries}
        keyExtractor={(entry) => entry.id}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No {browse.title.toLowerCase()} matched</Text>
            <Text style={styles.emptyMessage}>Try a different search or clear some filters.</Text>
          </View>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>{browse.title}</Text>
              <Text style={styles.titleSummary}>{compendiumCategorySummaries[category]}</Text>
            </View>

            <View style={styles.searchRow}>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={browse.setQuery}
                placeholder={`Search ${browse.title.toLowerCase()}...`}
                placeholderTextColor={theme.colors.textFaint}
                returnKeyType="search"
                style={styles.searchInput}
                value={browse.query}
              />
              <Pressable accessibilityRole="button" onPress={() => setIsFilterOpen(true)} style={({ pressed }) => [styles.utilityButton, styles.filterButton, pressed && styles.utilityButtonPressed]}>
                <Text style={styles.filterButtonLabel}>{activeFilterCount > 0 ? `Filters ${activeFilterCount}` : 'Filters'}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => setIsSortOpen(true)} style={({ pressed }) => [styles.utilityButton, pressed && styles.utilityButtonPressed]}>
                <Text style={styles.utilityButtonLabel}>{activeSortLabel}</Text>
              </Pressable>
            </View>

            {browse.activeChips.length > 0 ? (
              <View style={styles.chipsRow}>
                {browse.activeChips.map((chip) => (
                  <Pressable accessibilityRole="button" key={chip.key} onPress={() => browse.clearChip(chip.key)} style={({ pressed }) => [styles.chip, pressed && styles.utilityButtonPressed]}>
                    <Text style={styles.chipLabel}>{chip.label} ×</Text>
                  </Pressable>
                ))}
                <Pressable accessibilityRole="button" onPress={browse.clearAllFilters} style={({ pressed }) => [styles.resetChip, pressed && styles.utilityButtonPressed]}>
                  <Text style={styles.resetChipLabel}>Clear all</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>{summaryText}</Text>
              {browse.isFetching ? <Text style={styles.updatingText}>Updating...</Text> : null}
            </View>
          </View>
        }
        renderItem={({ item: entry }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              category === 'classes'
                ? router.push(`/(app)/compendium/class/${encodeURIComponent(entry.id)}`)
                : router.push(`/(app)/compendium/${encodeURIComponent(getCompendiumEntryIdFromEntityId(entry.id))}`)
            }
            style={({ pressed }) => [styles.resultRow, pressed && styles.resultRowPressed]}
          >
            <View style={styles.resultTopRow}>
              <Text numberOfLines={1} style={styles.resultTitle}>
                {entry.name}
              </Text>
              <View style={styles.badges}>
                <View style={[styles.editionBadge, entry.isLegacy && styles.legacyBadge]}>
                  <Text style={[styles.editionBadgeLabel, entry.isLegacy && styles.legacyBadgeLabel]}>
                    {getEditionLabel(entry.rulesEdition, entry.isLegacy)}
                  </Text>
                </View>
              </View>
            </View>
            <Text numberOfLines={1} style={styles.resultMetaText}>
              {renderMeta(category, entry)}
            </Text>
            {category === 'spells' ? (
              <Text numberOfLines={1} style={styles.resultTagText}>
                {getSpellRoleTags(entry).join(' • ')}
              </Text>
            ) : null}
            <Text numberOfLines={2} style={styles.resultSummary}>
              {entry.summary || `${entry.sourceCode} • ${compendiumCategoryLabels[category]}`}
            </Text>
          </Pressable>
        )}
        showsVerticalScrollIndicator={false}
      />

      <Modal animationType="slide" onRequestClose={() => setIsFilterOpen(false)} transparent visible={isFilterOpen}>
        <Pressable onPress={() => setIsFilterOpen(false)} style={styles.modalBackdrop}>
          <Pressable onPress={() => undefined} style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filters</Text>
              <Pressable accessibilityRole="button" onPress={() => setIsFilterOpen(false)} style={({ pressed }) => [styles.sheetCloseButton, pressed && styles.utilityButtonPressed]}>
                <Text style={styles.sheetCloseLabel}>Done</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.sheetSections} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {browse.filterSections.map((section) => (
                <View key={section.key} style={styles.sheetSection}>
                  <Text style={styles.sectionLabel}>{section.title}</Text>
                  <View style={styles.sheetOptionsWrap}>
                    {section.type === 'multi'
                      ? section.options.map((option) => {
                          const isActive = browse.activeChips.some((chip) => chip.key === `${section.key}:${option.value}`);
                          return (
                            <Pressable
                              accessibilityRole="button"
                              key={option.value}
                              onPress={() => browse.toggleMultiFilter(section.key, option.value)}
                              style={({ pressed }) => [styles.sheetPill, isActive && styles.sheetPillActive, pressed && styles.sheetOptionPressed]}
                            >
                              <Text style={[styles.sheetPillLabel, isActive && styles.sheetPillLabelActive]}>{option.label}</Text>
                            </Pressable>
                          );
                        })
                      : section.options.map((option) => {
                          const isActive = section.value === option.value;
                          return (
                            <Pressable
                              accessibilityRole="button"
                              key={option.value}
                              onPress={() => browse.setToggleFilter(section.key, option.value as 'all' | 'yes' | 'no')}
                              style={({ pressed }) => [styles.sheetPill, isActive && styles.sheetPillActive, pressed && styles.sheetOptionPressed]}
                            >
                              <Text style={[styles.sheetPillLabel, isActive && styles.sheetPillLabelActive]}>{option.label}</Text>
                            </Pressable>
                          );
                        })}
                  </View>
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal animationType="slide" onRequestClose={() => setIsSortOpen(false)} transparent visible={isSortOpen}>
        <Pressable onPress={() => setIsSortOpen(false)} style={styles.modalBackdrop}>
          <Pressable onPress={() => undefined} style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Sort</Text>
              <Pressable accessibilityRole="button" onPress={() => setIsSortOpen(false)} style={({ pressed }) => [styles.sheetCloseButton, pressed && styles.utilityButtonPressed]}>
                <Text style={styles.sheetCloseLabel}>Done</Text>
              </Pressable>
            </View>
            <View style={styles.sheetSections}>
              {browse.sortOptions.map((option) => {
                const isActive = option.value === browse.sort;
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={option.value}
                    onPress={() => {
                      browse.setSort(option.value);
                      setIsSortOpen(false);
                    }}
                    style={({ pressed }) => [styles.sortOption, isActive && styles.sortOptionActive, pressed && styles.sheetOptionPressed]}
                  >
                    <Text style={[styles.sortOptionLabel, isActive && styles.sortOptionLabelActive]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
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
  header: {
    backgroundColor: theme.colors.background,
    borderBottomColor: theme.colors.borderSubtle,
    borderBottomWidth: 1,
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  titleBlock: {
    gap: 4,
  },
  title: {
    color: theme.colors.textPrimary,
    ...typography.sectionTitle,
    fontSize: 22,
  },
  titleSummary: {
    color: theme.colors.textMuted,
    ...typography.meta,
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
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  resetChip: {
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  resetChipLabel: {
    color: theme.colors.accentPrimarySoft,
    fontSize: 12,
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
    gap: 6,
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
  resultTagText: {
    color: theme.colors.accentSuccessSoft,
    ...typography.meta,
    fontWeight: '700',
  },
  resultSummary: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
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
    maxHeight: '85%',
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
  },
  sheetTitle: {
    color: theme.colors.textPrimary,
    ...typography.sectionTitle,
  },
  sheetCloseButton: {
    paddingVertical: 4,
  },
  sheetCloseLabel: {
    color: theme.colors.accentPrimarySoft,
    fontSize: 14,
    fontWeight: '700',
  },
  sheetSections: {
    gap: theme.spacing.md,
  },
  sheetSection: {
    gap: theme.spacing.sm,
  },
  sectionLabel: {
    color: theme.colors.textPrimary,
    ...typography.meta,
    fontWeight: '700',
  },
  sheetOptionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  sheetPill: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sheetPillActive: {
    backgroundColor: theme.colors.accentPrimaryDeep,
    borderColor: theme.colors.accentPrimary,
  },
  sheetOptionPressed: {
    borderColor: theme.colors.accentPrimarySoft,
  },
  sheetPillLabel: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  sheetPillLabelActive: {
    color: theme.colors.textPrimary,
  },
  sortOption: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  sortOptionActive: {
    backgroundColor: theme.colors.accentPrimaryDeep,
    borderColor: theme.colors.accentPrimary,
  },
  sortOptionLabel: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  sortOptionLabelActive: {
    color: theme.colors.textPrimary,
  },
});
