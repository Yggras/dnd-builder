import { CompendiumDetailHeader } from '@/features/compendium/components/CompendiumDetailHeader';
import { DetailFactGrid } from '@/features/compendium/components/DetailFactGrid';
import { DetailSection } from '@/features/compendium/components/DetailSection';
import { RenderBlockList } from '@/features/compendium/components/RenderBlockList';
import { buildRenderBlocks } from '@/features/compendium/utils/detailBlocks';
import { buildFeatFacts } from '@/features/compendium/utils/detailFacts';
import type { CompendiumEntry } from '@/shared/types/domain';

interface FeatDetailViewProps {
  entry: CompendiumEntry;
}

export function FeatDetailView({ entry }: FeatDetailViewProps) {
  return (
    <>
      <CompendiumDetailHeader entry={entry} />
      <DetailSection title="Feat Facts">
        <DetailFactGrid facts={buildFeatFacts(entry)} />
      </DetailSection>
      <DetailSection title="Details">
        <RenderBlockList blocks={buildRenderBlocks(entry)} referenceContext={{ sourceCode: entry.sourceCode }} />
      </DetailSection>
    </>
  );
}
