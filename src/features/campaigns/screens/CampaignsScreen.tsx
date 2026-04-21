import { FeaturePlaceholder } from '@/shared/ui/FeaturePlaceholder';

export function CampaignsScreen() {
  return (
    <FeaturePlaceholder
      title="Campaigns"
      summary="Campaign creation, invites, and membership will land in the first vertical slice."
      bullets={[
        'Campaign list and active campaign selection boundary',
        'Invite flow surface for player onboarding',
        'Membership sync and DM ownership rules',
      ]}
    />
  );
}
