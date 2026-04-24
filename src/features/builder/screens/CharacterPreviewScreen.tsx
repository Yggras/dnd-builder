import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

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

  const payload = data.build.payload as Record<string, any>;

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Completed Build</Text>
        <Text style={styles.title}>{payload.characteristicsStep?.name || data.character.name}</Text>
        <Text style={styles.subtitle}>This lightweight preview confirms the build is complete and summarizes the current character configuration.</Text>
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Identity</Text>
          <Text style={styles.panelText}>Level {data.character.level}</Text>
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
          <Text style={styles.panelTitle}>Spells</Text>
          <Text style={styles.panelText}>Selected spells: {(payload.spellsStep?.selectedSpellIds ?? []).length}</Text>
          <Text style={styles.panelText}>Spell notes: {(payload.spellsStep?.manualExceptionNotes ?? []).length}</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Inventory</Text>
          <Text style={styles.panelText}>Items: {(payload.inventoryStep?.entries ?? []).length}</Text>
          <Text style={styles.panelText}>Currency: {payload.inventoryStep?.startingCurrency?.gp ?? 0} gp / {payload.inventoryStep?.startingCurrency?.sp ?? 0} sp / {payload.inventoryStep?.startingCurrency?.cp ?? 0} cp</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Sources</Text>
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
