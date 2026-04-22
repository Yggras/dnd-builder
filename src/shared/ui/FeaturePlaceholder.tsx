import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/shared/ui/Screen';
import { theme, typography } from '@/shared/ui/theme';

interface FeaturePlaceholderProps {
  title: string;
  summary: string;
  bullets: string[];
}

export function FeaturePlaceholder({ title, summary, bullets }: FeaturePlaceholderProps) {
  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Future Surface</Text>
        <Text style={styles.kicker}>Prepared for the next campaign system milestone.</Text>
      </View>
      <View style={styles.panel}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.summary}>{summary}</Text>
        <View style={styles.bullets}>
          {bullets.map((bullet) => (
            <View key={bullet} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bullet}>{bullet}</Text>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    minHeight: '100%',
  },
  hero: {
    gap: theme.spacing.xs,
  },
  panel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
  },
  eyebrow: {
    color: theme.colors.accentPrimarySoft,
    ...typography.eyebrow,
  },
  kicker: {
    color: theme.colors.textMuted,
    ...typography.bodySm,
  },
  title: {
    color: theme.colors.textPrimary,
    ...typography.titleMd,
  },
  summary: {
    color: theme.colors.textSecondary,
    ...typography.body,
  },
  bullets: {
    gap: theme.spacing.sm,
  },
  bulletRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  bulletDot: {
    backgroundColor: theme.colors.accentPrimary,
    borderRadius: theme.radii.pill,
    height: 8,
    marginTop: 7,
    width: 8,
  },
  bullet: {
    color: theme.colors.textMuted,
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
});
