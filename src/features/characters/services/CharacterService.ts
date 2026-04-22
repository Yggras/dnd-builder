import type { CharacterRepository } from '@/features/characters/repositories/CharacterRepository';

export class CharacterService {
  constructor(private readonly repository: CharacterRepository) {}

  listCharacters() {
    return this.repository.listCharacters();
  }
}
