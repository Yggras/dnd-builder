import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BuilderSpellCard } from '@/features/builder/components/BuilderSpellCard';
import { BuilderSpellDetailSheet } from '@/features/builder/components/BuilderSpellDetailSheet';
import type { BuilderDraftPayload } from '@/features/builder/types';
import { summarizeSpellcasting, type SpellWorkflowType } from '@/features/builder/utils/spellReview';
import { getCompendiumEntryIdFromEntityId } from '@/features/compendium/utils/catalog';
import type { ContentEntity } from '@/shared/types/domain';
import { theme, typography } from '@/shared/ui/theme';

type SpellTab = 'cantrips' | 'known' | 'prepared' | 'browse';
type SpellActionLabel = 'Add Cantrip' | 'Add Known' | 'Prepare' | 'Remove';

type BuilderSpellsSectionProps = {
  payload: BuilderDraftPayload;
  selectedCantripCount: number;
  selectedKnownLeveledCount: number;
  selectedPreparedCount: number;
  spellEntitiesById: Record<string, ContentEntity>;
  spellSearch: string;
  spellSummary: ReturnType<typeof summarizeSpellcasting>;
  updateKnownSpellSelection: (spellId: string) => void;
  updatePreparedSpellSelection: (spellId: string) => void;
  updateSpellExceptionNotes: (notes: string) => void;
  onSpellSearchChange: (value: string) => void;
};

function getSpellLevel(spell: ContentEntity) {
  return Number(spell.metadata.level ?? 0);
}

function sortSpells(spells: ContentEntity[]) {
  return [...spells].sort((left, right) => getSpellLevel(left) - getSpellLevel(right) || left.name.localeCompare(right.name));
}

function getTabs(workflow: SpellWorkflowType): SpellTab[] {
  switch (workflow) {
    case 'known':
      return ['cantrips', 'known', 'browse'];
    case 'prepared':
      return ['cantrips', 'prepared', 'browse'];
    case 'known-prepared':
      return ['cantrips', 'known', 'prepared', 'browse'];
    default:
      return [];
  }
}

function getStateLabel(payload: BuilderDraftPayload, spell: ContentEntity) {
  const isKnown = payload.spellsStep.selectedSpellIds.includes(spell.id);
  const isPrepared = payload.spellsStep.preparedSpellIds.includes(spell.id);
  const level = getSpellLevel(spell);

  if (level === 0 && isKnown) return 'Cantrip';
  if (isPrepared) return 'Prepared';
  if (isKnown) return 'Known';
  return null;
}

function getTabLabel(tab: SpellTab, selectedCantripCount: number, selectedKnownLeveledCount: number, selectedPreparedCount: number, spellSummary: ReturnType<typeof summarizeSpellcasting>) {
  switch (tab) {
    case 'cantrips':
      return `Cantrips ${selectedCantripCount}/${spellSummary.cantripLimit}`;
    case 'known':
      return `Known ${selectedKnownLeveledCount}/${spellSummary.knownSpellLimit}`;
    case 'prepared':
      return `Prepared ${selectedPreparedCount}/${spellSummary.preparedSpellLimit}`;
    case 'browse':
      return 'Browse';
  }
}

export function BuilderSpellsSection({
  payload,
  selectedCantripCount,
  selectedKnownLeveledCount,
  selectedPreparedCount,
  spellEntitiesById,
  spellSearch,
  spellSummary,
  updateKnownSpellSelection,
  updatePreparedSpellSelection,
  updateSpellExceptionNotes,
  onSpellSearchChange,
}: BuilderSpellsSectionProps) {
  const router = useRouter();
  const tabs = getTabs(spellSummary.workflow);
  const [activeTab, setActiveTab] = useState<SpellTab>(tabs[0] ?? 'browse');
  const [browseLevel, setBrowseLevel] = useState<number | null>(null);
  const [detailSpellId, setDetailSpellId] = useState<string | null>(null);
  const normalizedActiveTab = tabs.includes(activeTab) ? activeTab : tabs[0] ?? 'browse';
  const detailSpell = detailSpellId ? spellEntitiesById[detailSpellId] ?? null : null;

  const eligibleSpells = sortSpells(
    spellSummary.applicableSpellIds
      .map((spellId) => spellEntitiesById[spellId])
      .filter((spell): spell is ContentEntity => Boolean(spell))
      .filter((spell) => getSpellLevel(spell) <= spellSummary.maxSpellLevel),
  );
  const eligibleCantrips = eligibleSpells.filter((spell) => getSpellLevel(spell) === 0);
  const eligibleLeveledSpells = eligibleSpells.filter((spell) => getSpellLevel(spell) > 0);
  const selectedKnownSpells = eligibleLeveledSpells.filter((spell) => payload.spellsStep.selectedSpellIds.includes(spell.id));
  const selectedPreparedSpells = eligibleLeveledSpells.filter((spell) => payload.spellsStep.preparedSpellIds.includes(spell.id));
  const browseSpells = eligibleLeveledSpells
    .filter((spell) => browseLevel == null || getSpellLevel(spell) === browseLevel)
    .filter((spell) => spellSearch.trim() ? spell.searchText.toLowerCase().includes(spellSearch.trim().toLowerCase()) : true);
  const levelOptions = Array.from(new Set(eligibleLeveledSpells.map(getSpellLevel))).sort((left, right) => left - right);

  const getActionForSpell = (spell: ContentEntity): { label: SpellActionLabel | null; disabled: boolean; helper: string | null } => {
    const level = getSpellLevel(spell);
    const isKnown = payload.spellsStep.selectedSpellIds.includes(spell.id);
    const isPrepared = payload.spellsStep.preparedSpellIds.includes(spell.id);

    if (level === 0) {
      if (isKnown) return { label: 'Remove', disabled: false, helper: null };
      return {
        label: 'Add Cantrip',
        disabled: selectedCantripCount >= spellSummary.cantripLimit,
        helper: selectedCantripCount >= spellSummary.cantripLimit ? 'Cantrip limit reached. Remove one cantrip first.' : null,
      };
    }

    if (normalizedActiveTab === 'prepared') {
      return { label: 'Remove', disabled: false, helper: null };
    }

    if (normalizedActiveTab === 'known') {
      return { label: 'Remove', disabled: false, helper: null };
    }

    if (spellSummary.workflow === 'prepared') {
      if (isPrepared) return { label: 'Remove', disabled: false, helper: null };
      return {
        label: 'Prepare',
        disabled: selectedPreparedCount >= spellSummary.preparedSpellLimit,
        helper: selectedPreparedCount >= spellSummary.preparedSpellLimit ? 'Prepared spell limit reached. Remove one prepared spell first.' : null,
      };
    }

    if (spellSummary.workflow === 'known-prepared' && isKnown) {
      if (isPrepared) return { label: 'Remove', disabled: false, helper: null };
      return {
        label: 'Prepare',
        disabled: selectedPreparedCount >= spellSummary.preparedSpellLimit,
        helper: selectedPreparedCount >= spellSummary.preparedSpellLimit ? 'Prepared spell limit reached. Remove one prepared spell first.' : null,
      };
    }

    if (isKnown) return { label: 'Remove', disabled: false, helper: null };
    return {
      label: 'Add Known',
      disabled: selectedKnownLeveledCount >= spellSummary.knownSpellLimit,
      helper: selectedKnownLeveledCount >= spellSummary.knownSpellLimit ? 'Known spell limit reached. Remove one known spell first.' : null,
    };
  };

  const applySpellAction = (spell: ContentEntity, actionLabel: SpellActionLabel | null) => {
    if (!actionLabel) return;

    if (actionLabel === 'Prepare') {
      updatePreparedSpellSelection(spell.id);
    } else if (actionLabel === 'Remove' && payload.spellsStep.preparedSpellIds.includes(spell.id) && normalizedActiveTab !== 'known') {
      updatePreparedSpellSelection(spell.id);
    } else {
      updateKnownSpellSelection(spell.id);
    }

    setDetailSpellId(null);
  };

  const renderSpellList = (spells: ContentEntity[], emptyMessage: string) => (
    <View style={styles.spellList}>
      {spells.length > 0 ? spells.map((spell) => (
        <BuilderSpellCard key={spell.id} spell={spell} stateLabel={getStateLabel(payload, spell)} onPress={() => setDetailSpellId(spell.id)} />
      )) : <Text style={styles.emptyText}>{emptyMessage}</Text>}
    </View>
  );

  const action = detailSpell ? getActionForSpell(detailSpell) : { label: null, disabled: false, helper: null };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Spells</Text>
        <Text style={styles.sectionMeta}>
          {spellSummary.isCaster
            ? [
                `Cantrips ${selectedCantripCount}/${spellSummary.cantripLimit}`,
                spellSummary.usesKnownSpells || spellSummary.workflow === 'known' || spellSummary.workflow === 'known-prepared' ? `Known ${selectedKnownLeveledCount}/${spellSummary.knownSpellLimit}` : null,
                spellSummary.usesPreparedSpells || spellSummary.workflow === 'prepared' || spellSummary.workflow === 'known-prepared' ? `Prepared ${selectedPreparedCount}/${spellSummary.preparedSpellLimit}` : null,
              ].filter(Boolean).join(' • ')
            : 'No spellcasting'}
        </Text>
      </View>

      {!spellSummary.isCaster ? (
        <Text style={styles.sectionBodyText}>This build does not currently require spell selection.</Text>
      ) : spellSummary.workflow === 'unsupported' ? (
        <View style={styles.unsupportedCard}>
          <Text style={styles.unsupportedTitle}>Spellcasting workflow needs review</Text>
          <Text style={styles.unsupportedText}>This build has spellcasting metadata, but the builder cannot confidently model known/prepared spell choices yet.</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionBodyText}>Select eligible spells by task. Current maximum spell level: {spellSummary.maxSpellLevel}.</Text>

          <View style={styles.tabRow}>
            {tabs.map((tab) => {
              const isActive = normalizedActiveTab === tab;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={({ pressed }) => [styles.tabButton, isActive && styles.tabButtonActive, pressed && styles.tabButtonPressed]}
                >
                  <Text style={[styles.tabButtonLabel, isActive && styles.tabButtonLabelActive]}>{getTabLabel(tab, selectedCantripCount, selectedKnownLeveledCount, selectedPreparedCount, spellSummary)}</Text>
                </Pressable>
              );
            })}
          </View>

          {normalizedActiveTab === 'cantrips' ? renderSpellList(eligibleCantrips, 'No eligible cantrips are available for this build.') : null}
          {normalizedActiveTab === 'known' ? renderSpellList(selectedKnownSpells, 'No known spells selected. Browse eligible spells to add known spells.') : null}
          {normalizedActiveTab === 'prepared' ? renderSpellList(selectedPreparedSpells, 'No prepared spells selected. Browse eligible spells to prepare spells.') : null}
          {normalizedActiveTab === 'browse' ? (
            <View style={styles.browseBlock}>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={onSpellSearchChange}
                placeholder="Search eligible leveled spells"
                placeholderTextColor={theme.colors.textFaint}
                style={styles.input}
                value={spellSearch}
              />
              <View style={styles.levelFilterRow}>
                <Pressable accessibilityRole="button" onPress={() => setBrowseLevel(null)} style={({ pressed }) => [styles.filterChip, browseLevel == null && styles.filterChipActive, pressed && styles.filterChipPressed]}>
                  <Text style={[styles.filterChipLabel, browseLevel == null && styles.filterChipLabelActive]}>All</Text>
                </Pressable>
                {levelOptions.map((level) => (
                  <Pressable key={level} accessibilityRole="button" onPress={() => setBrowseLevel(level)} style={({ pressed }) => [styles.filterChip, browseLevel === level && styles.filterChipActive, pressed && styles.filterChipPressed]}>
                    <Text style={[styles.filterChipLabel, browseLevel === level && styles.filterChipLabelActive]}>Level {level}</Text>
                  </Pressable>
                ))}
              </View>
              {renderSpellList(browseSpells, 'No eligible leveled spells matched your filters.')}
            </View>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Spell exceptions</Text>
            <TextInput
              multiline
              onChangeText={updateSpellExceptionNotes}
              placeholder="Optional edge-case notes, one per line."
              placeholderTextColor={theme.colors.textFaint}
              style={[styles.input, styles.notesInput]}
              textAlignVertical="top"
              value={payload.spellsStep.manualExceptionNotes.join('\n')}
            />
          </View>
        </>
      )}

      <BuilderSpellDetailSheet
        spell={detailSpell}
        actionLabel={action.label}
        actionDisabled={action.disabled}
        helperText={action.helper}
        onClose={() => setDetailSpellId(null)}
        onPrimaryAction={() => detailSpell ? applySpellAction(detailSpell, action.label) : undefined}
        onOpenCompendium={() => detailSpell ? router.push(`/(app)/compendium/${encodeURIComponent(getCompendiumEntryIdFromEntityId(detailSpell.id))}` as never) : undefined}
        visible={Boolean(detailSpell)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  browseBlock: {
    gap: theme.spacing.md,
  },
  fieldGroup: {
    gap: theme.spacing.xs,
  },
  fieldLabel: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    color: theme.colors.textPrimary,
    minHeight: 46,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  notesInput: {
    minHeight: 120,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  sectionBodyText: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
  sectionHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  sectionMeta: {
    color: theme.colors.textMuted,
    ...typography.meta,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    ...typography.sectionTitle,
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  tabButton: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 9,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.accentPrimaryDeep,
    borderColor: theme.colors.accentPrimary,
  },
  tabButtonPressed: {
    opacity: 0.85,
  },
  tabButtonLabel: {
    color: theme.colors.textSecondary,
    ...typography.meta,
    fontWeight: '800',
  },
  tabButtonLabelActive: {
    color: theme.colors.accentPrimarySoft,
  },
  spellList: {
    gap: theme.spacing.sm,
  },
  emptyText: {
    color: theme.colors.textMuted,
    ...typography.bodySm,
  },
  levelFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  filterChip: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: theme.colors.accentPrimaryDeep,
    borderColor: theme.colors.accentPrimary,
  },
  filterChipPressed: {
    opacity: 0.85,
  },
  filterChipLabel: {
    color: theme.colors.textSecondary,
    ...typography.meta,
    fontWeight: '800',
  },
  filterChipLabelActive: {
    color: theme.colors.accentPrimarySoft,
  },
  unsupportedCard: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.accentLegacy,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  unsupportedTitle: {
    color: theme.colors.accentLegacySoft,
    fontSize: 14,
    fontWeight: '800',
  },
  unsupportedText: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
});
