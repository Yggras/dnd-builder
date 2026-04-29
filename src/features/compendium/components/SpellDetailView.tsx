import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import { CompendiumDetailHeader } from '@/features/compendium/components/CompendiumDetailHeader';
import { DetailFactGrid } from '@/features/compendium/components/DetailFactGrid';
import { DetailSection } from '@/features/compendium/components/DetailSection';
import { DetailSummarySection } from '@/features/compendium/components/DetailSummarySection';
import { RenderBlockList } from '@/features/compendium/components/RenderBlockList';
import { SQLiteContentRepository } from '@/features/content/adapters/SQLiteContentRepository';
import { ContentService } from '@/features/content/services/ContentService';
import { buildRenderBlocks } from '@/features/compendium/utils/detailBlocks';
import { buildSourceFacts, buildSpellFacts, getEntityIdsFromMetadata, sortEntityNames } from '@/features/compendium/utils/detailFacts';
import { queryKeys } from '@/shared/query/keys';
import type { CompendiumEntry } from '@/shared/types/domain';
import { theme } from '@/shared/ui/theme';

const contentService = new ContentService(new SQLiteContentRepository());

interface SpellDetailViewProps {
  entry: CompendiumEntry;
}

export function SpellDetailView({ entry }: SpellDetailViewProps) {
  const availabilityIds = useMemo(
    () => Array.from(new Set([...getEntityIdsFromMetadata(entry.metadata.classIds), ...getEntityIdsFromMetadata(entry.metadata.subclassIds)])),
    [entry.metadata.classIds, entry.metadata.subclassIds],
  );
  const availabilityQuery = useQuery({
    queryKey: queryKeys.compendiumContentEntities(availabilityIds),
    queryFn: () => contentService.getContentEntitiesByIds(availabilityIds),
    enabled: availabilityIds.length > 0,
  });

  const classNames = sortEntityNames((availabilityQuery.data ?? []).filter((entity) => entity.entityType === 'class')).map((entity) => entity.name);
  const subclassNames = sortEntityNames((availabilityQuery.data ?? []).filter((entity) => entity.entityType === 'subclass')).map((entity) => entity.name);

  return (
    <>
      <CompendiumDetailHeader entry={entry} />
      <DetailSection title="Casting Facts">
        <DetailFactGrid facts={[...buildSpellFacts(entry), ...buildSourceFacts(entry)]} />
      </DetailSection>
      {classNames.length > 0 || subclassNames.length > 0 ? (
        <DetailSection title="Available To">
          <View style={styles.availabilityList}>
            {classNames.length > 0 ? (
              <View style={styles.availabilityGroup}>
                <Text style={styles.availabilityLabel}>Classes</Text>
                <Text style={styles.availabilityText}>{classNames.join(', ')}</Text>
              </View>
            ) : null}
            {subclassNames.length > 0 ? (
              <View style={styles.availabilityGroup}>
                <Text style={styles.availabilityLabel}>Subclasses</Text>
                <Text style={styles.availabilityText}>{subclassNames.join(', ')}</Text>
              </View>
            ) : null}
          </View>
        </DetailSection>
      ) : null}
      <DetailSummarySection summary={entry.summary} />
      <DetailSection title="Details">
        <RenderBlockList blocks={buildRenderBlocks(entry)} />
      </DetailSection>
    </>
  );
}

const styles = StyleSheet.create({
  availabilityList: {
    gap: theme.spacing.md,
  },
  availabilityGroup: {
    gap: 4,
  },
  availabilityLabel: {
    color: theme.colors.textFaint,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  availabilityText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
  },
});
