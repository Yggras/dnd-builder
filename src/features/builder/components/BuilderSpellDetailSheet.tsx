import { StyleSheet, Text, View } from 'react-native';

import { BuilderChoiceSheet } from '@/features/builder/components/BuilderChoiceSheet';
import { RenderBlockList } from '@/features/compendium/components/RenderBlockList';
import { buildRenderBlocksFromEntries, type DetailRenderBlock } from '@/features/compendium/utils/detailBlocks';
import { getClassEditionBadge } from '@/features/builder/utils/classMetadata';
import { getSpellSchoolLabel } from '@/features/compendium/utils/catalog';
import { cleanInlineText } from '@/features/compendium/utils/inlineText';
import type { ContentEntity } from '@/shared/types/domain';
import { theme, typography } from '@/shared/ui/theme';

type SpellActionLabel = 'Add Cantrip' | 'Add Known' | 'Prepare' | 'Remove';

interface BuilderSpellDetailSheetProps {
  visible: boolean;
  spell: ContentEntity | null;
  sourceLabel?: string | null;
  spellcastingAbility?: string | null;
  actionLabel: SpellActionLabel | null;
  actionDisabled?: boolean;
  helperText?: string | null;
  onClose: () => void;
  onPrimaryAction: () => void;
  onOpenCompendium: () => void;
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function numberValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function titleCase(value: string) {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDistance(distance: Record<string, unknown> | null) {
  if (!distance) {
    return null;
  }

  const type = stringValue(distance.type);
  const amount = numberValue(distance.amount);

  if (!type) {
    return null;
  }

  if (['self', 'touch', 'sight', 'unlimited', 'special'].includes(type)) {
    return titleCase(type);
  }

  return amount == null ? titleCase(type) : `${amount} ${type}`;
}

function formatRange(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const range = value as Record<string, unknown>;
  const type = stringValue(range.type);
  const distance = typeof range.distance === 'object' && range.distance != null && !Array.isArray(range.distance)
    ? formatDistance(range.distance as Record<string, unknown>)
    : null;

  if (type === 'point') {
    return distance;
  }

  if (type && ['line', 'cone', 'radius', 'sphere', 'cube'].includes(type)) {
    return [distance, titleCase(type)].filter(Boolean).join(' ');
  }

  return distance ?? (type ? titleCase(type) : null);
}

function formatDurationUnit(value: string, amount: number) {
  return amount === 1 ? value : `${value}s`;
}

function formatDurationEntry(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const duration = value as Record<string, unknown>;
  const type = stringValue(duration.type);

  if (type === 'instant') return 'Instantaneous';
  if (type === 'permanent') return 'Until dispelled';
  if (type === 'special') return 'Special';

  if (type === 'timed' && duration.duration && typeof duration.duration === 'object' && !Array.isArray(duration.duration)) {
    const timed = duration.duration as Record<string, unknown>;
    const amount = numberValue(timed.amount) ?? 1;
    const unit = stringValue(timed.type) ?? 'time';
    const base = `${amount} ${formatDurationUnit(unit, amount)}`;
    return duration.concentration ? `Concentration, up to ${base}` : base;
  }

  return type ? titleCase(type) : null;
}

function formatDuration(value: unknown) {
  const entries = Array.isArray(value) ? value.map(formatDurationEntry).filter(Boolean) : [];
  return entries.length > 0 ? entries.join(', ') : null;
}

function formatComponents(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const components = value as Record<string, unknown>;
  const parts: string[] = [];
  if (components.v) parts.push('V');
  if (components.s) parts.push('S');
  if (components.m) {
    const material = typeof components.m === 'string' ? cleanInlineText(components.m) : 'M';
    parts.push(material === 'M' ? 'M' : `M (${material})`);
  }

  return parts.length > 0 ? parts.join(', ') : null;
}

function formatCastingTime(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  return value.map((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
    const record = entry as Record<string, unknown>;
    const number = numberValue(record.number) ?? 1;
    const unit = stringValue(record.unit) ?? 'action';
    const condition = stringValue(record.condition);
    const base = `${number} ${formatDurationUnit(unit, number)}`;
    return condition ? `${base}, ${cleanInlineText(condition)}` : base;
  }).filter(Boolean).join(', ');
}

function buildSpellFacts(spell: ContentEntity, sourceLabel?: string | null, spellcastingAbility?: string | null) {
  const level = Number(spell.metadata.level ?? 0);
  const duration = formatDuration(spell.metadata.duration);
  const concentration = Boolean(spell.metadata.concentration) || duration?.toLowerCase().includes('concentration');

  return [
    { label: 'Spell Source', value: sourceLabel ?? 'Not selected' },
    { label: 'Spellcasting Ability', value: spellcastingAbility ? spellcastingAbility.toUpperCase() : 'Unknown' },
    { label: 'Level', value: level === 0 ? 'Cantrip' : `Level ${level}` },
    { label: 'School', value: getSpellSchoolLabel(spell.metadata.school) ?? 'Unknown' },
    { label: 'Casting Time', value: formatCastingTime(spell.metadata.time) || 'Unknown' },
    { label: 'Range', value: formatRange(spell.metadata.range) || 'Unknown' },
    { label: 'Components', value: formatComponents(spell.metadata.components) || 'Unknown' },
    { label: 'Duration', value: duration || 'Unknown' },
    { label: 'Concentration', value: concentration ? 'Yes' : 'No' },
    { label: 'Ritual', value: spell.metadata.ritual ? 'Yes' : 'No' },
  ];
}

function buildSpellBlocks(spell: ContentEntity): DetailRenderBlock[] {
  const entries = spell.renderPayload?.entries;
  if (Array.isArray(entries)) {
    const blocks = buildRenderBlocksFromEntries(entries);
    if (blocks.length > 0) return blocks;
  }

  if (typeof spell.metadata.entriesText === 'string') {
    return [{ kind: 'fallbackText', text: spell.metadata.entriesText }];
  }

  return spell.summary ? [{ kind: 'fallbackText', text: spell.summary }] : [];
}

function buildHigherLevelBlocks(spell: ContentEntity): DetailRenderBlock[] {
  const entries = spell.renderPayload?.entriesHigherLevel;
  if (Array.isArray(entries)) {
    return buildRenderBlocksFromEntries(entries);
  }

  return typeof spell.metadata.higherLevelText === 'string' ? [{ kind: 'fallbackText', text: spell.metadata.higherLevelText }] : [];
}

export function BuilderSpellDetailSheet({
  visible,
  spell,
  sourceLabel,
  spellcastingAbility,
  actionLabel,
  actionDisabled = false,
  helperText,
  onClose,
  onPrimaryAction,
  onOpenCompendium,
}: BuilderSpellDetailSheetProps) {
  const facts = spell ? buildSpellFacts(spell, sourceLabel, spellcastingAbility) : [];
  const spellBlocks = spell ? buildSpellBlocks(spell) : [];
  const higherLevelBlocks = spell ? buildHigherLevelBlocks(spell) : [];

  return (
    <BuilderChoiceSheet
      visible={visible && Boolean(spell)}
      title={spell?.name ?? 'Spell details'}
      subtitle="Spell rules"
      onClose={onClose}
      helperText={helperText}
      primaryAction={actionLabel ? { label: actionLabel, onPress: onPrimaryAction, disabled: actionDisabled, destructive: actionLabel === 'Remove' } : undefined}
      secondaryAction={{ label: 'Open in Compendium', onPress: onOpenCompendium }}
    >
      {spell ? (
        <>
          <View style={styles.badgeRow}>
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceBadgeLabel}>{spell.sourceCode}</Text>
            </View>
            <View style={[styles.editionBadge, spell.isLegacy && styles.legacyBadge]}>
              <Text style={[styles.editionBadgeLabel, spell.isLegacy && styles.legacyBadgeLabel]}>{getClassEditionBadge(spell)}</Text>
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Rules Snapshot</Text>
            <View style={styles.factGrid}>
              {facts.map((fact) => (
                <View key={fact.label} style={styles.factItem}>
                  <Text style={styles.factLabel}>{fact.label}</Text>
                  <Text style={styles.factValue}>{fact.value}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Effect</Text>
            {spellBlocks.length > 0 ? <RenderBlockList blocks={spellBlocks} referenceContext={{ sourceCode: spell.sourceCode }} /> : <Text style={styles.emptyText}>Not structured yet.</Text>}
          </View>

          {higherLevelBlocks.length > 0 ? (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Higher-Level Casting</Text>
              <RenderBlockList blocks={higherLevelBlocks} referenceContext={{ sourceCode: spell.sourceCode }} />
            </View>
          ) : null}
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
});
