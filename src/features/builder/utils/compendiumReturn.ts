import type { BuilderWizardPhaseId } from '@/features/builder/hooks/useBuilderController';

export type BuilderCompendiumReturnSheet = 'class' | 'subclass' | 'feature' | 'asi-feat' | 'spell';

export interface BuilderCompendiumReturnContext {
  characterId: string;
  phaseId: BuilderWizardPhaseId;
  sheet: BuilderCompendiumReturnSheet;
  classId?: string;
  allocationId?: string;
  subclassId?: string;
  grantId?: string;
  optionId?: string;
  requirementId?: string;
  featId?: string;
  spellId?: string;
}

type RouteParams = Record<string, string>;

function encodeQueryParams(params: RouteParams) {
  const query = new URLSearchParams(params);
  const serialized = query.toString();
  return serialized.length > 0 ? `?${serialized}` : '';
}

export function buildCompendiumReturnQuery(context: BuilderCompendiumReturnContext) {
  const params: RouteParams = {
    builderReturn: '1',
    builderCharacterId: context.characterId,
    builderPhaseId: context.phaseId,
    builderSheet: context.sheet,
  };

  if (context.classId) params.builderClassId = context.classId;
  if (context.allocationId) params.builderAllocationId = context.allocationId;
  if (context.subclassId) params.builderSubclassId = context.subclassId;
  if (context.grantId) params.builderGrantId = context.grantId;
  if (context.optionId) params.builderOptionId = context.optionId;
  if (context.requirementId) params.builderRequirementId = context.requirementId;
  if (context.featId) params.builderFeatId = context.featId;
  if (context.spellId) params.builderSpellId = context.spellId;

  return encodeQueryParams(params);
}

export function buildBuilderReturnRoute(context: BuilderCompendiumReturnContext) {
  return `/(app)/characters/${encodeURIComponent(context.characterId)}/builder${encodeQueryParams({
    builderReturn: '1',
    builderCharacterId: context.characterId,
    builderPhaseId: context.phaseId,
    builderSheet: context.sheet,
    ...(context.classId ? { builderClassId: context.classId } : {}),
    ...(context.allocationId ? { builderAllocationId: context.allocationId } : {}),
    ...(context.subclassId ? { builderSubclassId: context.subclassId } : {}),
    ...(context.grantId ? { builderGrantId: context.grantId } : {}),
    ...(context.optionId ? { builderOptionId: context.optionId } : {}),
    ...(context.requirementId ? { builderRequirementId: context.requirementId } : {}),
    ...(context.featId ? { builderFeatId: context.featId } : {}),
    ...(context.spellId ? { builderSpellId: context.spellId } : {}),
  })}`;
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseBuilderCompendiumReturnContext(
  params: Record<string, string | string[] | undefined>,
): BuilderCompendiumReturnContext | null {
  if (getSingleParam(params.builderReturn) !== '1') {
    return null;
  }

  const characterId = getSingleParam(params.builderCharacterId) ?? '';
  const phaseId = getSingleParam(params.builderPhaseId) as BuilderWizardPhaseId | undefined;
  const sheet = getSingleParam(params.builderSheet) as BuilderCompendiumReturnSheet | undefined;

  if (!characterId || !phaseId || !sheet) {
    return null;
  }

  return {
    characterId,
    phaseId,
    sheet,
    classId: getSingleParam(params.builderClassId),
    allocationId: getSingleParam(params.builderAllocationId),
    subclassId: getSingleParam(params.builderSubclassId),
    grantId: getSingleParam(params.builderGrantId),
    optionId: getSingleParam(params.builderOptionId),
    requirementId: getSingleParam(params.builderRequirementId),
    featId: getSingleParam(params.builderFeatId),
    spellId: getSingleParam(params.builderSpellId),
  };
}
