import type { Campaign, CampaignCharacter, CampaignMember } from '@/shared/types/domain';

export interface CampaignRepository {
  listCampaigns: () => Promise<Campaign[]>;
  getMembers: (campaignId: string) => Promise<CampaignMember[]>;
  listCampaignCharacters: (campaignId: string) => Promise<CampaignCharacter[]>;
  assignCharacter: (campaignId: string, characterId: string) => Promise<void>;
  removeCharacter: (campaignId: string, characterId: string) => Promise<void>;
}
