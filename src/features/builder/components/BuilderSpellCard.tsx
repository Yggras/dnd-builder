import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ContentEntity } from '@/shared/types/domain';
import { theme } from '@/shared/ui/theme';

interface BuilderSpellCardProps {
  spell: ContentEntity;
  stateLabel?: string | null;
  onPress: () => void;
}

export function BuilderSpellCard({ spell, stateLabel, onPress }: BuilderSpellCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, stateLabel && styles.cardSelected, pressed && styles.cardPressed]}
    >
      <Text style={[styles.title, stateLabel && styles.titleSelected]}>{spell.name}</Text>
      {stateLabel ? (
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>{stateLabel}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  cardPressed: {
    borderColor: theme.colors.accentPrimary,
  },
  cardSelected: {
    backgroundColor: theme.colors.accentPrimaryDeep,
    borderColor: theme.colors.accentPrimary,
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
  badge: {
    backgroundColor: theme.colors.surfaceSuccess,
    borderColor: theme.colors.accentSuccess,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeLabel: {
    color: theme.colors.accentSuccessSoft,
    fontSize: 11,
    fontWeight: '800',
  },
});
