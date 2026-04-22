import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/shared/ui/Screen';
import { theme, typography } from '@/shared/ui/theme';

interface LoadingStateProps {
  label: string;
}

export function LoadingState({ label }: LoadingStateProps) {
  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.panel}>
        <ActivityIndicator color={theme.colors.accentPrimary} size="large" />
        <Text style={styles.label}>{label}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  panel: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: 12,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  label: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
});
