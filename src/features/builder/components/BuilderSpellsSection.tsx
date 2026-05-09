import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BuilderSpellCard } from '@/features/builder/components/BuilderSpellCard';
import { BuilderSpellDetailSheet } from '@/features/builder/components/BuilderSpellDetailSheet';
import type { BuilderDraftPayload, BuilderIssue } from '@/features/builder/types';
import { summarizeSpellcasting, type SpellWorkflowType, type SpellcastingSourceSummary } from '@/features/builder/utils/spellReview';
import { getCompendiumEntryIdFromEntityId } from '@/features/compendium/utils/catalog';
import type { ContentEntity } from '@/shared/types/domain';
import { theme, typography } from '@/shared/ui/theme';

type SpellTab = 'cantrips' | 'known' | 'prepared' | 'browse';
type SpellActionLabel = 'Add Cantrip' | 'Add Known' | 'Prepare' | 'Remove';
type SpellActionTarget = 'known' | 'prepared';

type SpellListItem = {
  key: string;
  spell: ContentEntity;
  source: SpellcastingSourceSummary;
  sourceLabel: string;
  stateLabel: string | null;
};

type BuilderSpellsSectionProps = {
  payload: BuilderDraftPayload;
  selectedCantripCount: number;
  selectedKnownLeveledCount: number;
  selectedPreparedCount: number;
  spellEntitiesById: Record<string, ContentEntity>;
  spellSearch: string;
  spellSummary: ReturnType<typeof summarizeSpellcasting>;
  updateKnownSpellSelection: (spellId: string, classAllocationId: string) => void;
  updatePreparedSpellSelection: (spellId: string, classAllocationId: string) => void;
  updateSpellExceptionNotes: (notes: string) => void;
  onSpellSearchChange: (value: string) => void;
};

function getSpellLevel(spell: ContentEntity) {
  return Number(spell.metadata.level ?? 0);
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

function formatSourceLabel(source: SpellcastingSourceSummary) {
  return source.spellcastingAbility
    ? `${source.className} (${source.spellcastingAbility.toUpperCase()})`
    : source.className;
}

function getSelectionStateLabel(payload: BuilderDraftPayload, spell: ContentEntity, source: SpellcastingSourceSummary) {
  const spellSelections = Array.isArray(payload.spellsStep.selections) ? payload.spellsStep.selections : [];
  const isCantrip = spellSelections.some((selection) => selection.spellId === spell.id && selection.classAllocationId === source.allocationId && selection.selectionType === 'cantrip');
  const isKnown = spellSelections.some((selection) => selection.spellId === spell.id && selection.classAllocationId === source.allocationId && selection.selectionType === 'known');
  const isPrepared = spellSelections.some((selection) => selection.spellId === spell.id && selection.classAllocationId === source.allocationId && selection.selectionType === 'prepared');

  if (isCantrip) return 'Cantrip';
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

function getWorkflowLabel(workflow: SpellWorkflowType) {
  switch (workflow) {
    case 'known':
      return 'Known Spells';
    case 'prepared':
      return 'Prepared Spells';
    case 'known-prepared':
      return 'Known + Prepared';
    case 'unsupported':
      return 'Needs Review';
    default:
      return 'No Spellcasting';
  }
}

function getIssueSourceAllocationId(issue: BuilderIssue) {
  const prefixes = ['spell-cantrip-overfill-', 'spell-known-overfill-', 'spell-prepared-overfill-'];
  const matchingPrefix = prefixes.find((prefix) => issue.id.startsWith(prefix));
  return matchingPrefix ? issue.id.slice(matchingPrefix.length) : null;
}

function getSourceStatus(issues: readonly BuilderIssue[]) {
  if (issues.some((issue) => issue.category === 'blocker' || issue.category === 'checklist')) {
    return 'Fix';
  }

  if (issues.some((issue) => issue.category === 'notice')) {
    return 'Need';
  }

  return 'OK';
}

function issueMatchesActiveTab(issue: BuilderIssue, activeTab: SpellTab) {
  if (issue.id.startsWith('spell-cantrip-overfill-')) {
    return activeTab === 'cantrips';
  }

  if (issue.id.startsWith('spell-known-overfill-')) {
    return activeTab === 'known' || activeTab === 'browse';
  }

  if (issue.id.startsWith('spell-prepared-overfill-') || issue.id === 'spell-prepared-not-known') {
    return activeTab === 'prepared' || activeTab === 'browse';
  }

  if (issue.id === 'spell-max-level' || issue.id === 'spell-invalid-selection') {
    return true;
  }

  return activeTab === 'browse';
}

function getTabGuidance(activeTab: SpellTab) {
  switch (activeTab) {
    case 'cantrips':
      return 'Choose cantrips here for each spellcasting source. Leveled spells stay in Browse, Known, or Prepared.';
    case 'known':
      return 'Known spells stay tied to their class source. Remove one from a full source before adding another.';
    case 'prepared':
      return 'Prepared spells stay tied to their class source. For known-plus-prepared casters, prepare only spells already tracked as known.';
    case 'browse':
      return 'Browse shows only eligible leveled spells for the current build. Cantrips stay in the Cantrips tab.';
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
  const [detailTarget, setDetailTarget] = useState<{ spellId: string; classAllocationId: string } | null>(null);
  const normalizedActiveTab = tabs.includes(activeTab) ? activeTab : tabs[0] ?? 'browse';
  const detailSpell = detailTarget ? spellEntitiesById[detailTarget.spellId] ?? null : null;
  const detailSource = detailTarget ? spellSummary.sources.find((source) => source.allocationId === detailTarget.classAllocationId) ?? null : null;
  const spellSelections = Array.isArray(payload.spellsStep.selections) ? payload.spellsStep.selections : [];
  const blockingIssues = spellSummary.issues.filter(
    (issue) => !issue.resolvedByOverride && (issue.category === 'blocker' || issue.category === 'checklist' || issue.category === 'notice'),
  );
  const activeTabIssues = blockingIssues.filter((issue) => issueMatchesActiveTab(issue, normalizedActiveTab));
  const overrideIssues = spellSummary.issues.filter((issue) => issue.category === 'override' || issue.resolvedByOverride);

  const sourceSpellItems = spellSummary.sources.flatMap((source) =>
    source.applicableSpellIds
      .map((spellId) => spellEntitiesById[spellId])
      .filter((spell): spell is ContentEntity => Boolean(spell))
      .filter((spell) => getSpellLevel(spell) <= source.maxSpellLevel)
      .map((spell) => ({
        key: `${source.allocationId}:${spell.id}`,
        spell,
        source,
        sourceLabel: formatSourceLabel(source),
        stateLabel: getSelectionStateLabel(payload, spell, source),
      } satisfies SpellListItem)),
  );
  const eligibleCantrips = sourceSpellItems.filter((item) => getSpellLevel(item.spell) === 0 && item.source.cantripLimit > 0);
  const eligibleLeveledSpellItems = sourceSpellItems.filter((item) => getSpellLevel(item.spell) > 0 && item.source.workflow !== 'unsupported');
  const selectedKnownSpellItems = spellSelections
    .filter((selection) => selection.selectionType === 'known')
    .map((selection): SpellListItem | null => {
      const spell = spellEntitiesById[selection.spellId];
      const source = spellSummary.sources.find((entry) => entry.allocationId === selection.classAllocationId);
      return spell && source ? { key: selection.id, spell, source, sourceLabel: formatSourceLabel(source), stateLabel: getSelectionStateLabel(payload, spell, source) } : null;
    })
    .filter((item): item is SpellListItem => Boolean(item));
  const selectedPreparedSpellItems = spellSelections
    .filter((selection) => selection.selectionType === 'prepared')
    .map((selection): SpellListItem | null => {
      const spell = spellEntitiesById[selection.spellId];
      const source = spellSummary.sources.find((entry) => entry.allocationId === selection.classAllocationId);
      return spell && source ? { key: selection.id, spell, source, sourceLabel: formatSourceLabel(source), stateLabel: getSelectionStateLabel(payload, spell, source) } : null;
    })
    .filter((item): item is SpellListItem => Boolean(item));
  const browseSpellItems = eligibleLeveledSpellItems
    .filter((item) => browseLevel == null || getSpellLevel(item.spell) === browseLevel)
    .filter((item) => spellSearch.trim() ? item.spell.searchText.toLowerCase().includes(spellSearch.trim().toLowerCase()) : true)
    .sort((left, right) => getSpellLevel(left.spell) - getSpellLevel(right.spell) || left.spell.name.localeCompare(right.spell.name) || left.source.className.localeCompare(right.source.className));
  const levelOptions = Array.from(new Set(eligibleLeveledSpellItems.map((item) => getSpellLevel(item.spell)))).sort((left, right) => left - right);

  const getSourceSelectionCount = (source: SpellcastingSourceSummary, selectionType: 'cantrip' | 'known' | 'prepared') => {
    return spellSelections.filter((selection) => selection.classAllocationId === source.allocationId && selection.selectionType === selectionType).length;
  };

  const sourceGuides = spellSummary.sources.map((source) => {
    const sourceIssues = blockingIssues.filter((issue) => getIssueSourceAllocationId(issue) === source.allocationId);
    return {
      source,
      status: getSourceStatus(sourceIssues),
      cantripCount: getSourceSelectionCount(source, 'cantrip'),
      knownCount: getSourceSelectionCount(source, 'known'),
      preparedCount: getSourceSelectionCount(source, 'prepared'),
      issues: sourceIssues,
    };
  });

  const getActionForSpell = (spell: ContentEntity, source: SpellcastingSourceSummary | null): { label: SpellActionLabel | null; target: SpellActionTarget | null; disabled: boolean; helper: string | null } => {
    if (!source) return { label: null, target: null, disabled: false, helper: null };

    const level = getSpellLevel(spell);
    const isKnown = spellSelections.some((selection) => selection.spellId === spell.id && selection.classAllocationId === source.allocationId && selection.selectionType === 'known');
    const isPrepared = spellSelections.some((selection) => selection.spellId === spell.id && selection.classAllocationId === source.allocationId && selection.selectionType === 'prepared');
    const isCantrip = spellSelections.some((selection) => selection.spellId === spell.id && selection.classAllocationId === source.allocationId && selection.selectionType === 'cantrip');
    const sourceLabel = source.className;

    if (level === 0) {
      if (isCantrip) return { label: 'Remove', target: 'known', disabled: false, helper: null };
      return {
        label: 'Add Cantrip',
        target: 'known',
        disabled: getSourceSelectionCount(source, 'cantrip') >= source.cantripLimit,
        helper: getSourceSelectionCount(source, 'cantrip') >= source.cantripLimit ? `${sourceLabel} cantrip limit reached. Remove one cantrip first.` : null,
      };
    }

    if (normalizedActiveTab === 'prepared') {
      return { label: 'Remove', target: 'prepared', disabled: false, helper: null };
    }

    if (normalizedActiveTab === 'known') {
      return { label: 'Remove', target: 'known', disabled: false, helper: null };
    }

    if (source.workflow === 'prepared') {
      if (isPrepared) return { label: 'Remove', target: 'prepared', disabled: false, helper: null };
      return {
        label: 'Prepare',
        target: 'prepared',
        disabled: getSourceSelectionCount(source, 'prepared') >= source.preparedSpellLimit,
        helper: getSourceSelectionCount(source, 'prepared') >= source.preparedSpellLimit ? `${sourceLabel} prepared spell limit reached. Remove one prepared spell first.` : null,
      };
    }

    if (source.workflow === 'known-prepared' && isKnown) {
      if (isPrepared) return { label: 'Remove', target: 'prepared', disabled: false, helper: null };
      return {
        label: 'Prepare',
        target: 'prepared',
        disabled: getSourceSelectionCount(source, 'prepared') >= source.preparedSpellLimit,
        helper: getSourceSelectionCount(source, 'prepared') >= source.preparedSpellLimit ? `${sourceLabel} prepared spell limit reached. Remove one prepared spell first.` : null,
      };
    }

    if (isKnown) return { label: 'Remove', target: 'known', disabled: false, helper: null };
    return {
      label: 'Add Known',
      target: 'known',
      disabled: getSourceSelectionCount(source, 'known') >= source.knownSpellLimit,
      helper: getSourceSelectionCount(source, 'known') >= source.knownSpellLimit ? `${sourceLabel} known spell limit reached. Remove one known spell first.` : null,
    };
  };

  const applySpellAction = (spell: ContentEntity, source: SpellcastingSourceSummary | null, actionTarget: SpellActionTarget | null) => {
    if (!source || !actionTarget) return;

    if (actionTarget === 'prepared') {
      updatePreparedSpellSelection(spell.id, source.allocationId);
    } else {
      updateKnownSpellSelection(spell.id, source.allocationId);
    }

    setDetailTarget(null);
  };

  const renderSpellList = (items: SpellListItem[], emptyMessage: string, guidance: string) => (
    <View style={styles.spellList}>
      <Text style={styles.tabGuidance}>{guidance}</Text>
      {items.length > 0 ? items.map((item) => (
        <BuilderSpellCard key={item.key} spell={item.spell} sourceLabel={item.sourceLabel} stateLabel={item.stateLabel} onPress={() => setDetailTarget({ spellId: item.spell.id, classAllocationId: item.source.allocationId })} />
      )) : <Text style={styles.emptyText}>{emptyMessage}</Text>}
    </View>
  );

  const action = detailSpell ? getActionForSpell(detailSpell, detailSource) : { label: null, target: null, disabled: false, helper: null };

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
          <Text style={styles.unsupportedText}>This build has spellcasting metadata, but the builder cannot confidently model the right known/prepared workflow yet. Review the spell choices later if this class gains more structured support.</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionBodyText}>Select eligible spells by class source. Spell save DC and attack modifiers use the source class ability.</Text>

          {sourceGuides.length > 0 ? (
            <View style={styles.sourceGuideList}>
              {sourceGuides.map(({ source, status, cantripCount, knownCount, preparedCount, issues }) => (
                <View key={source.allocationId} style={styles.sourceGuideCard}>
                  <View style={styles.sourceGuideHeader}>
                    <View style={styles.sourceGuideHeaderCopy}>
                      <Text style={styles.sourceGuideTitle}>{formatSourceLabel(source)}</Text>
                      <Text style={styles.sourceGuideMeta}>{getWorkflowLabel(source.workflow)}</Text>
                    </View>
                    <View style={[styles.sourceStatusBadge, status === 'Fix' && styles.sourceStatusBadgeFix, status === 'Need' && styles.sourceStatusBadgeNeed]}>
                      <Text style={[styles.sourceStatusLabel, status === 'Fix' && styles.sourceStatusLabelFix]}>{status}</Text>
                    </View>
                  </View>
                  <View style={styles.sourceFactList}>
                    {source.cantripLimit > 0 ? <Text style={styles.sourceFact}>Cantrips {cantripCount}/{source.cantripLimit}</Text> : null}
                    {source.usesKnownSpells ? <Text style={styles.sourceFact}>Known {knownCount}/{source.knownSpellLimit}</Text> : null}
                    {source.usesPreparedSpells ? <Text style={styles.sourceFact}>Prepared {preparedCount}/{source.preparedSpellLimit}</Text> : null}
                    {source.maxSpellLevel > 0 ? <Text style={styles.sourceFact}>Leveled spells up to {source.maxSpellLevel}</Text> : null}
                  </View>
                  {issues.length > 0 ? (
                    <View style={styles.sourceIssueList}>
                      {issues.map((issue) => (
                        <Text key={issue.id} style={styles.sourceIssueText}>{issue.summary}</Text>
                      ))}
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}

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

          {activeTabIssues.length > 0 ? (
            <View style={styles.issueList}>
              {activeTabIssues.map((issue) => (
                <View key={issue.id} style={[styles.issueCard, issue.category === 'notice' ? styles.issueCardNeed : styles.issueCardFix]}>
                  <Text style={[styles.issueTitle, issue.category === 'notice' ? styles.issueTitleNeed : styles.issueTitleFix]}>{issue.summary}</Text>
                  <Text style={styles.issueDetail}>{issue.detail}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {normalizedActiveTab === 'cantrips' ? renderSpellList(eligibleCantrips, 'No eligible cantrips are available for this build.', getTabGuidance('cantrips')) : null}
          {normalizedActiveTab === 'known' ? renderSpellList(selectedKnownSpellItems, 'No known spells selected. Browse eligible spells to add known spells for the relevant class source.', getTabGuidance('known')) : null}
          {normalizedActiveTab === 'prepared' ? renderSpellList(selectedPreparedSpellItems, 'No prepared spells selected. Browse eligible spells to prepare spells for the relevant class source.', getTabGuidance('prepared')) : null}
          {normalizedActiveTab === 'browse' ? (
            <View style={styles.browseBlock}>
              <Text style={styles.tabGuidance}>{getTabGuidance('browse')}</Text>
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
              {renderSpellList(browseSpellItems, 'No eligible leveled spells matched your filters. Clear the level filter or search to broaden the results.', '')}
            </View>
          ) : null}

          {overrideIssues.length > 0 ? (
            <View style={styles.overrideCard}>
              <Text style={styles.overrideTitle}>Manual spell notes are active</Text>
              {overrideIssues.map((issue) => (
                <Text key={issue.id} style={styles.overrideText}>{issue.summary}{issue.detail ? ` ${issue.detail}` : ''}</Text>
              ))}
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
        sourceLabel={detailSource ? formatSourceLabel(detailSource) : null}
        spellcastingAbility={detailSource?.spellcastingAbility ?? null}
        actionLabel={action.label}
        actionDisabled={action.disabled}
        helperText={action.helper}
        onClose={() => setDetailTarget(null)}
        onPrimaryAction={() => detailSpell ? applySpellAction(detailSpell, detailSource, action.target) : undefined}
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
  sourceGuideList: {
    gap: theme.spacing.sm,
  },
  sourceGuideCard: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  sourceGuideHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  sourceGuideHeaderCopy: {
    flex: 1,
    gap: 3,
  },
  sourceGuideTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  sourceGuideMeta: {
    color: theme.colors.textMuted,
    ...typography.meta,
  },
  sourceStatusBadge: {
    backgroundColor: theme.colors.surfaceSuccess,
    borderColor: theme.colors.accentSuccess,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sourceStatusBadgeFix: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.danger,
  },
  sourceStatusBadgeNeed: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.accentLegacy,
  },
  sourceStatusLabel: {
    color: theme.colors.accentSuccessSoft,
    fontSize: 11,
    fontWeight: '800',
  },
  sourceStatusLabelFix: {
    color: theme.colors.danger,
  },
  sourceFactList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  sourceFact: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
  sourceIssueList: {
    gap: 4,
  },
  sourceIssueText: {
    color: theme.colors.accentLegacySoft,
    ...typography.meta,
    fontWeight: '700',
  },
  spellList: {
    gap: theme.spacing.sm,
  },
  tabGuidance: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
  emptyText: {
    color: theme.colors.textMuted,
    ...typography.bodySm,
  },
  issueList: {
    gap: theme.spacing.sm,
  },
  issueCard: {
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    gap: 4,
    padding: theme.spacing.md,
  },
  issueCardFix: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.danger,
  },
  issueCardNeed: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.accentLegacy,
  },
  issueTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  issueTitleFix: {
    color: theme.colors.danger,
  },
  issueTitleNeed: {
    color: theme.colors.accentLegacySoft,
  },
  issueDetail: {
    color: theme.colors.textSecondary,
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
  overrideCard: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  overrideTitle: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  overrideText: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
});
