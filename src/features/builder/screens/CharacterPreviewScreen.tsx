import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { isBuilderDraftPayload, type BuilderDraftPayload } from '@/features/builder/types';
import { useCharacterRecord } from '@/features/characters/hooks/useCharacterRecord';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { Screen } from '@/shared/ui/Screen';
import { theme, typography } from '@/shared/ui/theme';

function formatEntityLabel(entityId: string | null | undefined, fallback: string) {
  if (!entityId) {
    return fallback;
  }

  const [slug] = entityId.split('|');
  return slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase()) : fallback;
}

function formatEntityLabels(entityIds: Array<string | null | undefined>, fallback: string) {
  const labels = entityIds
    .map((entityId) => formatEntityLabel(entityId, ''))
    .filter((label) => label.length > 0);

  return labels.length > 0 ? labels.join(', ') : fallback;
}

export function CharacterPreviewScreen() {
  const params = useLocalSearchParams<{ characterId?: string | string[] }>();
  const characterId = Array.isArray(params.characterId) ? params.characterId[0] : params.characterId ?? '';
  const { data, error, isLoading } = useCharacterRecord(characterId);

  if (isLoading) {
    return <LoadingState label="Loading character preview..." />;
  }

  if (error) {
    return <ErrorState title="Preview unavailable" message={error instanceof Error ? error.message : 'Failed to load character preview.'} />;
  }

  if (!data?.character || !data.build) {
    return <ErrorState title="Preview unavailable" message="The requested character preview could not be loaded." />;
  }

  if (data.build.buildState !== 'complete') {
    return <ErrorState title="Preview unavailable" message="Complete the builder review step before opening the character preview." />;
  }

  if (!isBuilderDraftPayload(data.build.payload)) {
    return <ErrorState title="Preview unavailable" message="The saved builder payload is not in the expected format." />;
  }

  const payload: BuilderDraftPayload = data.build.payload;
  const classAllocations = Array.isArray(payload.classStep?.allocations) ? payload.classStep.allocations : [];
  const classSummary = classAllocations.length
    ? classAllocations
        .map((allocation: { classId?: string; subclassId?: string | null; level?: number }) => {
          const classLabel = formatEntityLabel(allocation.classId, 'Unknown class');
          const subclassLabel = allocation.subclassId ? ` (${formatEntityLabel(allocation.subclassId, 'Unknown subclass')})` : '';
          const levelLabel = typeof allocation.level === 'number' ? ` ${allocation.level}` : '';
          return `${classLabel}${subclassLabel}${levelLabel}`;
        })
        .join(', ')
    : 'No class yet';
  const featSummary = formatEntityLabels(
    [
      ...(Array.isArray(payload.speciesStep?.grantedFeatSelections)
        ? payload.speciesStep.grantedFeatSelections.map((selection: { selectedFeatId?: string | null }) => selection.selectedFeatId)
        : []),
      ...(Array.isArray(payload.backgroundStep?.grantedFeatSelections)
        ? payload.backgroundStep.grantedFeatSelections.map((selection: { selectedFeatId?: string | null }) => selection.selectedFeatId)
        : []),
      ...(Array.isArray(payload.classStep?.featureChoices)
        ? payload.classStep.featureChoices.flatMap((selection: { selectedOptionIds?: string[] }) => selection.selectedOptionIds ?? [])
        : []),
    ],
    'None selected',
  );
  const inventoryEntries = Array.isArray(payload.inventoryStep?.entries) ? payload.inventoryStep.entries : [];
  const preparedSpellCount = Array.isArray(payload.spellsStep?.preparedSpellIds) ? payload.spellsStep.preparedSpellIds.length : 0;
  const selectedSpellCount = Array.isArray(payload.spellsStep?.selectedSpellIds) ? payload.spellsStep.selectedSpellIds.length : 0;
  const spellExceptionCount = Array.isArray(payload.spellsStep?.manualExceptionNotes) ? payload.spellsStep.manualExceptionNotes.length : 0;
  const equippedItemCount = inventoryEntries.filter((entry: { equipped?: unknown }) => entry.equipped === true).length;
  const attunedItemCount = inventoryEntries.filter((entry: { attuned?: unknown }) => entry.attuned === true).length;
  const completionUpdatedAt = data.build.completionUpdatedAt
    ? new Date(data.build.completionUpdatedAt).toLocaleString()
    : 'Unknown';

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Completed Build</Text>
        <Text style={styles.title}>{payload.characteristicsStep?.name || data.character.name}</Text>
        <Text style={styles.subtitle}>This lightweight preview confirms the build passed the current completion gate and summarizes the saved character configuration.</Text>
        <Text style={styles.meta}>Completed: {completionUpdatedAt}</Text>
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Identity</Text>
          <Text style={styles.panelText}>Level {data.character.level}</Text>
          <Text style={styles.panelText}>Classes: {classSummary}</Text>
          <Text style={styles.panelText}>Species: {formatEntityLabel(payload.speciesStep?.speciesId, 'Unselected')}</Text>
          <Text style={styles.panelText}>Background: {formatEntityLabel(payload.backgroundStep?.backgroundId, 'Unselected')}</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Ability Scores</Text>
          {Object.entries(payload.abilityPointsStep?.scores ?? {}).map(([ability, score]) => (
            <Text key={ability} style={styles.panelText}>
              {ability.toUpperCase()}: {typeof score === 'number' || typeof score === 'string' ? String(score) : '0'}
            </Text>
          ))}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Feats And Features</Text>
          <Text style={styles.panelText}>{featSummary}</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Spells</Text>
          <Text style={styles.panelText}>Tracked spells: {selectedSpellCount}</Text>
          <Text style={styles.panelText}>Prepared spells: {preparedSpellCount}</Text>
          <Text style={styles.panelText}>Spell exceptions: {spellExceptionCount}</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Inventory</Text>
          <Text style={styles.panelText}>Items: {inventoryEntries.length}</Text>
          <Text style={styles.panelText}>Equipped: {equippedItemCount}</Text>
          <Text style={styles.panelText}>Attuned: {attunedItemCount}</Text>
          <Text style={styles.panelText}>Currency: {payload.inventoryStep?.startingCurrency?.gp ?? 0} gp / {payload.inventoryStep?.startingCurrency?.sp ?? 0} sp / {payload.inventoryStep?.startingCurrency?.cp ?? 0} cp</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Sources</Text>
          <Text style={styles.panelText}>Completion state: {data.build.buildState}</Text>
          <Text style={styles.panelText}>Sources: {(payload.review?.sourceSummary?.sourceCodes ?? []).join(', ') || 'None'}</Text>
          <Text style={styles.panelText}>Editions: {(payload.review?.sourceSummary?.editionsUsed ?? []).join(', ') || 'None'}</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xl,
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderAccent,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  eyebrow: {
    color: theme.colors.accentSuccessSoft,
    ...typography.eyebrow,
  },
  title: {
    color: theme.colors.textPrimary,
    ...typography.titleLg,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
  meta: {
    color: theme.colors.textMuted,
    ...typography.meta,
  },
  summaryGrid: {
    gap: theme.spacing.md,
  },
  panel: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  panelTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  panelText: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
});
