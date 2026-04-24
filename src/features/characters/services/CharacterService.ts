import type { CharacterBuild } from '@/shared/types/domain';

import type { CharacterRepository, CreateCharacterDraftInput } from '@/features/characters/repositories/CharacterRepository';

export class CharacterService {
  constructor(private readonly repository: CharacterRepository) {}

  listCharacters(ownerUserId: string) {
    return this.repository.listCharacters(ownerUserId);
  }

  getCharacter(characterId: string) {
    return this.repository.getCharacter(characterId);
  }

  getBuild(characterId: string) {
    return this.repository.getBuild(characterId);
  }

  createDraft(input: CreateCharacterDraftInput) {
    return this.repository.createDraft(input);
  }

  saveBuild(build: CharacterBuild) {
    return this.repository.saveBuild(build);
  }
}
