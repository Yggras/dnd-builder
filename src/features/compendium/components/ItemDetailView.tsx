import { CompendiumDetailHeader } from '@/features/compendium/components/CompendiumDetailHeader';
import { DetailFactGrid } from '@/features/compendium/components/DetailFactGrid';
import { DetailSection } from '@/features/compendium/components/DetailSection';
import { RenderBlockList } from '@/features/compendium/components/RenderBlockList';
import { buildRenderBlocks } from '@/features/compendium/utils/detailBlocks';
import { buildItemFacts, buildSourceFacts } from '@/features/compendium/utils/detailFacts';
import type { CompendiumEntry } from '@/shared/types/domain';

interface ItemDetailViewProps {
  entry: CompendiumEntry;
}

export function ItemDetailView({ entry }: ItemDetailViewProps) {
  const itemFacts = buildItemFacts(entry);
  const sourceFacts = buildSourceFacts(entry);

  return (
    <>
      <CompendiumDetailHeader entry={entry} />
      <DetailSection title="Item Facts">
        <DetailFactGrid facts={[...itemFacts, ...sourceFacts]} />
      </DetailSection>
      <DetailSection title="Details">
        <RenderBlockList blocks={buildRenderBlocks(entry)} referenceContext={{ sourceCode: entry.sourceCode }} />
      </DetailSection>
    </>
  );
}
