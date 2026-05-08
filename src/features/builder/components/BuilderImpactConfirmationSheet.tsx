import { StyleSheet, Text, View } from 'react-native';

import { BuilderChoiceSheet } from '@/features/builder/components/BuilderChoiceSheet';
import { theme, typography } from '@/shared/ui/theme';

interface BuilderImpactConfirmationSheetProps {
  visible: boolean;
  title: string;
  message: string;
  impacts: readonly string[];
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function BuilderImpactConfirmationSheet({
  visible,
  title,
  message,
  impacts,
  confirmLabel = 'Confirm',
  onCancel,
  onConfirm,
}: BuilderImpactConfirmationSheetProps) {
  return (
    <BuilderChoiceSheet
      visible={visible}
      title={title}
      subtitle="Confirm builder impact"
      onClose={onCancel}
      primaryAction={{ label: confirmLabel, onPress: onConfirm, destructive: true }}
      secondaryAction={{ label: 'Cancel', onPress: onCancel }}
    >
      <View style={styles.content}>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.impactList}>
          {impacts.map((impact) => (
            <View key={impact} style={styles.impactRow}>
              <Text style={styles.impactBullet}>•</Text>
              <Text style={styles.impactText}>{impact}</Text>
            </View>
          ))}
        </View>
      </View>
    </BuilderChoiceSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.md,
  },
  message: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
  impactList: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  impactRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  impactBullet: {
    color: theme.colors.accentLegacySoft,
    fontSize: 18,
    lineHeight: 22,
  },
  impactText: {
    color: theme.colors.textPrimary,
    flex: 1,
    ...typography.bodySm,
    fontWeight: '700',
  },
});
