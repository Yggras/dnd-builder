import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import { CompendiumDetailHeader } from '@/features/compendium/components/CompendiumDetailHeader';
import { DetailFactGrid } from '@/features/compendium/components/DetailFactGrid';
import { DetailSection } from '@/features/compendium/components/DetailSection';
import { RenderBlockList } from '@/features/compendium/components/RenderBlockList';
import { SQLiteContentRepository } from '@/features/content/adapters/SQLiteContentRepository';
import { ContentService } from '@/features/content/services/ContentService';
import { buildRenderBlocks, buildRenderBlocksFromEntries, type DetailRenderBlock } from '@/features/compendium/utils/detailBlocks';
import { buildSourceFacts, buildSpellFacts, getEntityIdsFromMetadata, sortEntityNames } from '@/features/compendium/utils/detailFacts';
import { parseInlineText } from '@/features/compendium/utils/inlineText';
import { queryKeys } from '@/shared/query/keys';
import type { CompendiumEntry } from '@/shared/types/domain';
import { theme } from '@/shared/ui/theme';

const contentService = new ContentService(new SQLiteContentRepository());

interface SpellDetailViewProps {
  entry: CompendiumEntry;
}

function withScalingIncrementDisplay(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(
      /\{@(scaledice|scaledamage)\s+([^}|]+)(?:\|[^}|]*)?(?:\|([^}]*))?\}/gi,
      (_match, tagName: string, baseValue: string, incrementValue: string | undefined) =>
        `{@${tagName.toLowerCase() === 'scaledamage' ? 'damage' : 'dice'} ${incrementValue || baseValue}}`,
    );
  }

  if (Array.isArray(value)) {
    return value.map(withScalingIncrementDisplay);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entryValue]) => [key, withScalingIncrementDisplay(entryValue)]));
  }

  return value;
}

function buildHigherLevelBlocks(entry: CompendiumEntry): DetailRenderBlock[] {
  const higherLevelEntries = entry.renderPayload?.entriesHigherLevel;
  if (Array.isArray(higherLevelEntries)) {
    const blocks = buildRenderBlocksFromEntries(withScalingIncrementDisplay(higherLevelEntries) as unknown[]);
    if (blocks.length > 0) {
      return blocks;
    }
  }

  const higherLevelText = typeof entry.metadata.higherLevelText === 'string' ? entry.metadata.higherLevelText : null;
  const tokens = higherLevelText ? parseInlineText(higherLevelText) : [];

  return tokens.length > 0 ? [{ kind: 'paragraph', tokens }] : [];
}

export function SpellDetailView({ entry }: SpellDetailViewProps) {
  const availabilityIds = useMemo(
    () => Array.from(new Set([...getEntityIdsFromMetadata(entry.metadata.classIds), ...getEntityIdsFromMetadata(entry.metadata.subclassIds)])),
    [entry.metadata.classIds, entry.metadata.subclassIds],
  );
  const availabilityQuery = useQuery({
    queryKey: queryKeys.compendiumContentEntities(availabilityIds),
    queryFn: () => contentService.getContentEntitiesByIds(availabilityIds),
    enabled: availabilityIds.length > 0,
  });

  const classNames = sortEntityNames((availabilityQuery.data ?? []).filter((entity) => entity.entityType === 'class')).map((entity) => entity.name);
  const subclassNames = sortEntityNames((availabilityQuery.data ?? []).filter((entity) => entity.entityType === 'subclass')).map((entity) => entity.name);
  const higherLevelBlocks = useMemo(() => buildHigherLevelBlocks(entry), [entry]);

  return (
    <>
      <CompendiumDetailHeader entry={entry} />
      <DetailSection title="Casting Facts">
        <DetailFactGrid facts={[...buildSpellFacts(entry), ...buildSourceFacts(entry)]} />
      </DetailSection>
      {classNames.length > 0 || subclassNames.length > 0 ? (
        <DetailSection title="Available To">
          <View style={styles.availabilityList}>
            {classNames.length > 0 ? (
              <View style={styles.availabilityGroup}>
                <Text style={styles.availabilityLabel}>Classes</Text>
                <Text style={styles.availabilityText}>{classNames.join(', ')}</Text>
              </View>
            ) : null}
            {subclassNames.length > 0 ? (
              <View style={styles.availabilityGroup}>
                <Text style={styles.availabilityLabel}>Subclasses</Text>
                <Text style={styles.availabilityText}>{subclassNames.join(', ')}</Text>
              </View>
            ) : null}
          </View>
        </DetailSection>
      ) : null}
      <DetailSection title="Details">
        <RenderBlockList blocks={buildRenderBlocks(entry)} referenceContext={{ sourceCode: entry.sourceCode }} />
      </DetailSection>
      {higherLevelBlocks.length > 0 ? (
        <DetailSection title="Higher-Level Casting">
          <RenderBlockList blocks={higherLevelBlocks} referenceContext={{ sourceCode: entry.sourceCode }} />
        </DetailSection>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  availabilityList: {
    gap: theme.spacing.md,
  },
  availabilityGroup: {
    gap: 4,
  },
  availabilityLabel: {
    color: theme.colors.textFaint,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  availabilityText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
  },
});
