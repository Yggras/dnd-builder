import type { Campaign, CampaignMember } from '@/shared/types/domain';

export interface CampaignRepository {
  listCampaigns: () => Promise<Campaign[]>;
  getMembers: (campaignId: string) => Promise<CampaignMember[]>;
}
