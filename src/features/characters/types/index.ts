export type { CampaignCharacterSnapshot, Character, CharacterBuild } from '@/shared/types/domain';

export interface OwnedCharacterListItem {
  id: string;
  name: string;
  level: number;
  buildState: 'draft' | 'complete';
  currentStep: import('@/shared/types/domain').BuilderStep;
  classLabel: string;
  speciesLabel: string;
  updatedAt: string;
}
