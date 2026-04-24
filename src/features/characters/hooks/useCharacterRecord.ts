import { useQuery } from '@tanstack/react-query';

import { SQLiteCharacterRepository } from '@/features/characters/adapters/SQLiteCharacterRepository';
import { CharacterService } from '@/features/characters/services/CharacterService';
import { queryKeys } from '@/shared/query/keys';

const characterService = new CharacterService(new SQLiteCharacterRepository());

export function useCharacterRecord(characterId: string) {
  return useQuery({
    queryKey: queryKeys.character(characterId),
    queryFn: async () => {
      const [character, build] = await Promise.all([
        characterService.getCharacter(characterId),
        characterService.getBuild(characterId),
      ]);

      return {
        character,
        build,
      };
    },
    enabled: Boolean(characterId),
  });
}
