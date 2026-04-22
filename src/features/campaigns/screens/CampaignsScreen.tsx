import { FeaturePlaceholder } from '@/shared/ui/FeaturePlaceholder';

export function CampaignsScreen() {
  return (
    <FeaturePlaceholder
      title="Campaigns"
      summary="Campaign creation, invites, membership, and character assignment will land in the first campaign slice."
      bullets={[
        'Campaign list and active campaign selection boundary',
        'Invite flow surface for player onboarding',
        'Assign existing characters to a campaign without changing ownership',
        'Membership sync and DM ownership rules',
      ]}
    />
  );
}
