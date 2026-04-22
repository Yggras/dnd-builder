import type { ReactNode } from 'react';

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme, typography } from '@/shared/ui/theme';

interface SurfaceCardProps {
  title: string;
  description?: string;
  meta?: string;
  badge?: string;
  icon?: ReactNode;
  onPress: () => void;
}

export function SurfaceCard({ title, description, meta, badge, icon, onPress }: SurfaceCardProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>{icon}</View>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeLabel}>{badge}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>

      <View style={styles.footer}>
        {meta ? <Text style={styles.meta}>{meta}</Text> : <View />}
        <Text style={styles.action}>Open</Text>
      </View>
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
    minHeight: 164,
    padding: theme.spacing.md,
  },
  cardPressed: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.accentPrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderAccent,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  badge: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeLabel: {
    color: theme.colors.accentLegacySoft,
    ...typography.meta,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  body: {
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.textPrimary,
    ...typography.sectionTitle,
  },
  description: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  meta: {
    color: theme.colors.textMuted,
    ...typography.meta,
    fontWeight: '600',
  },
  action: {
    color: theme.colors.accentPrimarySoft,
    ...typography.meta,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
