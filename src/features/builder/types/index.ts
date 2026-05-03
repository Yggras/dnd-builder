import type { BuilderState, BuilderStep, CharacterBuild, RulesEdition } from '@/shared/types/domain';

export type BuilderIssueCategory = 'blocker' | 'checklist' | 'notice' | 'override';
export type BuilderCapabilityStatus = 'supported' | 'partially-supported' | 'missing' | 'launch-blocking';

export const builderStepOrder: readonly BuilderStep[] = [
  'class',
  'spells',
  'species',
  'background',
  'ability-points',
  'inventory',
  'characteristics',
  'notes',
  'review',
];

export const builderInitialStep: BuilderStep = 'class';
export const builderInitialState: BuilderState = 'draft';

export interface BuilderClassAllocation {
  id: string;
  classId: string;
  level: number;
  subclassId: string | null;
}

export interface BuilderFeatureChoiceSelection {
  grantId: string;
  selectedOptionIds: string[];
}

export interface BuilderSpellSelectionState {
  selectedSpellIds: string[];
  preparedSpellIds: string[];
  manualExceptionNotes: string[];
}

export interface BuilderGrantedFeatSelection {
  sourceId: string;
  selectedFeatId: string | null;
}

export interface BuilderAbilityBonusSelection {
  sourceType: 'species' | 'background' | 'asi';
  sourceId: string;
  ability: string;
  amount: number;
  packageId?: string | null;
  choiceGroupId?: string | null;
}

export interface BuilderOriginAbilityPackageSelection {
  sourceType: 'species' | 'background';
  sourceId: string;
  packageId: string;
}

export interface BuilderAbilityScoreState {
  baseScores: Record<string, number>;
  scores: Record<string, number>;
  bonusSelections: BuilderAbilityBonusSelection[];
  originAbilityPackageSelections: BuilderOriginAbilityPackageSelection[];
  asiSelections: Array<Record<string, unknown>>;
}

export interface BuilderInventoryEntry {
  itemId: string;
  quantity: number;
  equipped: boolean;
  attuned: boolean;
  source: 'starting-equipment' | 'manual-selection';
}

export interface BuilderCurrencyState {
  cp: number;
  sp: number;
  gp: number;
}

export interface BuilderStartingEquipmentChoice {
  sourceType: 'class' | 'background';
  sourceId: string;
  bundleIndex: number;
  optionKey: string;
}

export interface BuilderCharacteristicsState {
  name: string;
  age: string | null;
  alignment: string | null;
  appearance: string | null;
}

export interface BuilderIssue {
  id: string;
  category: BuilderIssueCategory;
  step: BuilderStep;
  summary: string;
  detail: string;
  affectsCompletion: boolean;
  resolvedByOverride: boolean;
}

export interface BuilderValidationSummary {
  blockers: BuilderIssue[];
  checklistItems: BuilderIssue[];
  notices: BuilderIssue[];
  overrides: BuilderIssue[];
  canComplete: boolean;
}

export interface BuilderStepResponsibility {
  step: BuilderStep;
  title: string;
  owns: string[];
  excludes: string[];
}

export interface BuilderSourceSummary {
  usesLegacyContent: boolean;
  editionsUsed: RulesEdition[];
  sourceCodes: string[];
}

export interface BuilderDraftPayload {
  version: 1;
  classStep: {
    allocations: BuilderClassAllocation[];
    featureChoices: BuilderFeatureChoiceSelection[];
  };
  spellsStep: BuilderSpellSelectionState;
  speciesStep: {
    speciesId: string | null;
    grantedFeatSelections: BuilderGrantedFeatSelection[];
    appliedSummary: string[];
  };
  backgroundStep: {
    backgroundId: string | null;
    grantedFeatSelections: BuilderGrantedFeatSelection[];
    appliedSummary: string[];
  };
  abilityPointsStep: BuilderAbilityScoreState;
  inventoryStep: {
    entries: BuilderInventoryEntry[];
    selectedStartingEquipment: BuilderStartingEquipmentChoice[];
    startingEquipmentReviewKey: string | null;
    startingCurrency: BuilderCurrencyState;
    unresolvedStartingGear: string[];
  };
  characteristicsStep: BuilderCharacteristicsState;
  notesStep: {
    notes: string | null;
  };
  review: {
    issues: BuilderIssue[];
    sourceSummary: BuilderSourceSummary;
  };
}

export function isBuilderDraftPayload(value: unknown): value is BuilderDraftPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return 'version' in value && (value as { version?: unknown }).version === 1;
}

export type BuilderCharacterBuild = Omit<CharacterBuild, 'payload'> & {
  payload: BuilderDraftPayload;
};

export interface BuilderCapabilityAuditEntry {
  capability: string;
  step: BuilderStep;
  status: BuilderCapabilityStatus;
  summary: string;
}

export const builderStepResponsibilities: readonly BuilderStepResponsibility[] = [
  {
    step: 'class',
    title: 'Class',
    owns: [
      'Class allocations',
      'Subclass selections when qualified',
      'Class-owned feature choices',
      'Multiclass prerequisite checks',
    ],
    excludes: ['Spell selection details', 'Origin choices', 'Inventory editing', 'Review approval'],
  },
  {
    step: 'spells',
    title: 'Spells',
    owns: ['Spell selections', 'Prepared and known spell counts', 'Spellcasting exceptions'],
    excludes: ['Class allocation decisions', 'Completion approval'],
  },
  {
    step: 'species',
    title: 'Species',
    owns: ['Species selection', 'Species-granted follow-up feat choices', 'Deterministic species benefits'],
    excludes: ['Background requirement', 'ASI allocation', 'Inventory editing'],
  },
  {
    step: 'background',
    title: 'Background',
    owns: ['Background selection', 'Required background resolution', 'Background-granted follow-up feat choices'],
    excludes: ['Species selection', 'Class allocation', 'Completion approval'],
  },
  {
    step: 'ability-points',
    title: 'Ability Points',
    owns: ['Manual ability score entry', 'ASI allocation', 'Feat versus ASI follow-up where applicable'],
    excludes: ['Spell selection', 'Inventory editing', 'Notes'],
  },
  {
    step: 'inventory',
    title: 'Inventory',
    owns: ['Starting equipment choices', 'Canonical inventory entries', 'Post-seeding inventory edits'],
    excludes: ['Custom items', 'Campaign-scoped inventory state', 'Completion approval'],
  },
  {
    step: 'characteristics',
    title: 'Characteristics',
    owns: ['Name', 'Age', 'Alignment', 'Appearance'],
    excludes: ['Rules-resolution overrides', 'Notes-only freeform content'],
  },
  {
    step: 'notes',
    title: 'Notes',
    owns: ['Optional freeform notes'],
    excludes: ['Mechanical validation resolution', 'Completion gating'],
  },
  {
    step: 'review',
    title: 'Review',
    owns: ['Validation summary', 'Checklist visibility', 'Override summary', 'Completion action'],
    excludes: ['Primary editing of earlier-step decisions'],
  },
];

export function summarizeBuilderIssues(issues: readonly BuilderIssue[]): BuilderValidationSummary {
  const blockers = issues.filter((issue) => issue.category === 'blocker' && !issue.resolvedByOverride);
  const checklistItems = issues.filter((issue) => issue.category === 'checklist' && !issue.resolvedByOverride);
  const notices = issues.filter((issue) => issue.category === 'notice');
  const overrides = issues.filter((issue) => issue.category === 'override' || issue.resolvedByOverride);

  return {
    blockers,
    checklistItems,
    notices,
    overrides,
    canComplete: blockers.length === 0 && checklistItems.length === 0,
  };
}

export function createEmptyBuilderDraftPayload(characterName: string): BuilderDraftPayload {
  return {
    version: 1,
    classStep: {
      allocations: [],
      featureChoices: [],
    },
    spellsStep: {
      selectedSpellIds: [],
      preparedSpellIds: [],
      manualExceptionNotes: [],
    },
    speciesStep: {
      speciesId: null,
      grantedFeatSelections: [],
      appliedSummary: [],
    },
    backgroundStep: {
      backgroundId: null,
      grantedFeatSelections: [],
      appliedSummary: [],
    },
    abilityPointsStep: {
      baseScores: {},
      scores: {},
      bonusSelections: [],
      originAbilityPackageSelections: [],
      asiSelections: [],
    },
    inventoryStep: {
      entries: [],
      selectedStartingEquipment: [],
      startingEquipmentReviewKey: null,
      startingCurrency: {
        cp: 0,
        sp: 0,
        gp: 0,
      },
      unresolvedStartingGear: [],
    },
    characteristicsStep: {
      name: characterName,
      age: null,
      alignment: null,
      appearance: null,
    },
    notesStep: {
      notes: null,
    },
    review: {
      issues: [],
      sourceSummary: {
        usesLegacyContent: false,
        editionsUsed: [],
        sourceCodes: [],
      },
    },
  };
}

export const builderCapabilityAuditBaseline: readonly BuilderCapabilityAuditEntry[] = [
  {
    capability: 'class-and-subclass-content',
    step: 'class',
    status: 'supported',
    summary: 'Builder-facing class and subclass content is available through seeded content entities.',
  },
  {
    capability: 'multiclass-allocation-model',
    step: 'class',
    status: 'supported',
    summary: 'Multiclass allocation with per-level tracking and subclass timing is implemented.',
  },
  {
    capability: 'class-owned-feature-choices',
    step: 'class',
    status: 'supported',
    summary: 'Choice grants are supported for class-owned selections with automated reconciliation and checklist fallbacks.',
  },
  {
    capability: 'strict-spell-selection',
    step: 'spells',
    status: 'supported',
    summary: 'Strict known, prepared, and cantrip limits are enforced with multiclass spell rules and manual exceptions.',
  },
  {
    capability: 'spell-class-linkage',
    step: 'spells',
    status: 'partially-supported',
    summary: 'Basic spell filtering is functional, but deep rules linkage for complex spell lists still uses metadata-driven approximations.',
  },
  {
    capability: 'species-content-and-selection',
    step: 'species',
    status: 'supported',
    summary: 'Species content is seeded and builder-selectable, including metadata for guided selection.',
  },
  {
    capability: 'background-content-and-selection',
    step: 'background',
    status: 'supported',
    summary: 'Background content is seeded and builder-selectable, including equipment and feat-oriented metadata.',
  },
  {
    capability: 'deterministic-origin-automation',
    step: 'background',
    status: 'supported',
    summary: 'Origin metadata drives automated ability packages, granted feats, and deterministic benefits.',
  },
  {
    capability: 'manual-ability-and-asi-handling',
    step: 'ability-points',
    status: 'supported',
    summary: 'Manual ability score entry, origin bonuses, and ASI point allocation are implemented with validation.',
  },
  {
    capability: 'starting-equipment-seeding',
    step: 'inventory',
    status: 'supported',
    summary: 'Class and background starting-equipment data seeds canonical inventory entries with non-destructive reconciliation.',
  },
  {
    capability: 'canonical-item-inventory',
    step: 'inventory',
    status: 'supported',
    summary: 'Canonical item search and manual inventory management are supported.',
  },
  {
    capability: 'characteristics-and-notes',
    step: 'characteristics',
    status: 'supported',
    summary: 'Roleplay-facing characteristics (name, age, alignment, appearance) and freeform notes are implemented.',
  },
  {
    capability: 'review-and-completion-engine',
    step: 'review',
    status: 'supported',
    summary: 'Coherent review engine with blockers, checklist items, and completion gating is fully implemented.',
  },
];
