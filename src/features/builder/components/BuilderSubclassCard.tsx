import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getClassEditionBadge } from '@/features/builder/utils/classMetadata';
import type { ContentEntity } from '@/shared/types/domain';
import { theme } from '@/shared/ui/theme';

interface BuilderSubclassCardProps {
  subclass: ContentEntity;
  isLocked: boolean;
  isSelected: boolean;
  unlockLevel: number | null;
  onPress: () => void;
}

export function BuilderSubclassCard({ subclass, isLocked, isSelected, unlockLevel, onPress }: BuilderSubclassCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isSelected && styles.cardSelected,
        isLocked && styles.cardLocked,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, isSelected && styles.titleSelected]}>{subclass.name}</Text>
        <View style={[styles.editionBadge, subclass.isLegacy && styles.legacyBadge]}>
          <Text style={[styles.editionBadgeLabel, subclass.isLegacy && styles.legacyBadgeLabel]}>{getClassEditionBadge(subclass)}</Text>
        </View>
      </View>
      <View style={styles.stateRow}>
        {isSelected ? <Text style={styles.selectedLabel}>Selected</Text> : null}
        {isLocked ? <Text style={styles.lockedLabel}>Unlocks at level {unlockLevel ?? 3}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  cardPressed: {
    borderColor: theme.colors.accentPrimary,
  },
  cardSelected: {
    backgroundColor: theme.colors.accentPrimaryDeep,
    borderColor: theme.colors.accentPrimary,
  },
  cardLocked: {
    opacity: 0.85,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  title: {
    color: theme.colors.textPrimary,
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  titleSelected: {
    color: theme.colors.accentPrimarySoft,
  },
  editionBadge: {
    backgroundColor: theme.colors.accentPrimaryDeep,
    borderRadius: theme.radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 5,
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
  stateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  selectedLabel: {
    color: theme.colors.accentSuccessSoft,
    fontSize: 12,
    fontWeight: '800',
  },
  lockedLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
});
