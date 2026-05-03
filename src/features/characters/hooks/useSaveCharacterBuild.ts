import { useMutation, useQueryClient } from '@tanstack/react-query';

import { SQLiteCharacterRepository } from '@/features/characters/adapters/SQLiteCharacterRepository';
import { CharacterService } from '@/features/characters/services/CharacterService';
import type { CharacterBuild } from '@/shared/types/domain';
import { queryKeys } from '@/shared/query/keys';

const characterService = new CharacterService(new SQLiteCharacterRepository());

export function useSaveCharacterBuild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (build: CharacterBuild) => characterService.saveBuild(build),
    onSuccess: async (savedBuild) => {
      const character = await characterService.getCharacter(savedBuild.characterId);

      queryClient.setQueryData<{ character: Awaited<ReturnType<typeof characterService.getCharacter>>; build: CharacterBuild }>(queryKeys.character(savedBuild.characterId), (existing) => {
        if (existing?.build && existing.build.revision > savedBuild.revision) {
          return existing;
        }

        return {
          character,
          build: savedBuild,
        };
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.characters });
    },
  });
}
