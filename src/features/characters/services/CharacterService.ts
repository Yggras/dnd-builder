import type { CharacterRepository } from '@/features/characters/repositories/CharacterRepository';

export class CharacterService {
  constructor(private readonly repository: CharacterRepository) {}

  listCharacters(campaignId: string) {
    return this.repository.listCharacters(campaignId);
  }
}
