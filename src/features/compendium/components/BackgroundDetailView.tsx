import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { CompendiumDetailHeader } from '@/features/compendium/components/CompendiumDetailHeader';
import { DetailFactGrid } from '@/features/compendium/components/DetailFactGrid';
import { DetailSection } from '@/features/compendium/components/DetailSection';
import { RenderBlockList } from '@/features/compendium/components/RenderBlockList';
import { SQLiteContentRepository } from '@/features/content/adapters/SQLiteContentRepository';
import { ContentService } from '@/features/content/services/ContentService';
import { buildRenderBlocks, buildRenderBlocksFromEntries, type DetailRenderBlock } from '@/features/compendium/utils/detailBlocks';
import { buildBackgroundFacts, getEntityIdsFromMetadata, sortEntityNames } from '@/features/compendium/utils/detailFacts';
import { parseInlineText } from '@/features/compendium/utils/inlineText';
import { queryKeys } from '@/shared/query/keys';
import type { CompendiumEntry } from '@/shared/types/domain';

const contentService = new ContentService(new SQLiteContentRepository());

interface BackgroundDetailViewProps {
  entry: CompendiumEntry;
}

function buildOverviewBlocks(entry: CompendiumEntry): DetailRenderBlock[] {
  const descriptionEntries = entry.renderPayload?.descriptionEntries;
  if (Array.isArray(descriptionEntries)) {
    const blocks = buildRenderBlocksFromEntries(descriptionEntries);
    if (blocks.length > 0) {
      return blocks;
    }
  }

  const descriptionText = typeof entry.metadata.descriptionText === 'string' ? entry.metadata.descriptionText : null;
  const tokens = descriptionText ? parseInlineText(descriptionText) : [];

  return tokens.length > 0 ? [{ kind: 'paragraph', tokens }] : [];
}

export function BackgroundDetailView({ entry }: BackgroundDetailViewProps) {
  const featIds = useMemo(() => getEntityIdsFromMetadata(entry.metadata.featIds), [entry.metadata.featIds]);
  const overviewBlocks = useMemo(() => buildOverviewBlocks(entry), [entry]);
  const detailBlocks = useMemo(() => buildRenderBlocks(entry), [entry]);
  const featsQuery = useQuery({
    queryKey: queryKeys.compendiumContentEntities(featIds),
    queryFn: () => contentService.getContentEntitiesByIds(featIds),
    enabled: featIds.length > 0,
  });
  const resolvedFeatNames = sortEntityNames(featsQuery.data?.filter((entity) => entity.entityType === 'feat') ?? [])
    .map((entity) => `${entity.name} (${entity.sourceCode})`);

  return (
    <>
      <CompendiumDetailHeader entry={entry} />
      {overviewBlocks.length > 0 ? (
        <DetailSection title="Overview">
          <RenderBlockList blocks={overviewBlocks} referenceContext={{ sourceCode: entry.sourceCode }} />
        </DetailSection>
      ) : null}
      <DetailSection title="Background Facts">
        <DetailFactGrid facts={buildBackgroundFacts(entry, resolvedFeatNames)} />
      </DetailSection>
      <DetailSection title="Details">
        <RenderBlockList blocks={detailBlocks} referenceContext={{ sourceCode: entry.sourceCode }} />
      </DetailSection>
    </>
  );
}
