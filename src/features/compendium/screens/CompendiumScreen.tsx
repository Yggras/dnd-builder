import { FeaturePlaceholder } from '@/shared/ui/FeaturePlaceholder';

export function CompendiumScreen() {
  return (
    <FeaturePlaceholder
      title="Compendium"
      summary="The normalized content boundary is in place so search and caching can be added on a stable contract."
      bullets={[
        'Compendium entry contract for curated 5e content',
        'Space for local-first search and filtering hooks',
        'Legacy 2014 labeling alongside 2024-first content',
      ]}
    />
  );
}
