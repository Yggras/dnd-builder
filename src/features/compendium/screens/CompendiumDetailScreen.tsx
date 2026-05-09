import { Pressable, StyleSheet, Text } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { buildBuilderReturnRoute, parseBuilderCompendiumReturnContext } from '@/features/builder/utils/compendiumReturn';
import { BackgroundDetailView } from '@/features/compendium/components/BackgroundDetailView';
import { FeatDetailView } from '@/features/compendium/components/FeatDetailView';
import { GenericCompendiumDetailView } from '@/features/compendium/components/GenericCompendiumDetailView';
import { ItemDetailView } from '@/features/compendium/components/ItemDetailView';
import { SpellDetailView } from '@/features/compendium/components/SpellDetailView';
import { SpeciesDetailView } from '@/features/compendium/components/SpeciesDetailView';
import { SubclassDetailView } from '@/features/compendium/components/SubclassDetailView';
import { useCompendiumEntry } from '@/features/compendium/hooks/useCompendiumEntry';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { Screen } from '@/shared/ui/Screen';
import { theme, typography } from '@/shared/ui/theme';

export function CompendiumDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const entryId = Array.isArray(params.entryId) ? params.entryId[0] : params.entryId ?? '';
  const returnContext = parseBuilderCompendiumReturnContext(params);
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

  return (
    <Screen contentContainerStyle={styles.contentContainer}>
      {returnContext ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace(buildBuilderReturnRoute(returnContext) as never)}
          style={({ pressed }) => [styles.returnButton, pressed && styles.returnButtonPressed]}
        >
          <Text style={styles.returnButtonLabel}>Return to Builder</Text>
        </Pressable>
      ) : null}
      {entry.entryType === 'spell' ? <SpellDetailView entry={entry} /> : null}
      {entry.entryType === 'item' ? <ItemDetailView entry={entry} /> : null}
      {entry.entryType === 'subclass' ? <SubclassDetailView entry={entry} /> : null}
      {entry.entryType === 'feat' ? <FeatDetailView entry={entry} /> : null}
      {entry.entryType === 'species' ? <SpeciesDetailView entry={entry} /> : null}
      {entry.entryType === 'background' ? <BackgroundDetailView entry={entry} /> : null}
      {!['spell', 'item', 'subclass', 'feat', 'species', 'background'].includes(entry.entryType) ? <GenericCompendiumDetailView entry={entry} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    gap: theme.spacing.md,
  },
  returnButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: theme.spacing.md,
  },
  returnButtonPressed: {
    borderColor: theme.colors.accentPrimary,
  },
  returnButtonLabel: {
    color: theme.colors.textSecondary,
    ...typography.meta,
    fontWeight: '800',
  },
});
