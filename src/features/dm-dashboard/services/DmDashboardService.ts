import type { CharacterSnapshot } from '@/shared/types/domain';

export class DmDashboardService {
  sortPartySnapshots(snapshots: CharacterSnapshot[]): CharacterSnapshot[] {
    return [...snapshots].sort((left, right) => left.name.localeCompare(right.name));
  }
}
