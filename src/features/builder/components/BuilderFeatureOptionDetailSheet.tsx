import { StyleSheet, Text, View } from 'react-native';

import { BuilderChoiceSheet } from '@/features/builder/components/BuilderChoiceSheet';
import { RenderBlockList } from '@/features/compendium/components/RenderBlockList';
import { buildRenderBlocksFromEntries, type DetailRenderBlock } from '@/features/compendium/utils/detailBlocks';
import { getClassEditionBadge } from '@/features/builder/utils/classMetadata';
import { getGrantTitle } from '@/features/builder/utils/classStep';
import { normalizeAbilityChoices, summarizeAbilityRequirement } from '@/features/builder/utils/originAndAbilities';
import type { ChoiceGrant, ContentEntity } from '@/shared/types/domain';
import { theme, typography } from '@/shared/ui/theme';

interface BuilderFeatureOptionDetailSheetProps {
  visible: boolean;
  grant?: ChoiceGrant | null;
  contextLabel?: string | null;
  option: ContentEntity | null;
  isSelected: boolean;
  isFull: boolean;
  primaryChooseLabel?: string;
  selectedOptionNames: readonly string[];
  onClose: () => void;
  onChoose: () => void;
  onRemove: () => void;
  onOpenCompendium: () => void;
}

function buildOptionBlocks(option: ContentEntity): DetailRenderBlock[] {
  const entries = option.renderPayload?.entries;
  if (Array.isArray(entries)) {
    const blocks = buildRenderBlocksFromEntries(entries);
    if (blocks.length > 0) {
      return blocks;
    }
  }

  if (option.summary) {
    return [{ kind: 'fallbackText', text: option.summary }];
  }

  const fallback = option.searchText.replace(option.name, '').trim();
  return fallback ? [{ kind: 'fallbackText', text: fallback }] : [];
}

function buildFeatFactRows(option: ContentEntity) {
  if (option.entityType !== 'feat') {
    return [] as Array<{ label: string; value: string }>;
  }

  const abilityRequirement = normalizeAbilityChoices('feat', option.id, option.metadata.ability, {
    title: option.name,
  });
  const abilitySummary = summarizeAbilityRequirement(abilityRequirement).join(' ');

  return [
    {
      label: 'Ability Bonus',
      value: abilitySummary || 'None structured',
    },
  ];
}

export function BuilderFeatureOptionDetailSheet({
  visible,
  grant = null,
  contextLabel,
  option,
  isSelected,
  isFull,
  primaryChooseLabel = 'Choose option',
  selectedOptionNames,
  onClose,
  onChoose,
  onRemove,
  onOpenCompendium,
}: BuilderFeatureOptionDetailSheetProps) {
  const blocks = option ? buildOptionBlocks(option) : [];
  const featFacts = option ? buildFeatFactRows(option) : [];
  const disabledHelper = !isSelected && isFull
    ? `Selection limit reached. Remove ${selectedOptionNames.join(', ')} before choosing another option.`
    : null;

  return (
    <BuilderChoiceSheet
      visible={visible && Boolean(option && (grant || contextLabel))}
      title={option?.name ?? 'Feature option'}
      subtitle={grant ? getGrantTitle(grant) : contextLabel ?? 'Feature choice'}
      onClose={onClose}
      helperText={disabledHelper}
      primaryAction={isSelected
        ? { label: 'Remove selection', onPress: onRemove, destructive: true }
        : { label: primaryChooseLabel, onPress: onChoose, disabled: isFull }}
      secondaryAction={{ label: 'Open in Compendium', onPress: onOpenCompendium }}
    >
      {option && (grant || contextLabel) ? (
        <>
          <View style={styles.badgeRow}>
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceBadgeLabel}>{option.sourceCode}</Text>
            </View>
            <View style={[styles.editionBadge, option.isLegacy && styles.legacyBadge]}>
              <Text style={[styles.editionBadgeLabel, option.isLegacy && styles.legacyBadgeLabel]}>{getClassEditionBadge(option)}</Text>
            </View>
          </View>

          {featFacts.length > 0 ? (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Feat Facts</Text>
              <View style={styles.factGrid}>
                {featFacts.map((fact) => (
                  <View key={fact.label} style={styles.factItem}>
                    <Text style={styles.factLabel}>{fact.label}</Text>
                    <Text style={styles.factValue}>{fact.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Rules</Text>
            {blocks.length > 0 ? <RenderBlockList blocks={blocks} referenceContext={{ sourceCode: option.sourceCode }} /> : <Text style={styles.emptyText}>Not structured yet.</Text>}
          </View>

          <View style={styles.contextCard}>
            <Text style={styles.contextTitle}>Grant Context</Text>
            <Text style={styles.contextText}>
              {grant ? `This satisfies ${getGrantTitle(grant)}, choose ${grant.count}.` : `This satisfies ${contextLabel}.`}
            </Text>
          </View>
        </>
      ) : null}
    </BuilderChoiceSheet>
  );
}

const styles = StyleSheet.create({
  badgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  sourceBadge: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sourceBadgeLabel: {
    color: theme.colors.accentSuccessSoft,
    ...typography.meta,
    fontWeight: '800',
  },
  editionBadge: {
    backgroundColor: theme.colors.accentPrimaryDeep,
    borderRadius: theme.radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  editionBadgeLabel: {
    color: theme.colors.accentPrimarySoft,
    fontSize: 12,
    fontWeight: '800',
  },
  legacyBadge: {
    backgroundColor: theme.colors.accentLegacy,
  },
  legacyBadgeLabel: {
    color: theme.colors.accentLegacySoft,
  },
  sectionBlock: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    ...typography.sectionTitle,
  },
  factGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  factItem: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    gap: 3,
    minWidth: 140,
    padding: theme.spacing.sm,
  },
  factLabel: {
    color: theme.colors.textFaint,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  factValue: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  emptyText: {
    color: theme.colors.textMuted,
    ...typography.bodySm,
  },
  contextCard: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    gap: 4,
    padding: theme.spacing.md,
  },
  contextTitle: {
    color: theme.colors.textFaint,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  contextText: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
});
