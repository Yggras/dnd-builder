import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/features/auth/hooks/useSession';
import { SQLiteCharacterRepository } from '@/features/characters/adapters/SQLiteCharacterRepository';
import { CharacterService } from '@/features/characters/services/CharacterService';
import { queryKeys } from '@/shared/query/keys';

const characterService = new CharacterService(new SQLiteCharacterRepository());

export function useCreateCharacterDraft() {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const ownerUserId = user?.id ?? '';

  return useMutation({
    mutationFn: (name: string) => {
      if (!ownerUserId) {
        throw new Error('No signed-in user is available for character creation.');
      }

      return characterService.createDraft({
        ownerUserId,
        name,
      });
    },
    onSuccess: ({ character, build }) => {
      queryClient.setQueryData(queryKeys.character(character.id), { character, build });
      queryClient.invalidateQueries({ queryKey: queryKeys.charactersRoster(ownerUserId) });
    },
  });
}
