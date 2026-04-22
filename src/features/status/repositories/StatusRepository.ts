import type { CampaignCharacterStatus } from '@/shared/types/domain';

export interface StatusRepository {
  getStatus: (campaignCharacterId: string) => Promise<CampaignCharacterStatus | null>;
  updateStatus: (status: CampaignCharacterStatus) => Promise<void>;
}
