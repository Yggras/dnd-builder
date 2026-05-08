import type { BuilderDraftPayload, BuilderIssue, BuilderSourceSummary, BuilderSpellSelection } from '@/features/builder/types';
import { sortBuilderIssues } from '@/features/builder/utils/review';
import type { ContentEntity } from '@/shared/types/domain';

export type SpellWorkflowType = 'none' | 'known' | 'prepared' | 'known-prepared' | 'unsupported';

export interface SpellcastingSourceSummary {
  allocationId: string;
  classId: string;
  className: string;
  subclassId: string | null;
  spellcastingAbility: string | null;
  workflow: SpellWorkflowType;
  cantripLimit: number;
  knownSpellLimit: number;
  preparedSpellLimit: number;
  maxSpellLevel: number;
  applicableSpellIds: string[];
  usesKnownSpells: boolean;
  usesPreparedSpells: boolean;
}

interface SpellcastingSummary {
  isCaster: boolean;
  workflow: SpellWorkflowType;
  cantripLimit: number;
  knownSpellLimit: number;
  preparedSpellLimit: number;
  maxSpellLevel: number;
  applicableSpellIds: string[];
  sources: SpellcastingSourceSummary[];
  usesKnownSpells: boolean;
  usesPreparedSpells: boolean;
  issues: BuilderIssue[];
}

const FULL_CASTER_MAX_LEVEL_BY_EFFECTIVE_LEVEL = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9];
const PACT_MAX_LEVEL_BY_CLASS_LEVEL = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];

interface SpellcastingProfile {
  spellcastingAbility: string | null;
  casterProgression: string | null;
  cantripProgression: number[];
  preparedSpellsProgression: number[];
  spellsKnownProgression: number[];
}

function getNumberProgression(progression: unknown) {
  if (!Array.isArray(progression)) {
    return [] as number[];
  }

  return progression.map((value) => (typeof value === 'number' ? value : 0));
}

function getProgressionValue(progression: readonly number[], level: number) {
  if (!Array.isArray(progression) || level < 1) {
    return 0;
  }

  return typeof progression[level - 1] === 'number' ? progression[level - 1] : 0;
}

function hasProgressionValues(progression: readonly number[]) {
  return progression.some((value) => value > 0);
}

function hasSpellcastingProfile(profile: SpellcastingProfile) {
  return Boolean(profile.spellcastingAbility) || Boolean(profile.casterProgression) || profile.cantripProgression.length > 0;
}

function mergeSpellcastingProfiles(baseProfile: SpellcastingProfile, overrideProfile: SpellcastingProfile): SpellcastingProfile {
  return {
    spellcastingAbility: overrideProfile.spellcastingAbility ?? baseProfile.spellcastingAbility,
    casterProgression: overrideProfile.casterProgression ?? baseProfile.casterProgression,
    cantripProgression:
      overrideProfile.cantripProgression.length > 0 ? overrideProfile.cantripProgression : baseProfile.cantripProgression,
    preparedSpellsProgression:
      overrideProfile.preparedSpellsProgression.length > 0
        ? overrideProfile.preparedSpellsProgression
        : baseProfile.preparedSpellsProgression,
    spellsKnownProgression:
      overrideProfile.spellsKnownProgression.length > 0
        ? overrideProfile.spellsKnownProgression
        : baseProfile.spellsKnownProgression,
  };
}

function createSpellcastingProfile(entity?: ContentEntity | null): SpellcastingProfile {
  return {
    spellcastingAbility: typeof entity?.metadata.spellcastingAbility === 'string' ? entity.metadata.spellcastingAbility : null,
    casterProgression: typeof entity?.metadata.casterProgression === 'string' ? entity.metadata.casterProgression : null,
    cantripProgression: getNumberProgression(entity?.metadata.cantripProgression),
    preparedSpellsProgression: getNumberProgression(entity?.metadata.preparedSpellsProgression),
    spellsKnownProgression: getNumberProgression(entity?.metadata.spellsKnownProgression),
  };
}

function getAllocationSpellcastingProfile(
  allocation: BuilderDraftPayload['classStep']['allocations'][number],
  classEntitiesById: Record<string, ContentEntity>,
  subclassEntitiesById: Record<string, ContentEntity>,
) {
  const classProfile = createSpellcastingProfile(classEntitiesById[allocation.classId]);
  const subclassProfile = createSpellcastingProfile(
    allocation.subclassId ? subclassEntitiesById[allocation.subclassId] : null,
  );

  return hasSpellcastingProfile(subclassProfile)
    ? mergeSpellcastingProfiles(classProfile, subclassProfile)
    : classProfile;
}

function getAllocationMaxSpellLevel(allocation: BuilderDraftPayload['classStep']['allocations'][number], profile: SpellcastingProfile) {
  if (profile.casterProgression === 'pact') {
    return PACT_MAX_LEVEL_BY_CLASS_LEVEL[allocation.level] ?? 0;
  }

  let effectiveLevel = 0;
  if (profile.casterProgression === 'full') {
    effectiveLevel = allocation.level;
  } else if (profile.casterProgression === 'artificer') {
    effectiveLevel = Math.ceil(allocation.level / 2);
  } else if (profile.casterProgression === 'half' || profile.casterProgression === '1/2') {
    effectiveLevel = Math.floor(allocation.level / 2);
  } else if (profile.casterProgression === '1/3') {
    effectiveLevel = Math.floor(allocation.level / 3);
  }

  return FULL_CASTER_MAX_LEVEL_BY_EFFECTIVE_LEVEL[Math.min(effectiveLevel, 20)] ?? 0;
}

function getWorkflowForProfile(profile: SpellcastingProfile): SpellWorkflowType {
  const hasKnownWorkflow = hasProgressionValues(profile.spellsKnownProgression);
  const hasPreparedWorkflow = hasProgressionValues(profile.preparedSpellsProgression);
  const hasCantripWorkflow = hasProgressionValues(profile.cantripProgression);

  return hasKnownWorkflow && hasPreparedWorkflow
    ? 'known-prepared'
    : hasKnownWorkflow
      ? 'known'
      : hasPreparedWorkflow
        ? 'prepared'
        : hasCantripWorkflow
          ? 'known'
          : 'unsupported';
}

function getSpellSourceMatches(spell: ContentEntity, classId: string, subclassId: string | null) {
  const spellClassIds = Array.isArray(spell.metadata.classIds) ? spell.metadata.classIds : [];
  const spellSubclassIds = Array.isArray(spell.metadata.subclassIds) ? spell.metadata.subclassIds : [];
  return spellClassIds.includes(classId) || Boolean(subclassId && spellSubclassIds.includes(subclassId));
}

function createSourceSummaries(
  payload: BuilderDraftPayload,
  classEntitiesById: Record<string, ContentEntity>,
  subclassEntitiesById: Record<string, ContentEntity>,
  spellEntitiesById: Record<string, ContentEntity>,
) {
  return payload.classStep.allocations.flatMap((allocation): SpellcastingSourceSummary[] => {
    const profile = getAllocationSpellcastingProfile(allocation, classEntitiesById, subclassEntitiesById);

    if (!hasSpellcastingProfile(profile)) {
      return [];
    }

    const workflow = getWorkflowForProfile(profile);
    const applicableSpellIds = Object.values(spellEntitiesById)
      .filter((spell) => getSpellSourceMatches(spell, allocation.classId, allocation.subclassId))
      .map((spell) => spell.id);

    return [{
      allocationId: allocation.id,
      classId: allocation.classId,
      className: classEntitiesById[allocation.classId]?.name ?? 'Class',
      subclassId: allocation.subclassId,
      spellcastingAbility: profile.spellcastingAbility,
      workflow,
      cantripLimit: getProgressionValue(profile.cantripProgression, allocation.level),
      knownSpellLimit: getProgressionValue(profile.spellsKnownProgression, allocation.level),
      preparedSpellLimit: getProgressionValue(profile.preparedSpellsProgression, allocation.level),
      maxSpellLevel: getAllocationMaxSpellLevel(allocation, profile),
      applicableSpellIds,
      usesKnownSpells: hasProgressionValues(profile.spellsKnownProgression),
      usesPreparedSpells: hasProgressionValues(profile.preparedSpellsProgression),
    }];
  });
}

function getSelectionKey(selection: Pick<BuilderSpellSelection, 'spellId' | 'classAllocationId' | 'selectionType'>) {
  return `${selection.classAllocationId}:${selection.spellId}:${selection.selectionType}`;
}

export function reconcileSpellSelectionPayload(
  payload: BuilderDraftPayload,
  classEntitiesById: Record<string, ContentEntity>,
  subclassEntitiesById: Record<string, ContentEntity>,
  spellEntitiesById: Record<string, ContentEntity>,
) {
  const sources = createSourceSummaries(payload, classEntitiesById, subclassEntitiesById, spellEntitiesById);
  const sourcesByAllocationId = Object.fromEntries(sources.map((source) => [source.allocationId, source]));
  const currentSelections = Array.isArray(payload.spellsStep.selections) ? payload.spellsStep.selections : [];
  const retainedSelections: BuilderSpellSelection[] = [];
  const retainedKeys = new Set<string>();

  for (const selection of currentSelections) {
    const source = sourcesByAllocationId[selection.classAllocationId];
    const spell = spellEntitiesById[selection.spellId];
    const spellLevel = Number(spell?.metadata.level ?? -1);

    if (!source || !spell || source.classId !== selection.classId || source.subclassId !== selection.subclassId) {
      continue;
    }

    if (!source.applicableSpellIds.includes(selection.spellId) || spellLevel > source.maxSpellLevel) {
      continue;
    }

    if (selection.selectionType === 'cantrip' && spellLevel !== 0) {
      continue;
    }

    if ((selection.selectionType === 'known' || selection.selectionType === 'prepared') && spellLevel <= 0) {
      continue;
    }

    if (selection.selectionType === 'known' && !source.usesKnownSpells) {
      continue;
    }

    if (selection.selectionType === 'prepared' && !source.usesPreparedSpells) {
      continue;
    }

    const key = getSelectionKey(selection);
    if (retainedKeys.has(key)) {
      continue;
    }

    retainedKeys.add(key);
    retainedSelections.push(selection);
  }

  const knownKeys = new Set(
    retainedSelections
      .filter((selection) => selection.selectionType === 'known')
      .map((selection) => `${selection.classAllocationId}:${selection.spellId}`),
  );
  const selections = retainedSelections.filter((selection) => {
    const source = sourcesByAllocationId[selection.classAllocationId];
    if (selection.selectionType !== 'prepared' || source?.workflow !== 'known-prepared') {
      return true;
    }

    return knownKeys.has(`${selection.classAllocationId}:${selection.spellId}`);
  });

  if (JSON.stringify(selections) === JSON.stringify(currentSelections)) {
    return payload;
  }

  return {
    ...payload,
    spellsStep: {
      ...payload.spellsStep,
      selections,
    },
  };
}

export function summarizeSpellcasting(
  payload: BuilderDraftPayload,
  classEntitiesById: Record<string, ContentEntity>,
  subclassEntitiesById: Record<string, ContentEntity>,
  spellEntitiesById: Record<string, ContentEntity>,
): SpellcastingSummary {
  const issues: BuilderIssue[] = [];
  const hasSpellOverride = payload.spellsStep.manualExceptionNotes.length > 0;
  const sources = createSourceSummaries(payload, classEntitiesById, subclassEntitiesById, spellEntitiesById);
  const sourcesByAllocationId = Object.fromEntries(sources.map((source) => [source.allocationId, source]));
  const spellSelections = Array.isArray(payload.spellsStep.selections) ? payload.spellsStep.selections : [];
  const isCaster = sources.length > 0;

  if (!isCaster) {
    return {
      isCaster: false,
      workflow: 'none',
      cantripLimit: 0,
      knownSpellLimit: 0,
      preparedSpellLimit: 0,
      maxSpellLevel: 0,
      applicableSpellIds: [] as string[],
      sources: [],
      usesKnownSpells: false,
      usesPreparedSpells: false,
      issues,
    };
  }

  const cantripLimit = sources.reduce((sum, source) => sum + source.cantripLimit, 0);
  const knownSpellLimit = sources.reduce((sum, source) => sum + source.knownSpellLimit, 0);
  const preparedSpellLimit = sources.reduce((sum, source) => sum + source.preparedSpellLimit, 0);
  const maxSpellLevel = Math.max(...sources.map((source) => source.maxSpellLevel));
  const usesKnownSpells = sources.some((source) => source.usesKnownSpells);
  const usesPreparedSpells = sources.some((source) => source.usesPreparedSpells);
  const hasKnownWorkflow = sources.some((source) => source.workflow === 'known' || source.workflow === 'known-prepared');
  const hasPreparedWorkflow = sources.some((source) => source.workflow === 'prepared' || source.workflow === 'known-prepared');
  const hasCantripWorkflow = sources.some((source) => source.cantripLimit > 0);
  const workflow: SpellWorkflowType = hasKnownWorkflow && hasPreparedWorkflow
    ? 'known-prepared'
    : hasKnownWorkflow
      ? 'known'
      : hasPreparedWorkflow
        ? 'prepared'
        : hasCantripWorkflow
          ? 'known'
          : 'unsupported';

  const applicableSpellIds = Array.from(new Set(sources.flatMap((source) => source.applicableSpellIds)));
  const selectedCantrips = spellSelections.filter((selection) => selection.selectionType === 'cantrip');
  const selectedLeveledSpells = spellSelections.filter((selection) => selection.selectionType === 'known');
  const preparedLeveledSpells = spellSelections.filter((selection) => selection.selectionType === 'prepared');
  for (const source of sources) {
    const sourceCantrips = selectedCantrips.filter((selection) => selection.classAllocationId === source.allocationId);
    const sourceKnown = selectedLeveledSpells.filter((selection) => selection.classAllocationId === source.allocationId);
    const sourcePrepared = preparedLeveledSpells.filter((selection) => selection.classAllocationId === source.allocationId);

    if (sourceCantrips.length > source.cantripLimit) {
      issues.push({
        id: `spell-cantrip-overfill-${source.allocationId}`,
        category: 'blocker',
        step: 'spells',
        summary: `${source.className} has too many cantrips selected.`,
        detail: `Reduce ${source.className} cantrips to ${source.cantripLimit} or fewer.`,
        affectsCompletion: true,
        resolvedByOverride: hasSpellOverride,
      });
    }

    if (source.usesKnownSpells && sourceKnown.length > source.knownSpellLimit) {
      issues.push({
        id: `spell-known-overfill-${source.allocationId}`,
        category: 'blocker',
        step: 'spells',
        summary: `${source.className} has too many known leveled spells selected.`,
        detail: `Reduce ${source.className} known leveled spells to ${source.knownSpellLimit} or fewer.`,
        affectsCompletion: true,
        resolvedByOverride: hasSpellOverride,
      });
    }

    if (source.usesPreparedSpells && sourcePrepared.length > source.preparedSpellLimit) {
      issues.push({
        id: `spell-prepared-overfill-${source.allocationId}`,
        category: 'blocker',
        step: 'spells',
        summary: `${source.className} has too many prepared spells selected.`,
        detail: `Reduce ${source.className} prepared spells to ${source.preparedSpellLimit} or fewer.`,
        affectsCompletion: true,
        resolvedByOverride: hasSpellOverride,
      });
    }
  }

  const tooHighLevelSpell = [...selectedLeveledSpells, ...preparedLeveledSpells].find((selection) => {
    const source = sourcesByAllocationId[selection.classAllocationId];
    return Number(spellEntitiesById[selection.spellId]?.metadata.level ?? 99) > (source?.maxSpellLevel ?? -1);
  });

  if (tooHighLevelSpell) {
    issues.push({
      id: 'spell-max-level',
      category: 'blocker',
      step: 'spells',
      summary: 'A selected spell exceeds the current spell level allowance.',
      detail: 'Remove any spell whose level is higher than the current class spellcasting progression allows.',
      affectsCompletion: true,
      resolvedByOverride: hasSpellOverride,
    });
  }

  if (usesPreparedSpells && preparedLeveledSpells.some((selection) => {
    const source = sourcesByAllocationId[selection.classAllocationId];
    return source?.workflow === 'known-prepared' && !selectedLeveledSpells.some(
      (knownSelection) => knownSelection.classAllocationId === selection.classAllocationId && knownSelection.spellId === selection.spellId,
    );
  })) {
    issues.push({
      id: 'spell-prepared-not-known',
      category: 'checklist',
      step: 'spells',
      summary: 'A prepared spell is not currently tracked in known selections.',
      detail: 'Prepare only spells that are currently tracked in the spell selection list.',
      affectsCompletion: true,
      resolvedByOverride: hasSpellOverride,
    });
  }

  if (spellSelections.some((selection) => {
    const source = sourcesByAllocationId[selection.classAllocationId];
    return !source || !source.applicableSpellIds.includes(selection.spellId);
  })) {
    issues.push({
      id: 'spell-invalid-selection',
      category: 'checklist',
      step: 'spells',
      summary: 'Some selected spells no longer match the current class or subclass spell lists.',
      detail: 'Review spell selections after class or subclass changes.',
      affectsCompletion: true,
      resolvedByOverride: hasSpellOverride,
    });
  }

  if (hasSpellOverride) {
    issues.push({
      id: 'spell-manual-overrides',
      category: 'override',
      step: 'spells',
      summary: 'Manual spell overrides are active.',
      detail: payload.spellsStep.manualExceptionNotes.join(' | '),
      affectsCompletion: false,
      resolvedByOverride: true,
    });
  }

  return {
    isCaster,
    workflow,
    cantripLimit,
    knownSpellLimit,
    preparedSpellLimit,
    maxSpellLevel,
    applicableSpellIds,
    sources,
    usesKnownSpells,
    usesPreparedSpells,
    issues,
  };
}

export function deriveSourceSummary(
  payload: BuilderDraftPayload,
  entitiesById: Record<string, ContentEntity>,
) {
  const referencedIds = [
    ...payload.classStep.allocations.flatMap((allocation) => [allocation.classId, allocation.subclassId]),
    payload.speciesStep.speciesId,
    payload.backgroundStep.backgroundId,
    ...payload.speciesStep.grantedFeatSelections.map((selection) => selection.selectedFeatId),
    ...payload.backgroundStep.grantedFeatSelections.map((selection) => selection.selectedFeatId),
    ...payload.classStep.featureChoices.flatMap((selection) => selection.selectedOptionIds),
    ...(Array.isArray(payload.spellsStep.selections) ? payload.spellsStep.selections.map((selection) => selection.spellId) : []),
    ...payload.inventoryStep.entries.map((entry) => entry.itemId),
  ].filter((value): value is string => typeof value === 'string' && value.length > 0);

  const records = referencedIds.map((id) => entitiesById[id]).filter(Boolean);
  const editionsUsed = Array.from(new Set(records.map((record) => record.rulesEdition))).sort() as BuilderSourceSummary['editionsUsed'];
  const sourceCodes = Array.from(new Set(records.map((record) => record.sourceCode))).sort();

  return {
    usesLegacyContent: records.some((record) => record.isLegacy),
    editionsUsed,
    sourceCodes,
  } satisfies BuilderSourceSummary;
}

export function mergeReviewIssues(payload: BuilderDraftPayload, nextIssues: BuilderIssue[]) {
  const preservedIssues = payload.review.issues.filter((issue) => !['spells', 'review'].includes(issue.step));
  return sortBuilderIssues([...preservedIssues, ...nextIssues]);
}
