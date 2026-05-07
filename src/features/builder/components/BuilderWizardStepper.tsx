import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WIZARD_PHASES, type BuilderWizardPhaseId, type WizardPhaseStatus } from '@/features/builder/hooks/useBuilderController';
import { theme, typography } from '@/shared/ui/theme';

const statusLabels: Record<WizardPhaseStatus, string> = {
  complete: 'OK',
  warning: 'Need',
  error: 'Fix',
};

const statusAccessibilityLabels: Record<WizardPhaseStatus, string> = {
  complete: 'complete',
  warning: 'needs review',
  error: 'has blockers',
};

interface BuilderWizardStepperProps {
  activePhaseId: BuilderWizardPhaseId;
  getPhaseStatus: (phaseId: BuilderWizardPhaseId) => WizardPhaseStatus;
  onPhaseSelect: (phaseId: BuilderWizardPhaseId) => void;
}

export function BuilderWizardStepper({ activePhaseId, getPhaseStatus, onPhaseSelect }: BuilderWizardStepperProps) {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {WIZARD_PHASES.map((phase) => {
          const isActive = phase.id === activePhaseId;
          const status = getPhaseStatus(phase.id);
          const statusStyle =
            status === 'complete'
              ? styles.statusComplete
              : status === 'warning'
                ? styles.statusWarning
                : styles.statusError;

          return (
            <Pressable
              accessibilityLabel={`${phase.label}, ${statusAccessibilityLabels[status]}`}
              accessibilityRole="button"
              key={phase.id}
              onPress={() => onPhaseSelect(phase.id)}
              style={({ pressed }) => [styles.phaseChip, isActive && styles.phaseChipActive, pressed && styles.phaseChipPressed]}
            >
              <View style={styles.phaseLabelContainer}>
                <Text style={[styles.phaseLabel, isActive && styles.phaseLabelActive]}>{phase.label}</Text>
                <View style={[styles.statusIndicator, statusStyle]}>
                  <Text style={styles.statusIndicatorLabel}>{statusLabels[status]}</Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderBottomColor: theme.colors.borderSubtle,
    borderBottomWidth: 1,
    paddingVertical: theme.spacing.md,
  },
  scrollContent: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  phaseChip: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  phaseChipActive: {
    backgroundColor: theme.colors.accentPrimaryDeep,
    borderColor: theme.colors.accentPrimary,
  },
  phaseChipPressed: {
    borderColor: theme.colors.accentPrimary,
  },
  phaseLabelContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  phaseLabel: {
    color: theme.colors.textSecondary,
    ...typography.meta,
    fontWeight: '700',
  },
  phaseLabelActive: {
    color: theme.colors.accentPrimarySoft,
  },
  statusIndicator: {
    alignItems: 'center',
    borderRadius: theme.radii.pill,
    minWidth: 30,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  statusComplete: {
    backgroundColor: theme.colors.accentSuccess,
  },
  statusWarning: {
    backgroundColor: theme.colors.accentLegacySoft,
  },
  statusError: {
    backgroundColor: theme.colors.danger,
  },
  statusIndicatorLabel: {
    color: theme.colors.backgroundDeep,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
