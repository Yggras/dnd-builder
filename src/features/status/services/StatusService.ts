import type { StatusRepository } from '@/features/status/repositories/StatusRepository';

export class StatusService {
  constructor(private readonly repository: StatusRepository) {}

  getStatus(characterId: string) {
    return this.repository.getStatus(characterId);
  }
}
