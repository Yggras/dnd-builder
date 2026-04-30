import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { getCompendiumEntryIdFromEntityId } from '@/features/compendium/utils/catalog';
import type { DetailRenderBlock } from '@/features/compendium/utils/detailBlocks';
import { parseInlineText, type InlineReference, type InlineTextToken } from '@/features/compendium/utils/inlineText';
import { SQLiteContentRepository } from '@/features/content/adapters/SQLiteContentRepository';
import { ContentService } from '@/features/content/services/ContentService';
import { queryKeys } from '@/shared/query/keys';
import type { ContentEntity } from '@/shared/types/domain';

export type InlineReferenceTargets = Record<string, string>;

export interface InlineReferenceContext {
  sourceCode?: string | null;
}

const contentService = new ContentService(new SQLiteContentRepository());

function collectTokenReferences(tokens: InlineTextToken[]) {
  return tokens.flatMap((token) => (token.reference ? [token.reference] : []));
}

function collectBlockReferences(block: DetailRenderBlock): InlineReference[] {
  switch (block.kind) {
    case 'paragraph':
      return collectTokenReferences(block.tokens);
    case 'fallbackText':
      return collectTokenReferences(parseInlineText(block.text));
    case 'list':
      return block.items.flatMap(collectTokenReferences);
    case 'table':
      return [
        ...block.headers.flatMap(collectTokenReferences),
        ...block.rows.flatMap((row) => row.flatMap(collectTokenReferences)),
      ];
    case 'heading':
      return [];
  }
}

function uniqueReferences(references: InlineReference[]) {
  return Array.from(new Map(references.map((reference) => [reference.key, reference])).values());
}

function sameSource(left: string | null | undefined, right: string | null | undefined) {
  return Boolean(left && right && left.toLowerCase() === right.toLowerCase());
}

function chooseEntity(reference: InlineReference, candidates: ContentEntity[], context: InlineReferenceContext | undefined) {
  const matchingTypeAndName = candidates.filter(
    (entity) => entity.entityType === reference.entityType && entity.name.toLowerCase() === reference.name.toLowerCase(),
  );

  if (reference.sourceCode) {
    const sourceMatches = matchingTypeAndName.filter((entity) => sameSource(entity.sourceCode, reference.sourceCode));
    return sourceMatches.length === 1 ? sourceMatches[0] : null;
  }

  if (context?.sourceCode) {
    const sourceMatches = matchingTypeAndName.filter((entity) => sameSource(entity.sourceCode, context.sourceCode));
    if (sourceMatches.length === 1) {
      return sourceMatches[0];
    }
  }

  const primaryMatches = matchingTypeAndName.filter((entity) => entity.isPrimary2024 && !entity.isLegacy);
  if (primaryMatches.length === 1) {
    return primaryMatches[0];
  }

  const selectableMatches = matchingTypeAndName.filter((entity) => entity.isSelectableInBuilder && !entity.isLegacy);
  if (selectableMatches.length === 1) {
    return selectableMatches[0];
  }

  return matchingTypeAndName.length === 1 ? matchingTypeAndName[0] : null;
}

function buildReferenceTargets(references: InlineReference[], entities: ContentEntity[], context: InlineReferenceContext | undefined) {
  return references.reduce<InlineReferenceTargets>((targets, reference) => {
    const entity = chooseEntity(reference, entities, context);
    if (entity) {
      targets[reference.key] = getCompendiumEntryIdFromEntityId(entity.id);
    }

    return targets;
  }, {});
}

function useResolvedInlineReferences(references: InlineReference[], context?: InlineReferenceContext) {
  const referencesKey = references.map((reference) => reference.key).sort().join('|');
  const referencesQuery = useQuery({
    queryKey: queryKeys.compendiumInlineReferences(referencesKey, context?.sourceCode ?? ''),
    queryFn: () => contentService.getContentEntitiesByReferences(references.map((reference) => ({
      entityType: reference.entityType,
      name: reference.name,
    }))),
    enabled: references.length > 0,
  });

  return useMemo(
    () => buildReferenceTargets(references, referencesQuery.data ?? [], context),
    [context, references, referencesQuery.data],
  );
}

export function useInlineReferenceTargets(blocks: DetailRenderBlock[], context?: InlineReferenceContext) {
  const references = useMemo(() => uniqueReferences(blocks.flatMap(collectBlockReferences)), [blocks]);
  return useResolvedInlineReferences(references, context);
}

export function useInlineTokenReferenceTargets(tokenLines: InlineTextToken[][], context?: InlineReferenceContext) {
  const references = useMemo(() => uniqueReferences(tokenLines.flatMap(collectTokenReferences)), [tokenLines]);
  return useResolvedInlineReferences(references, context);
}
