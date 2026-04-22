import type { Character, CharacterBuild } from '@/shared/types/domain';

export interface CharacterRepository {
  listCharacters: () => Promise<Character[]>;
  getCharacter: (characterId: string) => Promise<Character | null>;
  getBuild: (characterId: string) => Promise<CharacterBuild | null>;
}
