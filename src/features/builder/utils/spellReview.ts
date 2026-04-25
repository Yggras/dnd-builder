import type { BuilderDraftPayload, BuilderIssue, BuilderSourceSummary } from '@/features/builder/types';
import type { ContentEntity } from '@/shared/types/domain';

interface SpellcastingSummary {
  isCaster: boolean;
  cantripLimit: number;
   knownSpellLimit: number;
   preparedSpellLimit: number;
  maxSpellLevel: number;
  applicableSpellIds: string[];
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

function hasSpellcastingProfile(profile: SpellcastingProfile) {
  return Boolean(profile.spellcastingAbility) || Boolean(profile.casterProgression) || profile.cantripProgression.length > 0;
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

  return hasSpellcastingProfile(subclassProfile) ? subclassProfile : classProfile;
}

function getEffectiveCasterLevel(
  payload: BuilderDraftPayload,
  classEntitiesById: Record<string, ContentEntity>,
  subclassEntitiesById: Record<string, ContentEntity>,
) {
  let total = 0;

  for (const allocation of payload.classStep.allocations) {
    const progression = getAllocationSpellcastingProfile(allocation, classEntitiesById, subclassEntitiesById).casterProgression;

    if (progression === 'full') {
      total += allocation.level;
    } else if (progression === 'artificer') {
      total += Math.ceil(allocation.level / 2);
    } else if (progression === 'half' || progression === '1/2') {
      total += Math.floor(allocation.level / 2);
    } else if (progression === '1/3') {
      total += Math.floor(allocation.level / 3);
    }
  }

  return Math.min(total, 20);
}

export function summarizeSpellcasting(
  payload: BuilderDraftPayload,
  classEntitiesById: Record<string, ContentEntity>,
  subclassEntitiesById: Record<string, ContentEntity>,
  spellEntitiesById: Record<string, ContentEntity>,
): SpellcastingSummary {
  const issues: BuilderIssue[] = [];
  const hasSpellOverride = payload.spellsStep.manualExceptionNotes.length > 0;
  const classIds = payload.classStep.allocations.map((allocation) => allocation.classId).filter(Boolean);
  const subclassIds = payload.classStep.allocations.map((allocation) => allocation.subclassId).filter(Boolean);
  const casterAllocations = payload.classStep.allocations.filter((allocation) => {
    const profile = getAllocationSpellcastingProfile(allocation, classEntitiesById, subclassEntitiesById);
    return hasSpellcastingProfile(profile);
  });
  const isCaster = casterAllocations.length > 0;

  if (!isCaster) {
    return {
      isCaster: false,
      cantripLimit: 0,
      knownSpellLimit: 0,
      preparedSpellLimit: 0,
      maxSpellLevel: 0,
      applicableSpellIds: [] as string[],
      usesKnownSpells: false,
      usesPreparedSpells: false,
      issues,
    };
  }

  const cantripLimit = casterAllocations.reduce((sum, allocation) => {
    const profile = getAllocationSpellcastingProfile(allocation, classEntitiesById, subclassEntitiesById);
    return sum + getProgressionValue(profile.cantripProgression, allocation.level);
  }, 0);
  const knownSpellLimit = casterAllocations.reduce((sum, allocation) => {
    const profile = getAllocationSpellcastingProfile(allocation, classEntitiesById, subclassEntitiesById);
    return sum + getProgressionValue(profile.spellsKnownProgression, allocation.level);
  }, 0);
  const preparedSpellLimit = casterAllocations.reduce((sum, allocation) => {
    const profile = getAllocationSpellcastingProfile(allocation, classEntitiesById, subclassEntitiesById);
    return sum + getProgressionValue(profile.preparedSpellsProgression, allocation.level);
  }, 0);
  const effectiveCasterLevel = getEffectiveCasterLevel(payload, classEntitiesById, subclassEntitiesById);
  const maxSpellLevel = Math.max(
    FULL_CASTER_MAX_LEVEL_BY_EFFECTIVE_LEVEL[effectiveCasterLevel] ?? 0,
    ...casterAllocations.map((allocation) => {
      const profile = getAllocationSpellcastingProfile(allocation, classEntitiesById, subclassEntitiesById);
      return profile.casterProgression === 'pact' ? PACT_MAX_LEVEL_BY_CLASS_LEVEL[allocation.level] ?? 0 : 0;
    }),
  );
  const usesKnownSpells = knownSpellLimit > 0;
  const usesPreparedSpells = preparedSpellLimit > 0;

  const applicableSpellIds = Object.values(spellEntitiesById)
    .filter((spell) => {
      const spellClassIds = Array.isArray(spell.metadata.classIds) ? spell.metadata.classIds : [];
      const spellSubclassIds = Array.isArray(spell.metadata.subclassIds) ? spell.metadata.subclassIds : [];
      return (
        classIds.some((classId) => spellClassIds.includes(classId)) ||
        subclassIds.some((subclassId) => spellSubclassIds.includes(subclassId))
      );
    })
    .map((spell) => spell.id);

  const selectedSpells = payload.spellsStep.selectedSpellIds.filter((spellId) => applicableSpellIds.includes(spellId));
  const selectedCantrips = selectedSpells.filter((spellId) => Number(spellEntitiesById[spellId]?.metadata.level ?? -1) === 0);
  const selectedLeveledSpells = selectedSpells.filter((spellId) => Number(spellEntitiesById[spellId]?.metadata.level ?? -1) > 0);
  const preparedSpells = payload.spellsStep.preparedSpellIds.filter((spellId) => applicableSpellIds.includes(spellId));
  const preparedLeveledSpells = preparedSpells.filter((spellId) => Number(spellEntitiesById[spellId]?.metadata.level ?? -1) > 0);
  const activeLeveledSpells = usesKnownSpells ? selectedLeveledSpells : preparedLeveledSpells;

  if (selectedCantrips.length > cantripLimit) {
    issues.push({
      id: 'spell-cantrip-overfill',
      category: 'blocker',
      step: 'spells',
      summary: 'Too many cantrips are selected.',
      detail: `Reduce selected cantrips to ${cantripLimit} or fewer.`,
      affectsCompletion: true,
      resolvedByOverride: hasSpellOverride,
    });
  }

  if (usesKnownSpells && selectedLeveledSpells.length > knownSpellLimit) {
    issues.push({
      id: 'spell-known-overfill',
      category: 'blocker',
      step: 'spells',
      summary: 'Too many known leveled spells are selected.',
      detail: `Reduce known leveled spells to ${knownSpellLimit} or fewer.`,
      affectsCompletion: true,
      resolvedByOverride: hasSpellOverride,
    });
  }

  if (usesPreparedSpells && preparedLeveledSpells.length > preparedSpellLimit) {
    issues.push({
      id: 'spell-prepared-overfill',
      category: 'blocker',
      step: 'spells',
      summary: 'Too many prepared spells are selected.',
      detail: `Reduce prepared spells to ${preparedSpellLimit} or fewer.`,
      affectsCompletion: true,
      resolvedByOverride: hasSpellOverride,
    });
  }

  const tooHighLevelSpell = activeLeveledSpells.find(
    (spellId) => Number(spellEntitiesById[spellId]?.metadata.level ?? 99) > maxSpellLevel,
  );

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

  if (usesPreparedSpells && preparedLeveledSpells.some((spellId) => !selectedLeveledSpells.includes(spellId))) {
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

  if (payload.spellsStep.selectedSpellIds.some((spellId) => !applicableSpellIds.includes(spellId))) {
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

  if (payload.spellsStep.preparedSpellIds.some((spellId) => !applicableSpellIds.includes(spellId))) {
    issues.push({
      id: 'spell-invalid-prepared-selection',
      category: 'checklist',
      step: 'spells',
      summary: 'Some prepared spells no longer match the current class or subclass spell lists.',
      detail: 'Review prepared spell selections after class or subclass changes.',
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
    cantripLimit,
    knownSpellLimit,
    preparedSpellLimit,
    maxSpellLevel,
    applicableSpellIds,
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
    ...payload.spellsStep.selectedSpellIds,
    ...payload.spellsStep.preparedSpellIds,
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
  return [...preservedIssues, ...nextIssues];
}
