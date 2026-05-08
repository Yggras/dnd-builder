import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ContentEntity } from '@/shared/types/domain';
import { theme } from '@/shared/ui/theme';

interface BuilderFeatureOptionRowProps {
  option: ContentEntity;
  isSelected: boolean;
  onPress: () => void;
}

export function BuilderFeatureOptionRow({ option, isSelected, onPress }: BuilderFeatureOptionRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, isSelected && styles.rowSelected, pressed && styles.rowPressed]}
    >
      <Text style={[styles.title, isSelected && styles.titleSelected]}>{option.name}</Text>
      {isSelected ? (
        <View style={styles.selectedBadge}>
          <Text style={styles.selectedBadgeLabel}>Selected</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  rowPressed: {
    borderColor: theme.colors.accentPrimary,
  },
  rowSelected: {
    backgroundColor: theme.colors.accentPrimaryDeep,
    borderColor: theme.colors.accentPrimary,
  },
  title: {
    color: theme.colors.textPrimary,
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  titleSelected: {
    color: theme.colors.accentPrimarySoft,
  },
  selectedBadge: {
    backgroundColor: theme.colors.surfaceSuccess,
    borderColor: theme.colors.accentSuccess,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  selectedBadgeLabel: {
    color: theme.colors.accentSuccessSoft,
    fontSize: 11,
    fontWeight: '800',
  },
});
