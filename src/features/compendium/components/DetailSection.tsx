import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme, typography } from '@/shared/ui/theme';

interface DetailSectionProps extends PropsWithChildren {
  title?: string;
}

export function DetailSection({ children, title }: DetailSectionProps) {
  return (
    <View style={styles.section}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  title: {
    color: theme.colors.accentPrimarySoft,
    ...typography.eyebrow,
  },
});
