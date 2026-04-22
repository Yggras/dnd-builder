import { FeaturePlaceholder } from '@/shared/ui/FeaturePlaceholder';

export function DmDashboardScreen() {
  return (
    <FeaturePlaceholder
      title="DM Dashboard"
      summary="The dashboard route is ready for the first read-only party overview backed by campaign-assigned snapshots and live status."
      bullets={[
        'Read-only DM access boundary for v1',
        'Campaign-assigned party snapshot list surface for live session monitoring',
        'Future realtime subscription hooks at campaign scope',
      ]}
    />
  );
}
