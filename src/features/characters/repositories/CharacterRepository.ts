import type { Character, CharacterBuild } from '@/shared/types/domain';

import type { OwnedCharacterListItem } from '@/features/characters/types';

export interface CreateCharacterDraftInput {
  ownerUserId: string;
  name: string;
}

export interface CharacterRepository {
  listCharacters: (ownerUserId: string) => Promise<OwnedCharacterListItem[]>;
  getCharacter: (characterId: string) => Promise<Character | null>;
  getBuild: (characterId: string) => Promise<CharacterBuild | null>;
  createDraft: (input: CreateCharacterDraftInput) => Promise<{ character: Character; build: CharacterBuild }>;
  saveBuild: (build: CharacterBuild) => Promise<CharacterBuild>;
}
