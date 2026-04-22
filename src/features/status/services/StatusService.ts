import type { StatusRepository } from '@/features/status/repositories/StatusRepository';

export class StatusService {
  constructor(private readonly repository: StatusRepository) {}

  getStatus(campaignCharacterId: string) {
    return this.repository.getStatus(campaignCharacterId);
  }
}
