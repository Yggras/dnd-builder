import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme, typography } from '@/shared/ui/theme';

interface SurfaceCardProps {
  title: string;
  description: string;
  onPress: () => void;
}

export function SurfaceCard({ title, description, onPress }: SurfaceCardProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.action}>Open</Text>
      </View>
      <Text style={styles.description}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  cardPressed: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.accentPrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  title: {
    color: theme.colors.textPrimary,
    ...typography.sectionTitle,
  },
  description: {
    color: theme.colors.textMuted,
    ...typography.bodySm,
  },
  action: {
    color: theme.colors.accentPrimarySoft,
    ...typography.meta,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
