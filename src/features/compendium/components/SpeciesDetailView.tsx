import { CompendiumDetailHeader } from '@/features/compendium/components/CompendiumDetailHeader';
import { DetailFactGrid } from '@/features/compendium/components/DetailFactGrid';
import { DetailSection } from '@/features/compendium/components/DetailSection';
import { RenderBlockList } from '@/features/compendium/components/RenderBlockList';
import { buildRenderBlocks } from '@/features/compendium/utils/detailBlocks';
import { buildSpeciesFacts } from '@/features/compendium/utils/detailFacts';
import type { CompendiumEntry } from '@/shared/types/domain';

interface SpeciesDetailViewProps {
  entry: CompendiumEntry;
}

export function SpeciesDetailView({ entry }: SpeciesDetailViewProps) {
  return (
    <>
      <CompendiumDetailHeader entry={entry} />
      <DetailSection title="Species Facts">
        <DetailFactGrid facts={buildSpeciesFacts(entry)} />
      </DetailSection>
      <DetailSection title="Traits">
        <RenderBlockList blocks={buildRenderBlocks(entry)} />
      </DetailSection>
    </>
  );
}
