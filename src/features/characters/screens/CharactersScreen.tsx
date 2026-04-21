import { FeaturePlaceholder } from '@/shared/ui/FeaturePlaceholder';

export function CharactersScreen() {
  return (
    <FeaturePlaceholder
      title="Characters"
      summary="Character records are scaffolded at the type and repository level; the builder and live screen come next."
      bullets={[
        'Character identity and ownership contracts',
        'Separated build, status, and snapshot data models',
        'Route shell for future builder and live character experiences',
      ]}
    />
  );
}
