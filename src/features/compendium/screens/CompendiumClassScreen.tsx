import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { DetailFactGrid } from '@/features/compendium/components/DetailFactGrid';
import { DetailSection } from '@/features/compendium/components/DetailSection';
import { FeatureProgressionList } from '@/features/compendium/components/FeatureProgressionList';
import { RichTextLine } from '@/features/compendium/components/RichTextLine';
import { useCompendiumClassDetails } from '@/features/compendium/hooks/useCompendiumClassDetails';
import { getCompendiumEntryIdFromEntityId, getEditionLabel } from '@/features/compendium/utils/catalog';
import {
  buildClassFacts,
  buildClassFeatureRows,
  buildClassProficiencyFacts,
  buildStartingEquipmentLines,
} from '@/features/compendium/utils/classDetails';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { Screen } from '@/shared/ui/Screen';
import { theme, typography } from '@/shared/ui/theme';

export function CompendiumClassScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ classId?: string | string[] }>();
  const classId = Array.isArray(params.classId) ? params.classId[0] : params.classId ?? '';
  const [query, setQuery] = useState('');
  const { classEntity, subclasses, error, isFetching, isLoading } = useCompendiumClassDetails(classId);

  const visibleSubclasses = useMemo(
    () => subclasses.filter((entry) => (query.trim() ? entry.searchText.toLowerCase().includes(query.trim().toLowerCase()) : true)),
    [query, subclasses],
  );

  if (isLoading) {
    return <LoadingState label="Loading class library..." />;
  }

  if (error) {
    return <ErrorState title="Class unavailable" message={error instanceof Error ? error.message : 'Failed to load class details.'} />;
  }

  if (!classEntity) {
    return <ErrorState title="Class not found" message="The requested class is not available in the local compendium." />;
  }

  const startingEquipmentLines = buildStartingEquipmentLines(classEntity);
  const proficiencyFacts = buildClassProficiencyFacts(classEntity);

  return (
    <Screen contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Class Library</Text>
        <Text style={styles.title}>{classEntity.name}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.badge, classEntity.isLegacy && styles.legacyBadge]}>
            <Text style={[styles.badgeLabel, classEntity.isLegacy && styles.legacyBadgeLabel]}>
              {getEditionLabel(classEntity.rulesEdition, classEntity.isLegacy)}
            </Text>
          </View>
          <View style={styles.sourceBadge}>
            <Text style={styles.sourceBadgeLabel}>{classEntity.sourceCode}</Text>
          </View>
          <Text style={styles.subclassCount}>{subclasses.length} subclasses</Text>
        </View>
        <Text style={styles.summary}>{classEntity.summary || 'Class progression, proficiencies, equipment, and subclasses from the local rules library.'}</Text>
      </View>

      <DetailSection title="Class Facts">
        <DetailFactGrid facts={buildClassFacts(classEntity)} />
      </DetailSection>

      {proficiencyFacts.length > 0 ? (
        <DetailSection title="Proficiencies">
          <DetailFactGrid facts={proficiencyFacts} />
        </DetailSection>
      ) : null}

      <DetailSection title="Feature Progression">
        <FeatureProgressionList rows={buildClassFeatureRows(classEntity)} />
      </DetailSection>

      {startingEquipmentLines.length > 0 ? (
        <DetailSection title="Starting Equipment">
          <View style={styles.equipmentLines}>
            {startingEquipmentLines.map((tokens, index) => (
              <RichTextLine key={`equipment-${index}`} tokens={tokens} />
            ))}
          </View>
        </DetailSection>
      ) : null}

      <DetailSection title="Subclasses">
        <View style={styles.subclassHeader}>
          <Text style={styles.sectionSubtext}>Browse subclass options for {classEntity.name}.</Text>
          {isFetching ? <Text style={styles.refreshLabel}>Updating...</Text> : null}
        </View>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder="Search subclasses..."
          placeholderTextColor={theme.colors.textFaint}
          returnKeyType="search"
          style={styles.searchInput}
          value={query}
        />
        <FlatList
          data={visibleSubclasses}
          keyExtractor={(entry) => entry.id}
          renderItem={({ item: entry }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(`/(app)/compendium/${encodeURIComponent(getCompendiumEntryIdFromEntityId(entry.id))}`)}
              style={({ pressed }) => [styles.resultRow, pressed && styles.resultRowPressed]}
            >
              <View style={styles.resultTopRow}>
                <Text numberOfLines={1} style={styles.resultTitle}>
                  {entry.name}
                </Text>
                <View style={[styles.badge, entry.isLegacy && styles.legacyBadge]}>
                  <Text style={[styles.badgeLabel, entry.isLegacy && styles.legacyBadgeLabel]}>
                    {getEditionLabel(entry.rulesEdition, entry.isLegacy)}
                  </Text>
                </View>
              </View>
              <Text style={styles.resultMeta}>{entry.sourceCode} • {entry.sourceName}</Text>
              <Text numberOfLines={2} style={styles.resultSummary}>
                {entry.summary || 'Open the subclass entry for feature progression and details.'}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No subclasses matched</Text>
              <Text style={styles.emptyMessage}>Try a different search query.</Text>
            </View>
          }
          scrollEnabled={false}
        />
      </DetailSection>
    </Screen>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
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
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  badge: {
    backgroundColor: theme.colors.accentPrimaryDeep,
    borderRadius: theme.radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeLabel: {
    color: theme.colors.accentPrimarySoft,
    fontSize: 12,
    fontWeight: '700',
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
  },
  subclassCount: {
    color: theme.colors.textMuted,
    ...typography.meta,
  },
  summary: {
    color: theme.colors.textSecondary,
    ...typography.body,
  },
  equipmentLines: {
    gap: theme.spacing.sm,
  },
  subclassHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  sectionSubtext: {
    color: theme.colors.textMuted,
    flex: 1,
    ...typography.meta,
  },
  refreshLabel: {
    color: theme.colors.accentSuccessSoft,
    ...typography.meta,
    fontWeight: '700',
  },
  searchInput: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    color: theme.colors.textPrimary,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
  },
  resultRow: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: 6,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  resultRowPressed: {
    borderColor: theme.colors.borderAccent,
  },
  resultTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  resultTitle: {
    color: theme.colors.textPrimary,
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  resultMeta: {
    color: theme.colors.textMuted,
    ...typography.meta,
  },
  resultSummary: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
  emptyState: {
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.lg,
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
});
