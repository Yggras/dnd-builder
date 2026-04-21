import type { CharacterStatus } from '@/shared/types/domain';

export interface StatusRepository {
  getStatus: (characterId: string) => Promise<CharacterStatus | null>;
  updateStatus: (status: CharacterStatus) => Promise<void>;
}
