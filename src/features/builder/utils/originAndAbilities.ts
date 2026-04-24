import type {
  BuilderAbilityBonusSelection,
  BuilderDraftPayload,
  BuilderGrantedFeatSelection,
  BuilderIssue,
} from '@/features/builder/types';
import type { ContentEntity } from '@/shared/types/domain';

type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

type AbilityRequirement = {
  sourceType: 'species' | 'background';
  sourceId: string;
  choices: Array<{ amount: number; count: number; options: AbilityKey[] }>;
  deterministicBonuses: BuilderAbilityBonusSelection[];
};

interface ReconcileOriginAndAbilitiesOptions {
  payload: BuilderDraftPayload;
  classEntitiesById: Record<string, ContentEntity>;
  speciesEntitiesById: Record<string, ContentEntity>;
  backgroundEntitiesById: Record<string, ContentEntity>;
  featEntitiesById: Record<string, ContentEntity>;
}

interface ReconcileOriginAndAbilitiesResult {
  payload: BuilderDraftPayload;
  impactSummary: string | null;
}

const ABILITY_KEYS: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export function normalizeAbilityChoices(
  sourceType: 'species' | 'background',
  sourceId: string,
  metadataValue: unknown,
): AbilityRequirement {
  if (!Array.isArray(metadataValue)) {
    return {
      sourceType,
      sourceId,
      choices: [],
      deterministicBonuses: [],
    };
  }

  const requirement: AbilityRequirement = {
    sourceType,
    sourceId,
    choices: [],
    deterministicBonuses: [],
  };

  for (const entry of metadataValue) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const maybeChoose = (entry as { choose?: unknown }).choose;

    if (maybeChoose && typeof maybeChoose === 'object') {
      const weighted = (maybeChoose as { weighted?: unknown }).weighted;

      if (weighted && typeof weighted === 'object') {
        const options = Array.isArray((weighted as { from?: unknown }).from)
          ? ((weighted as { from: unknown[] }).from.filter(
              (value): value is AbilityKey => typeof value === 'string' && ABILITY_KEYS.includes(value as AbilityKey),
            ) as AbilityKey[])
          : [];
        const weights = Array.isArray((weighted as { weights?: unknown }).weights)
          ? ((weighted as { weights: unknown[] }).weights.filter((value): value is number => typeof value === 'number'))
          : [];

        for (const weight of weights) {
          requirement.choices.push({
            amount: weight,
            count: 1,
            options,
          });
        }
      }

      continue;
    }

    for (const [ability, amount] of Object.entries(entry)) {
      if (ABILITY_KEYS.includes(ability as AbilityKey) && typeof amount === 'number' && amount > 0) {
        requirement.deterministicBonuses.push({
          sourceType,
          sourceId,
          ability,
          amount,
        });
      }
    }
  }

  return requirement;
}

function summarizeOriginEntity(entity: ContentEntity) {
  const summaryParts: string[] = [];

  if (Array.isArray(entity.metadata.size) && entity.metadata.size.length > 0) {
    summaryParts.push(`Size ${entity.metadata.size.join('/')}`);
  }

  if (typeof entity.metadata.speed === 'number') {
    summaryParts.push(`Speed ${entity.metadata.speed}`);
  } else if (entity.metadata.speed && typeof entity.metadata.speed === 'object') {
    const speedSummary = Object.entries(entity.metadata.speed as Record<string, unknown>)
      .filter(([, value]) => typeof value === 'number')
      .map(([mode, value]) => `${mode} ${value}`)
      .join(', ');

    if (speedSummary) {
      summaryParts.push(`Speed ${speedSummary}`);
    }
  }

  if (typeof entity.metadata.darkvision === 'number') {
    summaryParts.push(`Darkvision ${entity.metadata.darkvision} ft`);
  }

  if (Array.isArray(entity.metadata.skillProficiencies) && entity.metadata.skillProficiencies.length === 1) {
    const skillEntry = entity.metadata.skillProficiencies[0];

    if (skillEntry && typeof skillEntry === 'object') {
      const skills = Object.entries(skillEntry as Record<string, unknown>)
        .filter(([, enabled]) => enabled === true)
        .map(([skill]) => skill);

      if (skills.length > 0) {
        summaryParts.push(`Skills ${skills.join(', ')}`);
      }
    }
  }

  if (Array.isArray(entity.metadata.toolProficiencies) && entity.metadata.toolProficiencies.length === 1) {
    const toolEntry = entity.metadata.toolProficiencies[0];

    if (toolEntry && typeof toolEntry === 'object') {
      const tools = Object.entries(toolEntry as Record<string, unknown>)
        .filter(([, enabled]) => enabled === true)
        .map(([tool]) => tool);

      if (tools.length > 0) {
        summaryParts.push(`Tools ${tools.join(', ')}`);
      }
    }
  }

  return summaryParts;
}

function reconcileGrantedFeatSelections(
  sourceId: string,
  featIds: string[],
  currentSelections: BuilderGrantedFeatSelection[],
  featEntitiesById: Record<string, ContentEntity>,
): {
  selections: BuilderGrantedFeatSelection[];
  issues: BuilderIssue[];
  selectionClears: number;
} {
  const validFeatIds = featIds.filter((featId) => featEntitiesById[featId]);
  const existingSelections = currentSelections.filter((selection) => selection.sourceId === sourceId);
  let selectionClears = 0;

  if (validFeatIds.length === 0) {
    selectionClears += existingSelections.length;
    return {
      selections: [] as BuilderGrantedFeatSelection[],
      issues: [] as BuilderIssue[],
      selectionClears,
    };
  }

  if (validFeatIds.length === 1) {
    const autoSelection = validFeatIds[0];
    const changed = existingSelections[0]?.selectedFeatId !== autoSelection;

    return {
      selections: [{ sourceId, selectedFeatId: autoSelection }],
      issues: [] as BuilderIssue[],
      selectionClears: selectionClears + (changed ? 1 : 0),
    };
  }

  const currentSelection = existingSelections.find((selection) => selection.selectedFeatId && validFeatIds.includes(selection.selectedFeatId));

  if (currentSelection) {
    return {
      selections: [{ sourceId, selectedFeatId: currentSelection.selectedFeatId }],
      issues: [] as BuilderIssue[],
      selectionClears,
    };
  }

  return {
    selections: [{ sourceId, selectedFeatId: null }],
    issues: [
      {
        id: `granted-feat-${sourceId}`,
        category: 'checklist',
        step: sourceId.includes('|species') ? 'species' : 'background',
        summary: 'A granted feat still needs to be selected.',
        detail: 'Choose the granted feat provided by the current origin content.',
        affectsCompletion: true,
        resolvedByOverride: false,
      },
    ],
    selectionClears: selectionClears + existingSelections.length,
  };
}

export function countAvailableAsiPoints(payload: BuilderDraftPayload, classEntitiesById: Record<string, ContentEntity>) {
  let asiCount = 0;

  for (const allocation of payload.classStep.allocations) {
    const classEntity = classEntitiesById[allocation.classId];

    if (!classEntity || !Array.isArray(classEntity.metadata.classFeatures)) {
      continue;
    }

    for (const classFeature of classEntity.metadata.classFeatures) {
      if (typeof classFeature !== 'string' || !classFeature.startsWith('Ability Score Improvement|')) {
        continue;
      }

      const levelToken = classFeature.split('|').at(-1);
      const featureLevel = levelToken ? Number.parseInt(levelToken, 10) : Number.NaN;

      if (Number.isFinite(featureLevel) && featureLevel <= allocation.level) {
        asiCount += 1;
      }
    }
  }

  return asiCount * 2;
}

function mergeStepIssues(payload: BuilderDraftPayload, nextIssues: BuilderIssue[], steps: Array<BuilderIssue['step']>) {
  const preservedIssues = payload.review.issues.filter((issue) => !steps.includes(issue.step));
  return [...preservedIssues, ...nextIssues];
}

export function reconcileOriginAndAbilitiesPayload({
  payload,
  classEntitiesById,
  speciesEntitiesById,
  backgroundEntitiesById,
  featEntitiesById,
}: ReconcileOriginAndAbilitiesOptions): ReconcileOriginAndAbilitiesResult {
  const nextPayload: BuilderDraftPayload = {
    ...payload,
    speciesStep: {
      ...payload.speciesStep,
      appliedSummary: [],
    },
    backgroundStep: {
      ...payload.backgroundStep,
      appliedSummary: [],
    },
    abilityPointsStep: {
      ...payload.abilityPointsStep,
      baseScores: { ...payload.abilityPointsStep.baseScores },
      scores: {},
      bonusSelections: payload.abilityPointsStep.bonusSelections.filter((selection) => selection.sourceType === 'asi'),
    },
  };

  const issues: BuilderIssue[] = [];
  let impactChanges = 0;

  const speciesEntity = nextPayload.speciesStep.speciesId ? speciesEntitiesById[nextPayload.speciesStep.speciesId] : null;
  const backgroundEntity = nextPayload.backgroundStep.backgroundId ? backgroundEntitiesById[nextPayload.backgroundStep.backgroundId] : null;

  if (!speciesEntity) {
    issues.push({
      id: 'species-required',
      category: 'blocker',
      step: 'species',
      summary: 'A species is required.',
      detail: 'Choose a species before the build can complete.',
      affectsCompletion: true,
      resolvedByOverride: false,
    });
  } else {
    nextPayload.speciesStep.appliedSummary = summarizeOriginEntity(speciesEntity);
  }

  if (!backgroundEntity) {
    issues.push({
      id: 'background-required',
      category: 'blocker',
      step: 'background',
      summary: 'A background is required.',
      detail: 'Choose a background before the build can complete.',
      affectsCompletion: true,
      resolvedByOverride: false,
    });
  } else {
    nextPayload.backgroundStep.appliedSummary = summarizeOriginEntity(backgroundEntity);
  }

  const originRequirements = [
    speciesEntity
      ? normalizeAbilityChoices('species', speciesEntity.id, speciesEntity.metadata.ability)
      : { sourceType: 'species' as const, sourceId: 'species', choices: [], deterministicBonuses: [] },
    backgroundEntity
      ? normalizeAbilityChoices('background', backgroundEntity.id, backgroundEntity.metadata.ability)
      : { sourceType: 'background' as const, sourceId: 'background', choices: [], deterministicBonuses: [] },
  ];

  for (const requirement of originRequirements) {
    nextPayload.abilityPointsStep.bonusSelections.push(...requirement.deterministicBonuses);

    for (const choice of requirement.choices) {
      const matchingSelections = nextPayload.abilityPointsStep.bonusSelections.filter(
        (selection) =>
          selection.sourceId === requirement.sourceId &&
          selection.sourceType === requirement.sourceType &&
          selection.amount === choice.amount &&
          choice.options.includes(selection.ability as AbilityKey),
      );

      if (matchingSelections.length < choice.count) {
        issues.push({
          id: `origin-ability-${requirement.sourceId}-${choice.amount}-${choice.count}`,
          category: 'checklist',
          step: requirement.sourceType === 'species' ? 'species' : 'background',
          summary: 'Origin ability bonuses still need to be assigned.',
          detail: `Assign ${choice.count} ability bonus selection${choice.count === 1 ? '' : 's'} of +${choice.amount}.`,
          affectsCompletion: true,
          resolvedByOverride: false,
        });
      }
    }
  }

  if (speciesEntity) {
    const featIds = Array.isArray(speciesEntity.metadata.featIds)
      ? speciesEntity.metadata.featIds.filter((value): value is string => typeof value === 'string')
      : [];
    const reconciliation = reconcileGrantedFeatSelections(
      speciesEntity.id,
      featIds,
      nextPayload.speciesStep.grantedFeatSelections,
      featEntitiesById,
    );
    nextPayload.speciesStep.grantedFeatSelections = reconciliation.selections;
    issues.push(...reconciliation.issues);
    impactChanges += reconciliation.selectionClears;
  } else {
    impactChanges += nextPayload.speciesStep.grantedFeatSelections.length;
    nextPayload.speciesStep.grantedFeatSelections = [];
  }

  if (backgroundEntity) {
    const featIds = Array.isArray(backgroundEntity.metadata.featIds)
      ? backgroundEntity.metadata.featIds.filter((value): value is string => typeof value === 'string')
      : [];
    const reconciliation = reconcileGrantedFeatSelections(
      backgroundEntity.id,
      featIds,
      nextPayload.backgroundStep.grantedFeatSelections,
      featEntitiesById,
    );
    nextPayload.backgroundStep.grantedFeatSelections = reconciliation.selections;
    issues.push(...reconciliation.issues);
    impactChanges += reconciliation.selectionClears;
  } else {
    impactChanges += nextPayload.backgroundStep.grantedFeatSelections.length;
    nextPayload.backgroundStep.grantedFeatSelections = [];
  }

  const availableAsiPoints = countAvailableAsiPoints(nextPayload, classEntitiesById);
  const asiSelections = nextPayload.abilityPointsStep.bonusSelections.filter((selection) => selection.sourceType === 'asi');
  const asiPointsSpent = asiSelections.reduce((sum, selection) => sum + selection.amount, 0);

  if (asiPointsSpent > availableAsiPoints) {
    issues.push({
      id: 'asi-overfill',
      category: 'blocker',
      step: 'ability-points',
      summary: 'Too many ASI points are allocated.',
      detail: `Reduce ability improvements until no more than ${availableAsiPoints} ASI points are spent.`,
      affectsCompletion: true,
      resolvedByOverride: false,
    });
  }

  const finalScores: Record<string, number> = {};

  for (const ability of ABILITY_KEYS) {
    const baseScore = nextPayload.abilityPointsStep.baseScores[ability];

    if (typeof baseScore !== 'number' || !Number.isFinite(baseScore)) {
      issues.push({
        id: `base-score-${ability}`,
        category: 'blocker',
        step: 'ability-points',
        summary: `A base ${ability.toUpperCase()} score is required.`,
        detail: 'Enter all six base ability scores before the build can complete.',
        affectsCompletion: true,
        resolvedByOverride: false,
      });
      continue;
    }

    if (baseScore < 1 || baseScore > 20) {
      issues.push({
        id: `base-score-range-${ability}`,
        category: 'blocker',
        step: 'ability-points',
        summary: `${ability.toUpperCase()} must stay between 1 and 20.`,
        detail: 'Adjust the base ability score to a legal value.',
        affectsCompletion: true,
        resolvedByOverride: false,
      });
    }

    const bonuses = nextPayload.abilityPointsStep.bonusSelections
      .filter((selection) => selection.ability === ability)
      .reduce((sum, selection) => sum + selection.amount, 0);

    finalScores[ability] = baseScore + bonuses;
  }

  nextPayload.abilityPointsStep.scores = finalScores;
  nextPayload.review.issues = mergeStepIssues(nextPayload, issues, ['species', 'background', 'ability-points']);

  return {
    payload: nextPayload,
    impactSummary:
      impactChanges > 0 ? `Origin changes updated ${impactChanges} granted-feat selection${impactChanges === 1 ? '' : 's'}.` : null,
  };
}
