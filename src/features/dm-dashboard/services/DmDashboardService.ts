import type { CampaignCharacterSnapshot } from '@/shared/types/domain';

export class DmDashboardService {
  sortPartySnapshots(snapshots: CampaignCharacterSnapshot[]): CampaignCharacterSnapshot[] {
    return [...snapshots].sort((left, right) => left.name.localeCompare(right.name));
  }
}
