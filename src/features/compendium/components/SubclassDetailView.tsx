import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import { CompendiumDetailHeader } from '@/features/compendium/components/CompendiumDetailHeader';
import { DetailFactGrid } from '@/features/compendium/components/DetailFactGrid';
import { DetailSection } from '@/features/compendium/components/DetailSection';
import { FeatureProgressionList } from '@/features/compendium/components/FeatureProgressionList';
import { RenderBlockList } from '@/features/compendium/components/RenderBlockList';
import { SQLiteContentRepository } from '@/features/content/adapters/SQLiteContentRepository';
import { ContentService } from '@/features/content/services/ContentService';
import { buildRenderBlocks } from '@/features/compendium/utils/detailBlocks';
import {
  buildSubclassFacts,
  buildSubclassFeatureRows,
  getAdditionalSpellIds,
  getParentClassIdFromSubclassEntry,
} from '@/features/compendium/utils/classDetails';
import { sortEntityNames } from '@/features/compendium/utils/detailFacts';
import { queryKeys } from '@/shared/query/keys';
import type { CompendiumEntry } from '@/shared/types/domain';
import { theme } from '@/shared/ui/theme';

const contentService = new ContentService(new SQLiteContentRepository());

interface SubclassDetailViewProps {
  entry: CompendiumEntry;
}

export function SubclassDetailView({ entry }: SubclassDetailViewProps) {
  const relatedIds = useMemo(
    () => Array.from(new Set([getParentClassIdFromSubclassEntry(entry), ...getAdditionalSpellIds(entry)].filter((id): id is string => Boolean(id)))),
    [entry],
  );
  const relatedQuery = useQuery({
    queryKey: queryKeys.compendiumContentEntities(relatedIds),
    queryFn: () => contentService.getContentEntitiesByIds(relatedIds),
    enabled: relatedIds.length > 0,
  });

  const relatedEntities = relatedQuery.data ?? [];
  const parentClassId = getParentClassIdFromSubclassEntry(entry);
  const parentClass = relatedEntities.find((entity) => entity.id === parentClassId && entity.entityType === 'class') ?? null;
  const additionalSpells = sortEntityNames(relatedEntities.filter((entity) => entity.entityType === 'spell'));
  const renderBlocks = buildRenderBlocks(entry);

  return (
    <>
      <CompendiumDetailHeader entry={entry} />
      <DetailSection title="Subclass Facts">
        <DetailFactGrid facts={buildSubclassFacts(entry, parentClass)} />
      </DetailSection>
      <DetailSection title="Feature Progression">
        <FeatureProgressionList rows={buildSubclassFeatureRows(entry)} />
      </DetailSection>
      {additionalSpells.length > 0 ? (
        <DetailSection title="Additional Spells">
          <View style={styles.spellList}>
            {additionalSpells.map((spell) => (
              <View key={spell.id} style={styles.spellPill}>
                <Text style={styles.spellName}>{spell.name}</Text>
                <Text style={styles.spellSource}>{spell.sourceCode}</Text>
              </View>
            ))}
          </View>
        </DetailSection>
      ) : null}
      {renderBlocks.length > 0 ? (
        <DetailSection title="Details">
          <RenderBlockList blocks={renderBlocks} />
        </DetailSection>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  spellList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  spellPill: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  spellName: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  spellSource: {
    color: theme.colors.accentSuccessSoft,
    fontSize: 12,
    fontWeight: '700',
  },
});
