import type { BuilderStep } from '@/features/builder/types';

export class BuilderService {
  readonly steps: BuilderStep[] = [
    'identity',
    'species',
    'class',
    'abilities',
    'proficiencies',
    'feats',
    'spells',
    'inventory',
    'notes',
  ];
}
