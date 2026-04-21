import type { SyncRepository } from '@/features/sync/repositories/SyncRepository';

export class SyncService {
  constructor(private readonly repository: SyncRepository) {}

  listPendingMutations() {
    return this.repository.listPendingMutations();
  }
}
