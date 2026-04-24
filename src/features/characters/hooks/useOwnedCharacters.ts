import { useQuery } from '@tanstack/react-query';

import { useSession } from '@/features/auth/hooks/useSession';
import { SQLiteCharacterRepository } from '@/features/characters/adapters/SQLiteCharacterRepository';
import { CharacterService } from '@/features/characters/services/CharacterService';
import { queryKeys } from '@/shared/query/keys';

const characterService = new CharacterService(new SQLiteCharacterRepository());

export function useOwnedCharacters() {
  const { user } = useSession();
  const ownerUserId = user?.id ?? '';

  return useQuery({
    queryKey: queryKeys.charactersRoster(ownerUserId),
    queryFn: () => characterService.listCharacters(ownerUserId),
    enabled: Boolean(ownerUserId),
  });
}
