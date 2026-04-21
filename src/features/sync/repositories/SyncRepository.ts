import type { PendingMutation } from '@/shared/types/domain';

export interface SyncRepository {
  listPendingMutations: () => Promise<PendingMutation[]>;
  enqueueMutation: (mutation: PendingMutation) => Promise<void>;
}
