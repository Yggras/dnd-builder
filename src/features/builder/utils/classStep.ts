import type {
  BuilderClassAsiFeatChoiceSelection,
  BuilderClassSkillProficiencySelection,
  BuilderDraftPayload,
  BuilderFeatureChoiceSelection,
  BuilderIssue,
} from '@/features/builder/types';
import { sortBuilderIssues } from '@/features/builder/utils/review';
import type { ChoiceGrant, ContentEntity } from '@/shared/types/domain';

interface ReconcileClassStepOptions {
  payload: BuilderDraftPayload;
  classEntitiesById: Record<string, ContentEntity>;
  grantsByClassId: Record<string, ChoiceGrant[]>;
  grantOptionsByGrantId: Record<string, ContentEntity[]>;
  asiFeatOptionsById?: Record<string, ContentEntity>;
}

interface ReconcileClassStepResult {
  payload: BuilderDraftPayload;
  impactSummary: string | null;
}

type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export interface ClassSkillProficiencyRequirement {
  id: string;
  classAllocationId: string;
  classId: string;
  className: string;
  level: number;
  count: number;
  options: string[];
}

export interface ClassAsiFeatRequirement {
  id: string;
  classAllocationId: string;
  classId: string;
  className: string;
  level: number;
}

export interface ClassFeatureRequirements {
  skillProficiencies: ClassSkillProficiencyRequirement[];
  asiFeatChoices: ClassAsiFeatRequirement[];
}

const SKILL_LABELS: Record<string, string> = {
  acrobatics: 'Acrobatics',
  animalHandling: 'Animal Handling',
  arcana: 'Arcana',
  athletics: 'Athletics',
  deception: 'Deception',
  history: 'History',
  insight: 'Insight',
  intimidation: 'Intimidation',
  investigation: 'Investigation',
  medicine: 'Medicine',
  nature: 'Nature',
  perception: 'Perception',
  performance: 'Performance',
  persuasion: 'Persuasion',
  religion: 'Religion',
  sleightOfHand: 'Sleight of Hand',
  stealth: 'Stealth',
  survival: 'Survival',
};

export function formatSkillLabel(skill: string) {
  return SKILL_LABELS[skill] ?? skill.replace(/([A-Z])/g, ' $1').replace(/[-_]/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

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

function getClassFeatureRef(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }

  if (value && typeof value === 'object') {
    const classFeature = (value as { classFeature?: unknown }).classFeature;
    return typeof classFeature === 'string' ? classFeature : null;
  }

  return null;
}

function parseFeatureLevel(featureRef: string) {
  const levelToken = featureRef.split('|').at(-1);
  const parsedLevel = levelToken ? Number.parseInt(levelToken, 10) : Number.NaN;
  return Number.isFinite(parsedLevel) ? parsedLevel : null;
}

function getStartingSkillRequirements(
  allocation: BuilderDraftPayload['classStep']['allocations'][number],
  classEntity: ContentEntity,
) {
  const startingProficiencies = classEntity.metadata.startingProficiencies;
  const skills = startingProficiencies && typeof startingProficiencies === 'object'
    ? (startingProficiencies as { skills?: unknown }).skills
    : null;

  if (!Array.isArray(skills)) {
    return [] as ClassSkillProficiencyRequirement[];
  }

  return skills.flatMap((entry, index): ClassSkillProficiencyRequirement[] => {
    if (!entry || typeof entry !== 'object') {
      return [];
    }

    const choose = (entry as { choose?: unknown }).choose;
    if (!choose || typeof choose !== 'object') {
      return [];
    }

    const options = Array.isArray((choose as { from?: unknown }).from)
      ? (choose as { from: unknown[] }).from.filter((skill): skill is string => typeof skill === 'string' && skill.length > 0)
      : [];
    const count = typeof (choose as { count?: unknown }).count === 'number' ? (choose as { count: number }).count : 1;

    if (options.length === 0 || count <= 0) {
      return [];
    }

    return [{
      id: `${allocation.id}:skill-proficiency:${index}`,
      classAllocationId: allocation.id,
      classId: allocation.classId,
      className: classEntity.name,
      level: 1,
      count,
      options,
    }];
  });
}

function getAsiFeatRequirements(
  allocation: BuilderDraftPayload['classStep']['allocations'][number],
  classEntity: ContentEntity,
) {
  const classFeatures = classEntity.metadata.classFeatures;

  if (!Array.isArray(classFeatures)) {
    return [] as ClassAsiFeatRequirement[];
  }

  return classFeatures.flatMap((feature, index): ClassAsiFeatRequirement[] => {
    const featureRef = getClassFeatureRef(feature);
    if (!featureRef?.startsWith('Ability Score Improvement|')) {
      return [];
    }

    const level = parseFeatureLevel(featureRef);
    if (level == null || level > allocation.level) {
      return [];
    }

    return [{
      id: `${allocation.id}:asi-feat:${level}:${index}`,
      classAllocationId: allocation.id,
      classId: allocation.classId,
      className: classEntity.name,
      level,
    }];
  });
}

export function deriveClassFeatureRequirements(
  payload: BuilderDraftPayload,
  classEntitiesById: Record<string, ContentEntity>,
): ClassFeatureRequirements {
  const skillProficiencies: ClassSkillProficiencyRequirement[] = [];
  const asiFeatChoices: ClassAsiFeatRequirement[] = [];

  for (const allocation of payload.classStep.allocations) {
    const classEntity = classEntitiesById[allocation.classId];
    if (!classEntity) {
      continue;
    }

    skillProficiencies.push(...getStartingSkillRequirements(allocation, classEntity));
    asiFeatChoices.push(...getAsiFeatRequirements(allocation, classEntity));
  }

  return {
    skillProficiencies,
    asiFeatChoices,
  };
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

    const parsedLevel = parseFeatureLevel(maybeSubclassFeature.classFeature) ?? Number.NaN;

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

function sanitizeSkillProficiencySelections(
  selections: BuilderClassSkillProficiencySelection[],
  requirements: ClassSkillProficiencyRequirement[],
) {
  const requirementsById = Object.fromEntries(requirements.map((requirement) => [requirement.id, requirement]));
  let removedSelectionCount = 0;

  const sanitizedSelections = selections.flatMap((selection): BuilderClassSkillProficiencySelection[] => {
    const requirement = requirementsById[selection.requirementId];
    if (!requirement || selection.classAllocationId !== requirement.classAllocationId || selection.classId !== requirement.classId) {
      removedSelectionCount += selection.selectedSkills.length || 1;
      return [];
    }

    const validOptions = new Set(requirement.options);
    const selectedSkills = Array.from(new Set(selection.selectedSkills.filter((skill) => validOptions.has(skill)))).slice(
      0,
      requirement.count,
    );

    removedSelectionCount += selection.selectedSkills.length - selectedSkills.length;

    return selectedSkills.length > 0
      ? [{ ...selection, selectedSkills }]
      : [];
  });

  return {
    sanitizedSelections,
    removedSelectionCount,
  };
}

function sanitizeAsiFeatChoiceSelections(
  selections: BuilderClassAsiFeatChoiceSelection[],
  requirements: ClassAsiFeatRequirement[],
  asiFeatOptionsById: Record<string, ContentEntity>,
) {
  const requirementsById = Object.fromEntries(requirements.map((requirement) => [requirement.id, requirement]));
  let removedSelectionCount = 0;

  const sanitizedSelections = selections.flatMap((selection): BuilderClassAsiFeatChoiceSelection[] => {
    const requirement = requirementsById[selection.requirementId];
    if (!requirement || selection.classAllocationId !== requirement.classAllocationId || selection.classId !== requirement.classId) {
      removedSelectionCount += selection.mode || selection.selectedFeatId ? 1 : 0;
      return [];
    }

    if (selection.mode !== 'asi' && selection.mode !== 'feat') {
      return [];
    }

    const selectedFeatId = selection.mode === 'feat' && selection.selectedFeatId && asiFeatOptionsById[selection.selectedFeatId]
      ? selection.selectedFeatId
      : null;

    if (selection.mode === 'feat' && selection.selectedFeatId && !selectedFeatId) {
      removedSelectionCount += 1;
    }

    return [{
      ...selection,
      selectedFeatId,
    }];
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
  return sortBuilderIssues([...preservedIssues, ...nextIssues]);
}

export function reconcileClassStepPayload({
  payload,
  classEntitiesById,
  grantsByClassId,
  grantOptionsByGrantId,
  asiFeatOptionsById = {},
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
      featureChoices: Array.isArray(payload.classStep.featureChoices) ? payload.classStep.featureChoices : [],
      skillProficiencies: Array.isArray(payload.classStep.skillProficiencies) ? payload.classStep.skillProficiencies : [],
      asiFeatChoices: Array.isArray(payload.classStep.asiFeatChoices) ? payload.classStep.asiFeatChoices : [],
    },
  };

  const issues: BuilderIssue[] = [];
  const totalLevel = nextPayload.classStep.allocations.reduce((sum, allocation) => sum + allocation.level, 0);
  const duplicateClassIds = new Set<string>();
  const seenClassIds = new Set<string>();
  const applicableGrants = getApplicableGrants(nextPayload, grantsByClassId);
  const classFeatureRequirements = deriveClassFeatureRequirements(nextPayload, classEntitiesById);
  const { sanitizedSelections, removedSelectionCount } = sanitizeFeatureChoices(
    nextPayload.classStep.featureChoices,
    applicableGrants,
    grantOptionsByGrantId,
  );
  const { sanitizedSelections: sanitizedSkillSelections, removedSelectionCount: removedSkillSelectionCount } = sanitizeSkillProficiencySelections(
    nextPayload.classStep.skillProficiencies,
    classFeatureRequirements.skillProficiencies,
  );
  const { sanitizedSelections: sanitizedAsiFeatSelections, removedSelectionCount: removedAsiFeatSelectionCount } = sanitizeAsiFeatChoiceSelections(
    nextPayload.classStep.asiFeatChoices,
    classFeatureRequirements.asiFeatChoices,
    asiFeatOptionsById,
  );

  nextPayload.classStep.featureChoices = sanitizedSelections;
  nextPayload.classStep.skillProficiencies = sanitizedSkillSelections;
  nextPayload.classStep.asiFeatChoices = sanitizedAsiFeatSelections;

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

  for (const requirement of classFeatureRequirements.skillProficiencies) {
    const selectedSkills = sanitizedSkillSelections.find((selection) => selection.requirementId === requirement.id)?.selectedSkills ?? [];

    if (selectedSkills.length < requirement.count) {
      issues.push({
        id: `class-skill-proficiency-${requirement.id}`,
        category: 'checklist',
        step: 'class',
        summary: `${requirement.className} needs ${requirement.count} skill proficienc${requirement.count === 1 ? 'y' : 'ies'}.`,
        detail: `Choose ${requirement.count} skill${requirement.count === 1 ? '' : 's'} from ${requirement.options.map(formatSkillLabel).join(', ')}.`,
        affectsCompletion: true,
        resolvedByOverride: false,
      });
    }
  }

  for (const requirement of classFeatureRequirements.asiFeatChoices) {
    const selection = sanitizedAsiFeatSelections.find((candidate) => candidate.requirementId === requirement.id);

    if (!selection?.mode) {
      issues.push({
        id: `class-asi-feat-mode-${requirement.id}`,
        category: 'checklist',
        step: 'class',
        summary: `${requirement.className} level ${requirement.level} needs an ASI or feat choice.`,
        detail: 'Choose whether this Ability Score Improvement grants ability points or a feat.',
        affectsCompletion: true,
        resolvedByOverride: false,
      });
      continue;
    }

    if (selection.mode === 'feat' && !selection.selectedFeatId) {
      issues.push({
        id: `class-asi-feat-selection-${requirement.id}`,
        category: 'checklist',
        step: 'class',
        summary: `${requirement.className} level ${requirement.level} needs a feat selected.`,
        detail: 'Choose one eligible General feat for this Ability Score Improvement feature.',
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
    removedSkillSelectionCount > 0 ? `${removedSkillSelectionCount} skill selection${removedSkillSelectionCount === 1 ? '' : 's'} cleared` : null,
    removedAsiFeatSelectionCount > 0 ? `${removedAsiFeatSelectionCount} ASI/feat selection${removedAsiFeatSelectionCount === 1 ? '' : 's'} cleared` : null,
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
