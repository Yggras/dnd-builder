import type { Character, CharacterBuild, CharacterSnapshot } from '@/shared/types/domain';

export interface CharacterRepository {
  listCharacters: (campaignId: string) => Promise<Character[]>;
  getBuild: (characterId: string) => Promise<CharacterBuild | null>;
  getSnapshot: (characterId: string) => Promise<CharacterSnapshot | null>;
}
