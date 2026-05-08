import { useState } from 'react';

import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDeleteCharacter } from '@/features/characters/hooks/useDeleteCharacter';
import { useOwnedCharacters } from '@/features/characters/hooks/useOwnedCharacters';
import { appRoutes } from '@/shared/constants/routes';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { Screen } from '@/shared/ui/Screen';
import { theme, typography } from '@/shared/ui/theme';

export function CharactersScreen() {
  const router = useRouter();
  const { data, error, isLoading } = useOwnedCharacters();
  const deleteCharacterMutation = useDeleteCharacter();
  const [pendingDeleteCharacterId, setPendingDeleteCharacterId] = useState<string | null>(null);

  if (isLoading) {
    return <LoadingState label="Loading your roster..." />;
  }

  if (error) {
    return <ErrorState title="Roster unavailable" message={error instanceof Error ? error.message : 'Failed to load characters.'} />;
  }

  const characters = data ?? [];
  const pendingDeleteCharacter = characters.find((character) => character.id === pendingDeleteCharacterId) ?? null;

  const openBuilder = (characterId: string) => {
    router.push(`/(app)/characters/${encodeURIComponent(characterId)}/builder` as never);
  };

  const requestDeleteCharacter = (characterId: string) => {
    deleteCharacterMutation.reset();
    setPendingDeleteCharacterId(characterId);
  };

  const cancelDeleteCharacter = () => {
    deleteCharacterMutation.reset();
    setPendingDeleteCharacterId(null);
  };

  const confirmDeleteCharacter = async () => {
    if (!pendingDeleteCharacter) {
      setPendingDeleteCharacterId(null);
      return;
    }

    try {
      await deleteCharacterMutation.mutateAsync(pendingDeleteCharacter.id);
      setPendingDeleteCharacterId(null);
    } catch {
      // The mutation keeps the error for the confirmation panel.
    }
  };

  if (characters.length === 0) {
    return (
      <Screen contentContainerStyle={styles.emptyContainer}>
        <View style={styles.emptyPanel}>
          <Text style={styles.eyebrow}>My Characters</Text>
          <Text style={styles.title}>No characters yet</Text>
          <Text style={styles.subtitle}>
            Create your first draft character to start the guided builder and keep it ready for future campaigns.
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(appRoutes.newCharacter as never)}
            style={({ pressed }) => [styles.newButton, pressed && styles.newButtonPressed]}
          >
            <Text style={styles.newButtonLabel}>Create New Character</Text>
          </Pressable>
        </View>
      </Screen>
    );
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

      {pendingDeleteCharacter ? (
        <View style={styles.deletePanel}>
          <View style={styles.deletePanelCopy}>
            <Text style={styles.deleteTitle}>Delete {pendingDeleteCharacter.name}?</Text>
            <Text style={styles.deleteText}>This removes the character draft, build data, and local campaign assignments from this device.</Text>
            {deleteCharacterMutation.error ? (
              <Text style={styles.errorText}>{deleteCharacterMutation.error instanceof Error ? deleteCharacterMutation.error.message : 'Failed to delete character.'}</Text>
            ) : null}
          </View>
          <View style={styles.deleteActions}>
            <Pressable
              accessibilityRole="button"
              disabled={deleteCharacterMutation.isPending}
              onPress={cancelDeleteCharacter}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
            >
              <Text style={styles.secondaryButtonLabel}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={deleteCharacterMutation.isPending}
              onPress={confirmDeleteCharacter}
              style={({ pressed }) => [styles.destructiveButton, pressed && styles.destructiveButtonPressed, deleteCharacterMutation.isPending && styles.buttonDisabled]}
            >
              <Text style={styles.destructiveButtonLabel}>{deleteCharacterMutation.isPending ? 'Deleting...' : 'Delete Character'}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.list}>
        {characters.map((character) => {
          return (
            <View
              key={character.id}
              style={styles.card}
            >
              <Pressable
                accessibilityRole="button"
                onPress={() => openBuilder(character.id)}
                style={({ pressed }) => [styles.cardBody, pressed && styles.cardPressed]}
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
              </Pressable>

              <View style={styles.cardFooter}>
                <Text style={styles.footerText}>Updated {new Date(character.updatedAt).toLocaleDateString()}</Text>
                <View style={styles.footerActions}>
                  <Pressable accessibilityRole="button" onPress={() => requestDeleteCharacter(character.id)} style={({ pressed }) => [styles.deleteAction, pressed && styles.deleteActionPressed]}>
                    <Text style={styles.deleteActionLabel}>Delete</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={() => openBuilder(character.id)} style={({ pressed }) => [styles.openAction, pressed && styles.openActionPressed]}>
                    <Text style={styles.footerAction}>Open Builder</Text>
                  </Pressable>
                </View>
              </View>
            </View>
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  emptyPanel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    gap: theme.spacing.lg,
    maxWidth: 480,
    padding: theme.spacing.xl,
    width: '100%',
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
  cardBody: {
    gap: theme.spacing.md,
    marginHorizontal: -theme.spacing.sm,
    marginTop: -theme.spacing.sm,
    padding: theme.spacing.sm,
    borderRadius: theme.radii.sm,
  },
  cardPressed: {
    backgroundColor: theme.colors.surfaceElevated,
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
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  footerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'flex-end',
  },
  footerText: {
    color: theme.colors.textMuted,
    ...typography.meta,
  },
  openAction: {
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  openActionPressed: {
    backgroundColor: theme.colors.surfaceAccent,
  },
  footerAction: {
    color: theme.colors.accentPrimarySoft,
    ...typography.meta,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  deleteAction: {
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  deleteActionPressed: {
    backgroundColor: theme.colors.surfaceAccent,
  },
  deleteActionLabel: {
    color: theme.colors.accentLegacySoft,
    ...typography.meta,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  deletePanel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.accentLegacy,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  deletePanelCopy: {
    gap: theme.spacing.xs,
  },
  deleteTitle: {
    color: theme.colors.accentLegacySoft,
    fontSize: 16,
    fontWeight: '800',
  },
  deleteText: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
  errorText: {
    color: theme.colors.accentLegacySoft,
    fontSize: 14,
    lineHeight: 20,
  },
  deleteActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'flex-end',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
  },
  secondaryButtonPressed: {
    borderColor: theme.colors.accentPrimary,
  },
  secondaryButtonLabel: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  destructiveButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.accentLegacy,
    borderColor: theme.colors.accentLegacySoft,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
  },
  destructiveButtonPressed: {
    opacity: 0.85,
  },
  destructiveButtonLabel: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
