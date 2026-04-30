import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { CompendiumDetailHeader } from '@/features/compendium/components/CompendiumDetailHeader';
import { DetailFactGrid } from '@/features/compendium/components/DetailFactGrid';
import { DetailSection } from '@/features/compendium/components/DetailSection';
import { RenderBlockList } from '@/features/compendium/components/RenderBlockList';
import { RichTextLine } from '@/features/compendium/components/RichTextLine';
import { SQLiteContentRepository } from '@/features/content/adapters/SQLiteContentRepository';
import { ContentService } from '@/features/content/services/ContentService';
import { buildRenderBlocks } from '@/features/compendium/utils/detailBlocks';
import { buildBackgroundFacts, getEntityIdsFromMetadata, sortEntityNames } from '@/features/compendium/utils/detailFacts';
import { parseInlineText } from '@/features/compendium/utils/inlineText';
import { queryKeys } from '@/shared/query/keys';
import type { CompendiumEntry } from '@/shared/types/domain';

const contentService = new ContentService(new SQLiteContentRepository());

interface BackgroundDetailViewProps {
  entry: CompendiumEntry;
}

export function BackgroundDetailView({ entry }: BackgroundDetailViewProps) {
  const featIds = useMemo(() => getEntityIdsFromMetadata(entry.metadata.featIds), [entry.metadata.featIds]);
  const featsQuery = useQuery({
    queryKey: queryKeys.compendiumContentEntities(featIds),
    queryFn: () => contentService.getContentEntitiesByIds(featIds),
    enabled: featIds.length > 0,
  });
  const resolvedFeatNames = sortEntityNames(featsQuery.data?.filter((entity) => entity.entityType === 'feat') ?? [])
    .map((entity) => `${entity.name} (${entity.sourceCode})`);
  const equipmentSummary = typeof entry.metadata.equipmentSummary === 'string' ? entry.metadata.equipmentSummary : null;

  return (
    <>
      <CompendiumDetailHeader entry={entry} />
      <DetailSection title="Background Facts">
        <DetailFactGrid facts={buildBackgroundFacts(entry, resolvedFeatNames)} />
      </DetailSection>
      {equipmentSummary ? (
        <DetailSection title="Starting Equipment">
          <RichTextLine tokens={parseInlineText(equipmentSummary)} />
        </DetailSection>
      ) : null}
      <DetailSection title="Details">
        <RenderBlockList blocks={buildRenderBlocks(entry)} />
      </DetailSection>
    </>
  );
}
