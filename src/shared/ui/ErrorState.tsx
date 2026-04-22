import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/shared/ui/Screen';
import { theme, typography } from '@/shared/ui/theme';

interface ErrorStateProps {
  title: string;
  message: string;
}

export function ErrorState({ title, message }: ErrorStateProps) {
  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.panel}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
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
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderAccent,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    maxWidth: 480,
    padding: theme.spacing.xl,
    width: '100%',
  },
  title: {
    color: theme.colors.textPrimary,
    ...typography.sectionTitle,
    fontSize: 22,
  },
  message: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
});
