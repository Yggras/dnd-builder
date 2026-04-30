import { useLocalSearchParams } from 'expo-router';

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

export function CompendiumDetailScreen() {
  const params = useLocalSearchParams<{ entryId?: string | string[] }>();
  const entryId = Array.isArray(params.entryId) ? params.entryId[0] : params.entryId ?? '';
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
    <Screen>
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
