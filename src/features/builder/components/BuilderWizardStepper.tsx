import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WIZARD_PHASES, type BuilderWizardPhaseId, type WizardPhaseStatus } from '@/features/builder/hooks/useBuilderController';
import { theme, typography } from '@/shared/ui/theme';

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

          return (
            <Pressable
              accessibilityRole="button"
              key={phase.id}
              onPress={() => onPhaseSelect(phase.id)}
              style={({ pressed }) => [styles.phaseChip, isActive && styles.phaseChipActive, pressed && styles.phaseChipPressed]}
            >
              <View style={styles.phaseLabelContainer}>
                <Text style={[styles.phaseLabel, isActive && styles.phaseLabelActive]}>{phase.label}</Text>
                {status === 'complete' && <View style={[styles.statusIndicator, styles.statusComplete]} />}
                {status === 'warning' && <View style={[styles.statusIndicator, styles.statusWarning]} />}
                {status === 'error' && <View style={[styles.statusIndicator, styles.statusError]} />}
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
    borderRadius: 4,
    height: 8,
    width: 8,
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
});
