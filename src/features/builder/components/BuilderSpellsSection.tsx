import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { BuilderDraftPayload } from '@/features/builder/types';
import { summarizeSpellcasting } from '@/features/builder/utils/spellReview';
import type { ContentEntity } from '@/shared/types/domain';
import { theme, typography } from '@/shared/ui/theme';

type BuilderSpellsSectionProps = {
  payload: BuilderDraftPayload;
  selectedCantripCount: number;
  selectedKnownLeveledCount: number;
  selectedPreparedCount: number;
  spellSearch: string;
  spellSummary: ReturnType<typeof summarizeSpellcasting>;
  updateKnownSpellSelection: (spellId: string) => void;
  updatePreparedSpellSelection: (spellId: string) => void;
  updateSpellExceptionNotes: (notes: string) => void;
  visibleSpellResults: ContentEntity[];
  onSpellSearchChange: (value: string) => void;
};

export function BuilderSpellsSection({
  payload,
  selectedCantripCount,
  selectedKnownLeveledCount,
  selectedPreparedCount,
  spellSearch,
  spellSummary,
  updateKnownSpellSelection,
  updatePreparedSpellSelection,
  updateSpellExceptionNotes,
  visibleSpellResults,
  onSpellSearchChange,
}: BuilderSpellsSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Spells</Text>
        <Text style={styles.sectionMeta}>
          {spellSummary.isCaster
            ? [
                `Cantrips ${selectedCantripCount}/${spellSummary.cantripLimit}`,
                spellSummary.usesKnownSpells ? `Known ${selectedKnownLeveledCount}/${spellSummary.knownSpellLimit}` : null,
                spellSummary.usesPreparedSpells ? `Prepared ${selectedPreparedCount}/${spellSummary.preparedSpellLimit}` : null,
              ]
                .filter(Boolean)
                .join(' • ')
            : 'No spellcasting'}
        </Text>
      </View>

      {spellSummary.isCaster ? (
        <>
          <Text style={styles.sectionBodyText}>
            Select spells from the structured class and subclass spell lists. Current maximum spell level: {spellSummary.maxSpellLevel}.{' '}
            {spellSummary.usesKnownSpells ? `Known leveled spells ${selectedKnownLeveledCount}/${spellSummary.knownSpellLimit}. ` : ''}
            {spellSummary.usesPreparedSpells ? `Prepared spells ${selectedPreparedCount}/${spellSummary.preparedSpellLimit}.` : ''}
          </Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={onSpellSearchChange}
            placeholder="Search applicable spells"
            placeholderTextColor={theme.colors.textFaint}
            style={styles.input}
            value={spellSearch}
          />
          <View style={styles.searchResults}>
            {visibleSpellResults.map((spell) => {
              const isSelected = payload.spellsStep.selectedSpellIds.includes(spell.id);
              const isPrepared = payload.spellsStep.preparedSpellIds.includes(spell.id);
              const spellLevel = Number(spell.metadata.level ?? 0);

              return (
                <View key={spell.id} style={[styles.searchResultRow, (isSelected || isPrepared) && styles.optionChipActive]}>
                  <View style={styles.spellResultHeader}>
                    <View style={styles.spellResultHeading}>
                      <Text style={[styles.searchResultTitle, (isSelected || isPrepared) && styles.optionChipLabelActive]}>
                        {spell.name}
                      </Text>
                      <Text style={styles.searchResultMeta}>
                        Level {String(spell.metadata.level ?? 0)} • {spell.sourceCode}
                      </Text>
                    </View>
                    <View style={styles.spellActionRow}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => updateKnownSpellSelection(spell.id)}
                        style={({ pressed }) => [
                          styles.spellActionButton,
                          isSelected && styles.spellActionButtonActive,
                          pressed && styles.optionChipPressed,
                        ]}
                      >
                        <Text style={[styles.spellActionLabel, isSelected && styles.spellActionLabelActive]}>
                          {spellLevel === 0 ? 'Cantrip' : spellSummary.usesKnownSpells ? 'Known' : 'Track'}
                        </Text>
                      </Pressable>
                      {spellLevel > 0 && spellSummary.usesPreparedSpells ? (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => updatePreparedSpellSelection(spell.id)}
                          style={({ pressed }) => [
                            styles.spellActionButton,
                            isPrepared && styles.spellActionButtonActive,
                            pressed && styles.optionChipPressed,
                          ]}
                        >
                          <Text style={[styles.spellActionLabel, isPrepared && styles.spellActionLabelActive]}>Prepared</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
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
      ) : (
        <Text style={styles.sectionBodyText}>This build does not currently require spell selection.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  optionChipActive: {
    backgroundColor: theme.colors.accentPrimaryDeep,
    borderColor: theme.colors.accentPrimary,
  },
  optionChipLabelActive: {
    color: theme.colors.accentPrimarySoft,
  },
  optionChipPressed: {
    opacity: 0.85,
  },
  searchResultMeta: {
    color: theme.colors.textMuted,
    ...typography.meta,
  },
  searchResults: {
    gap: theme.spacing.sm,
  },
  searchResultRow: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    gap: 4,
    padding: theme.spacing.sm,
  },
  searchResultTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
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
  spellActionButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 32,
    paddingHorizontal: theme.spacing.sm,
  },
  spellActionButtonActive: {
    backgroundColor: theme.colors.accentPrimaryDeep,
    borderColor: theme.colors.accentPrimary,
  },
  spellActionLabel: {
    color: theme.colors.textSecondary,
    ...typography.meta,
    fontWeight: '700',
  },
  spellActionLabelActive: {
    color: theme.colors.accentPrimarySoft,
  },
  spellActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    justifyContent: 'flex-end',
  },
  spellResultHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  spellResultHeading: {
    flex: 1,
    gap: 4,
  },
});
