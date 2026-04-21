import type { CampaignRepository } from '@/features/campaigns/repositories/CampaignRepository';

export class CampaignService {
  constructor(private readonly repository: CampaignRepository) {}

  listCampaigns() {
    return this.repository.listCampaigns();
  }
}
