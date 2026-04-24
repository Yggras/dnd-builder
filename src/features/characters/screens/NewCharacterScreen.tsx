import { useEffect, useState } from 'react';

import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useCreateCharacterDraft } from '@/features/characters/hooks/useCreateCharacterDraft';
import { appRoutes } from '@/shared/constants/routes';
import { Screen } from '@/shared/ui/Screen';
import { theme, typography } from '@/shared/ui/theme';

export function NewCharacterScreen() {
  const router = useRouter();
  const createDraftMutation = useCreateCharacterDraft();
  const [name, setName] = useState('');
  const trimmedName = name.trim();

  useEffect(() => {
    if (!createDraftMutation.data?.character.id) {
      return;
    }

    router.replace(`/(app)/characters/${encodeURIComponent(createDraftMutation.data.character.id)}/builder` as never);
  }, [createDraftMutation.data?.character.id, router]);

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.panel}>
        <Text style={styles.eyebrow}>New Character</Text>
        <Text style={styles.title}>Start a draft hero</Text>
        <Text style={styles.description}>
          Every new character begins as a resumable draft. Name the character now so it has identity in your roster and throughout the builder.
        </Text>

        <View style={styles.formSection}>
          <Text style={styles.label}>Character name</Text>
          <TextInput
            autoCapitalize="words"
            autoCorrect={false}
            onChangeText={setName}
            placeholder="Aelar Stormweaver"
            placeholderTextColor={theme.colors.textFaint}
            returnKeyType="done"
            style={styles.input}
            value={name}
          />
        </View>

        {createDraftMutation.error ? (
          <Text style={styles.errorText}>
            {createDraftMutation.error instanceof Error ? createDraftMutation.error.message : 'Failed to create draft.'}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={() => router.replace(appRoutes.characters as never)} style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}>
            <Text style={styles.secondaryButtonLabel}>Back to roster</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={!trimmedName || createDraftMutation.isPending}
            onPress={() => createDraftMutation.mutate(trimmedName)}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
              (!trimmedName || createDraftMutation.isPending) && styles.primaryButtonDisabled,
            ]}
          >
            <Text style={styles.primaryButtonLabel}>{createDraftMutation.isPending ? 'Creating draft...' : 'Create Draft'}</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    minHeight: '100%',
  },
  panel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    gap: theme.spacing.lg,
    padding: theme.spacing.xl,
  },
  eyebrow: {
    color: theme.colors.accentPrimarySoft,
    ...typography.eyebrow,
  },
  title: {
    color: theme.colors.textPrimary,
    ...typography.titleLg,
  },
  description: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
  formSection: {
    gap: theme.spacing.sm,
  },
  label: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    color: theme.colors.textPrimary,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
  },
  errorText: {
    color: theme.colors.accentLegacySoft,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
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
    minHeight: 48,
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
  primaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.accentPrimary,
    borderColor: theme.colors.accentPrimarySoft,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: theme.spacing.lg,
  },
  primaryButtonPressed: {
    backgroundColor: theme.colors.borderAccent,
  },
  primaryButtonDisabled: {
    backgroundColor: theme.colors.borderStrong,
    borderColor: theme.colors.borderStrong,
  },
  primaryButtonLabel: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
});
