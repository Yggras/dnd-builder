import { FeaturePlaceholder } from '@/shared/ui/FeaturePlaceholder';

export function CharactersScreen() {
  return (
    <FeaturePlaceholder
      title="My Characters"
      summary="Characters are global player-owned records that can be reused across campaigns; the first roster and builder slice comes next."
      bullets={[
        'Personal roster of reusable player-owned characters',
        'Shared build data that stays independent of campaign assignment',
        'Route shell for future builder and owned-character experiences',
      ]}
    />
  );
}
