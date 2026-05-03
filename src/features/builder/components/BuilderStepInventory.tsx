import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { BuilderDraftPayload } from '@/features/builder/types';
import type { ContentEntity } from '@/shared/types/domain';
import type { StartingEquipmentOptionGroup } from '@/features/builder/utils/inventory';
import { theme, typography } from '@/shared/ui/theme';

interface BuilderStepInventoryProps {
  payload: BuilderDraftPayload;
  inventoryImpactSummary: string | null;
  startingEquipmentOptionGroups: readonly StartingEquipmentOptionGroup[];
  updateStartingEquipmentChoice: (sourceType: 'class' | 'background', sourceId: string, bundleIndex: number, optionKey: string) => void;
  applyInventorySeed: () => void;
  inventorySearch: string;
  setInventorySearch: (search: string) => void;
  itemSearchResults: readonly ContentEntity[];
  addManualItem: (itemId: string) => void;
  itemEntitiesById: Record<string, ContentEntity>;
  updateInventoryEntry: (
    itemId: string,
    source: 'starting-equipment' | 'manual-selection',
    updater: (entry: BuilderDraftPayload['inventoryStep']['entries'][number]) => BuilderDraftPayload['inventoryStep']['entries'][number] | null,
  ) => void;
}

export function BuilderStepInventory({
  payload,
  inventoryImpactSummary,
  startingEquipmentOptionGroups,
  updateStartingEquipmentChoice,
  applyInventorySeed,
  inventorySearch,
  setInventorySearch,
  itemSearchResults,
  addManualItem,
  itemEntitiesById,
  updateInventoryEntry,
}: BuilderStepInventoryProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Inventory</Text>
        <Text style={styles.sectionMeta}>Seed and edit gear</Text>
      </View>

      {inventoryImpactSummary ? <Text style={styles.impactBanner}>{inventoryImpactSummary}</Text> : null}

      {startingEquipmentOptionGroups.map((group) => {
        const selectedOption = payload.inventoryStep.selectedStartingEquipment.find(
          (selection) => selection.sourceType === group.sourceType && selection.sourceId === group.sourceId && selection.bundleIndex === group.bundleIndex,
        )?.optionKey;

        return (
          <View key={`${group.sourceType}-${group.sourceId}-${group.bundleIndex}`} style={styles.optionBlock}>
            <Text style={styles.optionBlockLabel}>{group.title}</Text>
            <View style={styles.optionChipWrap}>
              {group.choices.map((choice) => {
                const isSelected = (selectedOption ?? group.choices[0]?.optionKey) === choice.optionKey;
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={choice.optionKey}
                    onPress={() => updateStartingEquipmentChoice(group.sourceType, group.sourceId, group.bundleIndex, choice.optionKey)}
                    style={({ pressed }) => [styles.optionChip, isSelected && styles.optionChipActive, pressed && styles.optionChipPressed]}
                  >
                    <Text style={[styles.optionChipLabel, isSelected && styles.optionChipLabelActive]}>{choice.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}

      <Pressable accessibilityRole="button" onPress={applyInventorySeed} style={({ pressed }) => [styles.addClassButton, pressed && styles.addClassButtonPressed]}>
        <Text style={styles.addClassButtonLabel}>{payload.inventoryStep.entries.some((entry) => entry.source === 'starting-equipment') ? 'Reseed Starting Equipment' : 'Seed Starting Equipment'}</Text>
      </Pressable>

      <View style={styles.currencyRow}>
        <Text style={styles.optionBlockLabel}>Starting currency</Text>
        <Text style={styles.currencyValue}>
          {payload.inventoryStep.startingCurrency.gp} gp, {payload.inventoryStep.startingCurrency.sp} sp, {payload.inventoryStep.startingCurrency.cp} cp
        </Text>
      </View>

      {payload.inventoryStep.unresolvedStartingGear.length > 0 ? (
        <View style={styles.unresolvedPanel}>
          <Text style={styles.unresolvedTitle}>Unresolved starting gear</Text>
          {payload.inventoryStep.unresolvedStartingGear.map((entry) => (
            <Text key={entry} style={styles.unresolvedItem}>
              {entry}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.optionBlock}>
        <Text style={styles.optionBlockLabel}>Add canonical items</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setInventorySearch}
          placeholder="Search equipment or magic items"
          placeholderTextColor={theme.colors.textFaint}
          style={styles.input}
          value={inventorySearch}
        />
        {inventorySearch.trim().length > 0 ? (
          <View style={styles.searchResults}>
            {itemSearchResults.slice(0, 12).map((item) => (
              <Pressable
                accessibilityRole="button"
                key={item.id}
                onPress={() => addManualItem(item.id)}
                style={({ pressed }) => [styles.searchResultRow, pressed && styles.optionChipPressed]}
              >
                <Text style={styles.searchResultTitle}>{item.name}</Text>
                <Text style={styles.searchResultMeta}>{item.sourceCode}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.inventoryList}>
        {payload.inventoryStep.entries.map((entry) => {
          const item = itemEntitiesById[entry.itemId];
          return (
            <View key={`${entry.itemId}-${entry.source}`} style={styles.inventoryCard}>
              <View style={styles.inventoryHeader}>
                <View style={styles.inventoryHeading}>
                  <Text style={styles.inventoryTitle}>{item?.name ?? entry.itemId}</Text>
                  <Text style={styles.inventoryMeta}>{entry.source === 'starting-equipment' ? 'Seeded gear' : 'Manual add'}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => updateInventoryEntry(entry.itemId, entry.source, () => null)}
                  style={({ pressed }) => [styles.removeButton, pressed && styles.removeButtonPressed]}
                >
                  <Text style={styles.removeButtonLabel}>Remove</Text>
                </Pressable>
              </View>
              <View style={styles.levelControls}>
                <Pressable accessibilityRole="button" onPress={() => updateInventoryEntry(entry.itemId, entry.source, (current) => ({ ...current, quantity: Math.max(1, current.quantity - 1) }))} style={({ pressed }) => [styles.levelButton, pressed && styles.levelButtonPressed]}>
                  <Text style={styles.levelButtonLabel}>-</Text>
                </Pressable>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeLabel}>Qty {entry.quantity}</Text>
                </View>
                <Pressable accessibilityRole="button" onPress={() => updateInventoryEntry(entry.itemId, entry.source, (current) => ({ ...current, quantity: current.quantity + 1 }))} style={({ pressed }) => [styles.levelButton, pressed && styles.levelButtonPressed]}>
                  <Text style={styles.levelButtonLabel}>+</Text>
                </Pressable>
              </View>
              <View style={styles.optionChipWrap}>
                <Pressable accessibilityRole="button" onPress={() => updateInventoryEntry(entry.itemId, entry.source, (current) => ({ ...current, equipped: !current.equipped }))} style={({ pressed }) => [styles.optionChip, entry.equipped && styles.optionChipActive, pressed && styles.optionChipPressed]}>
                  <Text style={[styles.optionChipLabel, entry.equipped && styles.optionChipLabelActive]}>Equipped</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => updateInventoryEntry(entry.itemId, entry.source, (current) => ({ ...current, attuned: !current.attuned }))} style={({ pressed }) => [styles.optionChip, entry.attuned && styles.optionChipActive, pressed && styles.optionChipPressed]}>
                  <Text style={[styles.optionChipLabel, entry.attuned && styles.optionChipLabelActive]}>Attuned</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    ...typography.sectionTitle,
  },
  sectionHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  sectionMeta: {
    color: theme.colors.textMuted,
    ...typography.meta,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  impactBanner: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderAccent,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    color: theme.colors.accentLegacySoft,
    fontSize: 14,
    lineHeight: 20,
    padding: theme.spacing.sm,
  },
  optionBlock: {
    gap: theme.spacing.sm,
  },
  optionBlockLabel: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  optionChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  optionChip: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  optionChipActive: {
    backgroundColor: theme.colors.accentPrimaryDeep,
    borderColor: theme.colors.accentPrimary,
  },
  optionChipPressed: {
    borderColor: theme.colors.accentPrimary,
  },
  optionChipLabel: {
    color: theme.colors.textSecondary,
    ...typography.meta,
    fontWeight: '700',
  },
  optionChipLabelActive: {
    color: theme.colors.accentPrimarySoft,
  },
  addClassButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.accentPrimary,
    borderColor: theme.colors.accentPrimarySoft,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
  },
  addClassButtonPressed: {
    backgroundColor: theme.colors.borderAccent,
  },
  addClassButtonLabel: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  currencyRow: {
    gap: 4,
  },
  currencyValue: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  unresolvedPanel: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderAccent,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  unresolvedTitle: {
    color: theme.colors.accentLegacySoft,
    fontSize: 14,
    fontWeight: '700',
  },
  unresolvedItem: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
  input: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    color: theme.colors.textPrimary,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
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
  searchResultMeta: {
    color: theme.colors.textMuted,
    ...typography.meta,
  },
  inventoryList: {
    gap: theme.spacing.md,
  },
  inventoryCard: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  inventoryHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  inventoryHeading: {
    flex: 1,
    gap: 4,
  },
  inventoryTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  inventoryMeta: {
    color: theme.colors.textMuted,
    ...typography.meta,
  },
  removeButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: theme.spacing.md,
  },
  removeButtonPressed: {
    borderColor: theme.colors.accentPrimary,
  },
  removeButtonLabel: {
    color: theme.colors.textSecondary,
    ...typography.meta,
    fontWeight: '700',
  },
  levelControls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  levelButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  levelButtonPressed: {
    borderColor: theme.colors.accentPrimary,
  },
  levelButtonLabel: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  levelBadge: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  levelBadgeLabel: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
});
