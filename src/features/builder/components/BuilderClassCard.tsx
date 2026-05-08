import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getClassEditionBadge } from '@/features/builder/utils/classMetadata';
import type { ContentEntity } from '@/shared/types/domain';
import { theme } from '@/shared/ui/theme';

interface BuilderClassCardProps {
  classEntity: ContentEntity;
  onPress: () => void;
}

export function BuilderClassCard({ classEntity, onPress }: BuilderClassCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>{classEntity.name}</Text>
        <View style={[styles.editionBadge, classEntity.isLegacy && styles.legacyBadge]}>
          <Text style={[styles.editionBadgeLabel, classEntity.isLegacy && styles.legacyBadgeLabel]}>{getClassEditionBadge(classEntity)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  cardPressed: {
    borderColor: theme.colors.accentPrimary,
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
    fontSize: 18,
    fontWeight: '800',
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
});
