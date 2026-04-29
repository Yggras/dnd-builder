import { CompendiumDetailHeader } from '@/features/compendium/components/CompendiumDetailHeader';
import { DetailSection } from '@/features/compendium/components/DetailSection';
import { DetailSummarySection } from '@/features/compendium/components/DetailSummarySection';
import { RenderBlockList } from '@/features/compendium/components/RenderBlockList';
import { buildRenderBlocks } from '@/features/compendium/utils/detailBlocks';
import type { CompendiumEntry } from '@/shared/types/domain';

interface GenericCompendiumDetailViewProps {
  entry: CompendiumEntry;
}

export function GenericCompendiumDetailView({ entry }: GenericCompendiumDetailViewProps) {
  return (
    <>
      <CompendiumDetailHeader entry={entry} />
      <DetailSummarySection summary={entry.summary} />
      <DetailSection title="Details">
        <RenderBlockList blocks={buildRenderBlocks(entry)} />
      </DetailSection>
    </>
  );
}
