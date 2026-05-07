import { useEffect, useRef } from 'react';

import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme, typography } from '@/shared/ui/theme';

interface BuilderWizardNavigationProps {
  activePhaseIndex: number;
  totalPhases: number;
  canComplete: boolean;
  isCompletingBuild: boolean;
  isBuildSuccess?: boolean;
  goToPreviousPhase: () => void;
  goToNextPhase: () => void;
  onCompleteBuild: () => void;
}

export function BuilderWizardNavigation({
  activePhaseIndex,
  totalPhases,
  canComplete,
  isCompletingBuild,
  isBuildSuccess,
  goToPreviousPhase,
  goToNextPhase,
  onCompleteBuild,
}: BuilderWizardNavigationProps) {
  const isFirstPhase = activePhaseIndex === 0;
  const isLastPhase = activePhaseIndex === totalPhases - 1;
  const isFinishDisabled = !canComplete || isCompletingBuild || Boolean(isBuildSuccess);
  const successOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isBuildSuccess) {
      successOpacity.setValue(0);
      return;
    }

    Animated.timing(successOpacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [isBuildSuccess, successOpacity]);

  return (
    <View style={styles.container}>
      {isBuildSuccess ? (
        <Animated.View style={[styles.successPanel, { opacity: successOpacity }]}>
          <Text style={styles.successText}>Build saved. Opening preview...</Text>
        </Animated.View>
      ) : null}
      <View style={styles.buttonRow}>
        <View style={styles.buttonContainer}>
          {!isFirstPhase && (
            <Pressable
              accessibilityRole="button"
              onPress={goToPreviousPhase}
              style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            >
              <Text style={styles.backButtonLabel}>Back</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.buttonContainer}>
          {isLastPhase ? (
            <Pressable
              accessibilityRole="button"
              disabled={isFinishDisabled}
              onPress={onCompleteBuild}
              style={({ pressed }) => [
                styles.nextButton,
                styles.finishButton,
                pressed && styles.finishButtonPressed,
                isFinishDisabled && styles.nextButtonDisabled,
              ]}
            >
              <Text style={styles.finishButtonLabel}>
                {isBuildSuccess ? 'Successfully built!' : isCompletingBuild ? 'Completing...' : 'Finish Build'}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={goToNextPhase}
              style={({ pressed }) => [styles.nextButton, pressed && styles.nextButtonPressed]}
            >
              <Text style={styles.nextButtonLabel}>Next</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.borderSubtle,
    borderTopWidth: 1,
    padding: theme.spacing.lg,
  },
  buttonRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: theme.spacing.xl,
  },
  backButtonPressed: {
    backgroundColor: theme.colors.surfaceAccent,
  },
  backButtonLabel: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  nextButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: theme.spacing.xl,
  },
  nextButtonPressed: {
    backgroundColor: theme.colors.borderStrong,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonLabel: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  finishButton: {
    backgroundColor: theme.colors.accentSuccess,
    borderColor: theme.colors.accentSuccessSoft,
  },
  finishButtonPressed: {
    backgroundColor: theme.colors.accentSuccessSoft,
  },
  finishButtonLabel: {
    color: theme.colors.backgroundDeep,
    fontSize: 16,
    fontWeight: '700',
  },
  successPanel: {
    alignItems: 'center',
    backgroundColor: theme.colors.accentSuccess,
    borderColor: theme.colors.accentSuccessSoft,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  successText: {
    color: theme.colors.backgroundDeep,
    ...typography.bodySm,
    fontWeight: '700',
  },
});
