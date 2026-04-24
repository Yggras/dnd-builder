import type { BuilderDraftPayload, BuilderIssue, BuilderSourceSummary } from '@/features/builder/types';
import type { ContentEntity } from '@/shared/types/domain';

interface SpellcastingSummary {
  isCaster: boolean;
  cantripLimit: number;
  spellLimit: number;
  maxSpellLevel: number;
  applicableSpellIds: string[];
  issues: BuilderIssue[];
}

const FULL_CASTER_MAX_LEVEL_BY_EFFECTIVE_LEVEL = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9];
const PACT_MAX_LEVEL_BY_CLASS_LEVEL = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];

function getProgressionValue(progression: unknown, level: number) {
  if (!Array.isArray(progression) || level < 1) {
    return 0;
  }

  return typeof progression[level - 1] === 'number' ? progression[level - 1] : 0;
}

function getEffectiveCasterLevel(payload: BuilderDraftPayload, classEntitiesById: Record<string, ContentEntity>) {
  let total = 0;

  for (const allocation of payload.classStep.allocations) {
    const classEntity = classEntitiesById[allocation.classId];
    const progression = classEntity?.metadata.casterProgression;

    if (progression === 'full') {
      total += allocation.level;
    } else if (progression === 'artificer') {
      total += Math.ceil(allocation.level / 2);
    } else if (progression === 'half') {
      total += Math.floor(allocation.level / 2);
    }
  }

  return Math.min(total, 20);
}

export function summarizeSpellcasting(
  payload: BuilderDraftPayload,
  classEntitiesById: Record<string, ContentEntity>,
  spellEntitiesById: Record<string, ContentEntity>,
): SpellcastingSummary {
  const issues: BuilderIssue[] = [];
  const hasSpellOverride = payload.spellsStep.manualExceptionNotes.length > 0;
  const classIds = payload.classStep.allocations.map((allocation) => allocation.classId).filter(Boolean);
  const subclassIds = payload.classStep.allocations.map((allocation) => allocation.subclassId).filter(Boolean);
  const casterAllocations = payload.classStep.allocations.filter((allocation) => {
    const classEntity = classEntitiesById[allocation.classId];
    return Boolean(classEntity?.metadata.spellcastingAbility);
  });
  const isCaster = casterAllocations.length > 0;

  if (!isCaster) {
    return {
      isCaster: false,
      cantripLimit: 0,
      spellLimit: 0,
      maxSpellLevel: 0,
      applicableSpellIds: [] as string[],
      issues,
    };
  }

  const cantripLimit = casterAllocations.reduce((sum, allocation) => {
    const classEntity = classEntitiesById[allocation.classId];
    return sum + getProgressionValue(classEntity?.metadata.cantripProgression, allocation.level);
  }, 0);
  const spellLimit = casterAllocations.reduce((sum, allocation) => {
    const classEntity = classEntitiesById[allocation.classId];
    return sum + getProgressionValue(classEntity?.metadata.preparedSpellsProgression, allocation.level);
  }, 0);
  const effectiveCasterLevel = getEffectiveCasterLevel(payload, classEntitiesById);
  const maxSpellLevel = Math.max(
    FULL_CASTER_MAX_LEVEL_BY_EFFECTIVE_LEVEL[effectiveCasterLevel] ?? 0,
    ...casterAllocations.map((allocation) => {
      const classEntity = classEntitiesById[allocation.classId];
      return classEntity?.metadata.casterProgression === 'pact' ? PACT_MAX_LEVEL_BY_CLASS_LEVEL[allocation.level] ?? 0 : 0;
    }),
  );

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

  if (selectedLeveledSpells.length > spellLimit) {
    issues.push({
      id: 'spell-level-overfill',
      category: 'blocker',
      step: 'spells',
      summary: 'Too many leveled spells are selected.',
      detail: `Reduce selected spells to ${spellLimit} or fewer.`,
      affectsCompletion: true,
      resolvedByOverride: hasSpellOverride,
    });
  }

  const tooHighLevelSpell = selectedLeveledSpells.find(
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
    spellLimit,
    maxSpellLevel,
    applicableSpellIds,
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
