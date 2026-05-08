import { useMutation, useQueryClient } from '@tanstack/react-query';

import { SQLiteCharacterRepository } from '@/features/characters/adapters/SQLiteCharacterRepository';
import { CharacterService } from '@/features/characters/services/CharacterService';
import { queryKeys } from '@/shared/query/keys';

const characterService = new CharacterService(new SQLiteCharacterRepository());

export function useDeleteCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (characterId: string) => characterService.deleteCharacter(characterId),
    onSuccess: async (_result, characterId) => {
      queryClient.removeQueries({ queryKey: queryKeys.character(characterId) });
      queryClient.removeQueries({ queryKey: queryKeys.characterBuild(characterId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.characters });
    },
  });
}
