import type { BuilderState, BuilderStep, RulesEdition } from '@/shared/types/domain';

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
}

export interface BuilderAbilityScoreState {
  baseScores: Record<string, number>;
  scores: Record<string, number>;
  bonusSelections: BuilderAbilityBonusSelection[];
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
  [key: string]: unknown;
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
      asiSelections: [],
    },
    inventoryStep: {
      entries: [],
      selectedStartingEquipment: [],
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
    status: 'missing',
    summary: 'The product requires explicit multiclass allocation, but no builder-owned allocation model exists yet.',
  },
  {
    capability: 'class-owned-feature-choices',
    step: 'class',
    status: 'partially-supported',
    summary: 'Choice grants exist for some class-owned selections, but coverage is incomplete and needs checklist fallbacks.',
  },
  {
    capability: 'strict-spell-selection',
    step: 'spells',
    status: 'launch-blocking',
    summary: 'Spell content exists, but builder spell selection and strict spellcasting validation are not implemented yet.',
  },
  {
    capability: 'spell-class-linkage',
    step: 'spells',
    status: 'launch-blocking',
    summary: 'Current spell filtering relies on shallow metadata matching and is not sufficient for launch-grade strict spell rules.',
  },
  {
    capability: 'species-content-and-selection',
    step: 'species',
    status: 'supported',
    summary: 'Species content is seeded and builder-selectable, including metadata needed for guided selection.',
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
    status: 'partially-supported',
    summary: 'Origin metadata is available, but builder automation and follow-up handling still need implementation.',
  },
  {
    capability: 'manual-ability-and-asi-handling',
    step: 'ability-points',
    status: 'missing',
    summary: 'The spec requires manual ability and ASI handling with rules enforcement, but no contract implementation exists yet.',
  },
  {
    capability: 'starting-equipment-seeding',
    step: 'inventory',
    status: 'supported',
    summary: 'Class and background starting-equipment data now seeds canonical inventory entries, tracks currency, and flags unresolved special outputs.',
  },
  {
    capability: 'canonical-item-inventory',
    step: 'inventory',
    status: 'supported',
    summary: 'Canonical item content is available for an inventory step that forbids custom items in v1.',
  },
  {
    capability: 'characteristics-and-notes',
    step: 'characteristics',
    status: 'missing',
    summary: 'The roleplay-facing characteristics and optional notes contract is not represented in the current builder state model.',
  },
  {
    capability: 'review-and-completion-engine',
    step: 'review',
    status: 'missing',
    summary: 'No review, issue categorization, completion gating, or regression-to-draft behavior exists yet.',
  },
];
