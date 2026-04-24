import type { BuilderDraftPayload, BuilderFeatureChoiceSelection, BuilderIssue } from '@/features/builder/types';
import type { ChoiceGrant, ContentEntity } from '@/shared/types/domain';

interface ReconcileClassStepOptions {
  payload: BuilderDraftPayload;
  classEntitiesById: Record<string, ContentEntity>;
  grantsByClassId: Record<string, ChoiceGrant[]>;
  grantOptionsByGrantId: Record<string, ContentEntity[]>;
}

interface ReconcileClassStepResult {
  payload: BuilderDraftPayload;
  impactSummary: string | null;
}

type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

function getBuilderAbilityScores(payload: BuilderDraftPayload) {
  return payload.abilityPointsStep.scores as Partial<Record<AbilityKey, number>>;
}

function getClassPrimaryAbilityCombos(classEntity: ContentEntity) {
  const primaryAbility = classEntity.metadata.primaryAbility;

  if (!Array.isArray(primaryAbility)) {
    return [] as AbilityKey[][];
  }

  return primaryAbility
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return [] as AbilityKey[];
      }

      return Object.entries(entry)
        .filter(([, value]) => value === true)
        .map(([ability]) => ability as AbilityKey);
    })
    .filter((entry) => entry.length > 0);
}

export function getSubclassUnlockLevel(classEntity: ContentEntity) {
  const classFeatures = classEntity.metadata.classFeatures;

  if (!Array.isArray(classFeatures)) {
    return null;
  }

  let unlockLevel: number | null = null;

  for (const feature of classFeatures) {
    if (!feature || typeof feature !== 'object') {
      continue;
    }

    const maybeSubclassFeature = feature as { classFeature?: unknown; gainSubclassFeature?: unknown };

    if (!maybeSubclassFeature.gainSubclassFeature || typeof maybeSubclassFeature.classFeature !== 'string') {
      continue;
    }

    const levelToken = maybeSubclassFeature.classFeature.split('|').at(-1);
    const parsedLevel = levelToken ? Number.parseInt(levelToken, 10) : Number.NaN;

    if (Number.isFinite(parsedLevel)) {
      unlockLevel = unlockLevel == null ? parsedLevel : Math.min(unlockLevel, parsedLevel);
    }
  }

  return unlockLevel;
}

function getApplicableGrants(payload: BuilderDraftPayload, grantsByClassId: Record<string, ChoiceGrant[]>) {
  return payload.classStep.allocations.flatMap((allocation) => {
    if (!allocation.classId) {
      return [] as ChoiceGrant[];
    }

    return (grantsByClassId[allocation.classId] ?? []).filter(
      (grant) => grant.visibility === 'builder' && grant.atLevel <= allocation.level,
    );
  });
}

function sanitizeFeatureChoices(
  selections: BuilderFeatureChoiceSelection[],
  applicableGrants: ChoiceGrant[],
  grantOptionsByGrantId: Record<string, ContentEntity[]>,
) {
  const applicableGrantsById = Object.fromEntries(applicableGrants.map((grant) => [grant.id, grant]));
  let removedSelectionCount = 0;

  const sanitizedSelections = selections.flatMap((selection) => {
    const grant = applicableGrantsById[selection.grantId];

    if (!grant) {
      removedSelectionCount += selection.selectedOptionIds.length || 1;
      return [];
    }

    const validOptionIds = new Set((grantOptionsByGrantId[grant.id] ?? []).map((option) => option.id));
    const sanitizedOptionIds = selection.selectedOptionIds.filter((optionId) => validOptionIds.has(optionId)).slice(0, grant.count);

    removedSelectionCount += selection.selectedOptionIds.length - sanitizedOptionIds.length;

    return [
      {
        ...selection,
        selectedOptionIds: sanitizedOptionIds,
      },
    ];
  });

  return {
    sanitizedSelections,
    removedSelectionCount,
  };
}

function buildMulticlassIssue(classEntity: ContentEntity, summary: string): BuilderIssue {
  return {
    id: `multiclass-${classEntity.id}`,
    category: 'blocker',
    step: 'class',
    summary: `Multiclass prerequisite unresolved for ${classEntity.name}`,
    detail: summary,
    affectsCompletion: true,
    resolvedByOverride: false,
  };
}

function mergeStepIssues(payload: BuilderDraftPayload, nextIssues: BuilderIssue[]) {
  const preservedIssues = payload.review.issues.filter((issue) => issue.step !== 'class');
  return [...preservedIssues, ...nextIssues];
}

export function reconcileClassStepPayload({
  payload,
  classEntitiesById,
  grantsByClassId,
  grantOptionsByGrantId,
}: ReconcileClassStepOptions): ReconcileClassStepResult {
  let clearedSubclassCount = 0;

  const sanitizedAllocations = payload.classStep.allocations.map((allocation) => {
    const classEntity = classEntitiesById[allocation.classId];

    if (!classEntity) {
      if (allocation.subclassId) {
        clearedSubclassCount += 1;
      }

      return {
        ...allocation,
        subclassId: null,
      };
    }

    const subclassUnlockLevel = getSubclassUnlockLevel(classEntity);

    if (subclassUnlockLevel != null && allocation.level < subclassUnlockLevel && allocation.subclassId) {
      clearedSubclassCount += 1;
      return {
        ...allocation,
        subclassId: null,
      };
    }

    return allocation;
  });

  const nextPayload: BuilderDraftPayload = {
    ...payload,
    classStep: {
      ...payload.classStep,
      allocations: sanitizedAllocations,
      featureChoices: payload.classStep.featureChoices,
    },
  };

  const issues: BuilderIssue[] = [];
  const totalLevel = nextPayload.classStep.allocations.reduce((sum, allocation) => sum + allocation.level, 0);
  const duplicateClassIds = new Set<string>();
  const seenClassIds = new Set<string>();
  const applicableGrants = getApplicableGrants(nextPayload, grantsByClassId);
  const { sanitizedSelections, removedSelectionCount } = sanitizeFeatureChoices(
    nextPayload.classStep.featureChoices,
    applicableGrants,
    grantOptionsByGrantId,
  );

  nextPayload.classStep.featureChoices = sanitizedSelections;

  if (nextPayload.classStep.allocations.length === 0) {
    issues.push({
      id: 'class-required',
      category: 'blocker',
      step: 'class',
      summary: 'At least one class is required.',
      detail: 'Choose a class to establish the structural anchor of the build.',
      affectsCompletion: true,
      resolvedByOverride: false,
    });
  }

  if (totalLevel > 20) {
    issues.push({
      id: 'total-level-cap',
      category: 'blocker',
      step: 'class',
      summary: 'Total class levels cannot exceed 20.',
      detail: 'Reduce one or more class levels until the combined total is 20 or lower.',
      affectsCompletion: true,
      resolvedByOverride: false,
    });
  }

  for (const allocation of nextPayload.classStep.allocations) {
    if (!allocation.classId) {
      issues.push({
        id: `allocation-class-${allocation.id}`,
        category: 'blocker',
        step: 'class',
        summary: 'Each allocation row must choose a class.',
        detail: 'Select a class for every row in the class allocation table.',
        affectsCompletion: true,
        resolvedByOverride: false,
      });
      continue;
    }

    if (seenClassIds.has(allocation.classId)) {
      duplicateClassIds.add(allocation.classId);
    }

    seenClassIds.add(allocation.classId);

    const classEntity = classEntitiesById[allocation.classId];

    if (!classEntity) {
      issues.push({
        id: `missing-class-${allocation.classId}`,
        category: 'checklist',
        step: 'class',
        summary: `Builder support for ${allocation.classId} is unresolved.`,
        detail: 'This class is not currently available in the local builder content set.',
        affectsCompletion: true,
        resolvedByOverride: false,
      });
      continue;
    }

    const subclassUnlockLevel = getSubclassUnlockLevel(classEntity);

    if (subclassUnlockLevel != null && allocation.level >= subclassUnlockLevel && !allocation.subclassId) {
      issues.push({
        id: `subclass-required-${allocation.id}`,
        category: 'checklist',
        step: 'class',
        summary: `${classEntity.name} needs a subclass at level ${subclassUnlockLevel}.`,
        detail: 'Select a subclass now that the class level qualifies for one.',
        affectsCompletion: true,
        resolvedByOverride: false,
      });
    }
  }

  if (duplicateClassIds.size > 0) {
    issues.push({
      id: 'duplicate-class-allocations',
      category: 'blocker',
      step: 'class',
      summary: 'A class can only appear once in the allocation table.',
      detail: 'Increase the level in the existing row instead of adding the same class again.',
      affectsCompletion: true,
      resolvedByOverride: false,
    });
  }

  if (nextPayload.classStep.allocations.length > 1) {
    const abilityScores = getBuilderAbilityScores(nextPayload);

    for (const allocation of nextPayload.classStep.allocations) {
      const classEntity = classEntitiesById[allocation.classId];

      if (!classEntity) {
        continue;
      }

      const primaryAbilityCombos = getClassPrimaryAbilityCombos(classEntity);

      if (primaryAbilityCombos.length === 0) {
        issues.push({
          id: `multiclass-support-${classEntity.id}`,
          category: 'checklist',
          step: 'class',
          summary: `${classEntity.name} lacks structured multiclass prerequisite metadata.`,
          detail: 'This multiclass combination needs explicit review because the prerequisite contract is incomplete.',
          affectsCompletion: true,
          resolvedByOverride: false,
        });
        continue;
      }

      const allRelevantAbilities = new Set(primaryAbilityCombos.flat());
      const hasResolvedAbilities = [...allRelevantAbilities].every((ability) => typeof abilityScores[ability] === 'number');

      if (!hasResolvedAbilities) {
        issues.push(
          buildMulticlassIssue(
            classEntity,
            'Set the required ability scores before the builder can confirm this multiclass allocation.',
          ),
        );
        continue;
      }

      const satisfiesAnyCombo = primaryAbilityCombos.some((combo) => combo.every((ability) => (abilityScores[ability] ?? 0) >= 13));

      if (!satisfiesAnyCombo) {
        issues.push(
          buildMulticlassIssue(
            classEntity,
            'This class currently fails the builder multiclass prerequisite check based on the available primary-ability metadata.',
          ),
        );
      }
    }
  }

  for (const grant of applicableGrants) {
    const selectedOptionIds = sanitizedSelections.find((selection) => selection.grantId === grant.id)?.selectedOptionIds ?? [];
    const availableOptions = grantOptionsByGrantId[grant.id] ?? [];

    if (availableOptions.length === 0) {
      issues.push({
        id: `grant-options-${grant.id}`,
        category: 'checklist',
        step: 'class',
        summary: `${grant.sourceName} has a class-owned feature choice without builder options.`,
        detail: 'This choice needs explicit support or an override before the build can complete.',
        affectsCompletion: true,
        resolvedByOverride: false,
      });
      continue;
    }

    if (selectedOptionIds.length < grant.count) {
      issues.push({
        id: `grant-selection-${grant.id}`,
        category: 'checklist',
        step: 'class',
        summary: `${grant.sourceName} still needs ${grant.count} class-owned selection${grant.count === 1 ? '' : 's'}.`,
        detail: 'Choose the required class-owned features inside the class step.',
        affectsCompletion: true,
        resolvedByOverride: false,
      });
    }
  }

  nextPayload.review = {
    ...nextPayload.review,
    issues: mergeStepIssues(nextPayload, issues),
  };

  const impactParts = [
    clearedSubclassCount > 0 ? `${clearedSubclassCount} subclass selection${clearedSubclassCount === 1 ? '' : 's'} cleared` : null,
    removedSelectionCount > 0 ? `${removedSelectionCount} class feature selection${removedSelectionCount === 1 ? '' : 's'} cleared` : null,
  ].filter(Boolean);

  return {
    payload: nextPayload,
    impactSummary: impactParts.length > 0 ? `Class changes applied: ${impactParts.join(' and ')}.` : null,
  };
}

export function getGrantTitle(grant: ChoiceGrant) {
  return `${grant.sourceName} level ${grant.atLevel}`;
}

export function getGrantSelectionCount(grant: ChoiceGrant) {
  return grant.count;
}

export function getSubclassUnlockLabel(classEntity: ContentEntity) {
  const level = getSubclassUnlockLevel(classEntity);
  return level == null ? null : `Subclass at level ${level}`;
}
