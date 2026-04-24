import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useOwnedCharacters } from '@/features/characters/hooks/useOwnedCharacters';
import { appRoutes } from '@/shared/constants/routes';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { Screen } from '@/shared/ui/Screen';
import { theme, typography } from '@/shared/ui/theme';

export function CharactersScreen() {
  const router = useRouter();
  const { data, error, isLoading } = useOwnedCharacters();

  if (isLoading) {
    return <LoadingState label="Loading your roster..." />;
  }

  if (error) {
    return <ErrorState title="Roster unavailable" message={error instanceof Error ? error.message : 'Failed to load characters.'} />;
  }

  const characters = data ?? [];

  if (characters.length === 0) {
    return <EmptyState title="No characters yet" message="Create your first draft character to start the guided builder and keep it ready for future campaigns." />;
  }

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>My Characters</Text>
          <Text style={styles.title}>Owned roster</Text>
          <Text style={styles.subtitle}>Global character drafts and completed builds that stay independent of campaign assignment.</Text>
        </View>

        <Pressable accessibilityRole="button" onPress={() => router.push(appRoutes.newCharacter as never)} style={({ pressed }) => [styles.newButton, pressed && styles.newButtonPressed]}>
          <Text style={styles.newButtonLabel}>New Character</Text>
        </Pressable>
      </View>

      <View style={styles.list}>
        {characters.map((character) => {
          return (
            <Pressable
              accessibilityRole="button"
              key={character.id}
              onPress={() => router.push(`/(app)/characters/${encodeURIComponent(character.id)}/builder` as never)}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.cardHeading}>
                  <Text numberOfLines={1} style={styles.cardTitle}>
                    {character.name}
                  </Text>
                  <Text style={styles.cardMeta}>Level {character.level}</Text>
                </View>

                <View style={[styles.stateBadge, character.buildState === 'complete' && styles.completeBadge]}>
                  <Text style={[styles.stateBadgeLabel, character.buildState === 'complete' && styles.completeBadgeLabel]}>
                    {character.buildState === 'complete' ? 'Complete' : 'Draft'}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryGrid}>
                <View style={styles.summaryPill}>
                  <Text style={styles.summaryLabel}>Class</Text>
                  <Text style={styles.summaryValue}>{character.classLabel}</Text>
                </View>
                <View style={styles.summaryPill}>
                  <Text style={styles.summaryLabel}>Species</Text>
                  <Text style={styles.summaryValue}>{character.speciesLabel}</Text>
                </View>
                <View style={styles.summaryPill}>
                  <Text style={styles.summaryLabel}>Resume</Text>
                  <Text style={styles.summaryValue}>{character.currentStep}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.footerText}>Updated {new Date(character.updatedAt).toLocaleDateString()}</Text>
                <Text style={styles.footerAction}>Open Builder</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xl,
  },
  header: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  headerCopy: {
    gap: theme.spacing.xs,
  },
  eyebrow: {
    color: theme.colors.accentPrimarySoft,
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
  newButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.accentPrimary,
    borderColor: theme.colors.accentPrimarySoft,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: theme.spacing.lg,
  },
  newButtonPressed: {
    backgroundColor: theme.colors.borderAccent,
  },
  newButtonLabel: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  list: {
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  cardPressed: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.accentPrimary,
  },
  cardTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  cardHeading: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    ...typography.sectionTitle,
  },
  cardMeta: {
    color: theme.colors.textMuted,
    ...typography.meta,
  },
  stateBadge: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  completeBadge: {
    backgroundColor: theme.colors.accentSuccess,
    borderColor: theme.colors.accentSuccessSoft,
  },
  stateBadgeLabel: {
    color: theme.colors.textSecondary,
    ...typography.meta,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  completeBadgeLabel: {
    color: theme.colors.backgroundDeep,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  summaryPill: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    gap: 4,
    minWidth: '31%',
    padding: theme.spacing.sm,
  },
  summaryLabel: {
    color: theme.colors.textMuted,
    ...typography.meta,
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  cardFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    color: theme.colors.textMuted,
    ...typography.meta,
  },
  footerAction: {
    color: theme.colors.accentPrimarySoft,
    ...typography.meta,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
