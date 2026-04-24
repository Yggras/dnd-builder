import { useEffect, useMemo, useRef, useState } from 'react';

import { useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BuilderService } from '@/features/builder/services/BuilderService';
import type { BuilderDraftPayload } from '@/features/builder/types';
import { useCharacterRecord } from '@/features/characters/hooks/useCharacterRecord';
import { useSaveCharacterBuild } from '@/features/characters/hooks/useSaveCharacterBuild';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { Screen } from '@/shared/ui/Screen';
import type { BuilderStep, CharacterBuild } from '@/shared/types/domain';
import { theme, typography } from '@/shared/ui/theme';

const builderService = new BuilderService();

function isBuilderDraftPayload(value: Record<string, unknown>): value is BuilderDraftPayload {
  return typeof value.version === 'number' && value.version === 1;
}

export function CharacterBuilderScreen() {
  const params = useLocalSearchParams<{ characterId?: string | string[] }>();
  const characterId = Array.isArray(params.characterId) ? params.characterId[0] : params.characterId ?? '';
  const { data, error, isLoading } = useCharacterRecord(characterId);
  const saveBuildMutation = useSaveCharacterBuild();
  const [draftBuild, setDraftBuild] = useState<CharacterBuild | null>(null);
  const lastSavedSnapshot = useRef<string | null>(null);

  useEffect(() => {
    if (!data?.character || !data.build) {
      return;
    }

    const syncedBuild = {
      ...data.build,
      payload: isBuilderDraftPayload(data.build.payload)
        ? data.build.payload
        : builderService.createEmptyDraftPayload(data.character.name),
    } satisfies CharacterBuild;

    setDraftBuild(syncedBuild);
    lastSavedSnapshot.current = JSON.stringify(syncedBuild);
  }, [data]);

  useEffect(() => {
    if (!draftBuild) {
      return;
    }

    const nextSnapshot = JSON.stringify(draftBuild);

    if (nextSnapshot === lastSavedSnapshot.current) {
      return;
    }

    const timeoutId = setTimeout(() => {
      lastSavedSnapshot.current = nextSnapshot;
      saveBuildMutation.mutate(draftBuild, {
        onError: () => {
          lastSavedSnapshot.current = null;
        },
      });
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [draftBuild, saveBuildMutation]);

  const validationSummary = useMemo(() => {
    if (!draftBuild || !isBuilderDraftPayload(draftBuild.payload)) {
      return null;
    }

    return builderService.summarizeIssues(draftBuild.payload.review.issues);
  }, [draftBuild]);

  if (isLoading) {
    return <LoadingState label="Loading builder draft..." />;
  }

  if (error) {
    return <ErrorState title="Builder unavailable" message={error instanceof Error ? error.message : 'Failed to load builder draft.'} />;
  }

  if (!data?.character || !data.build || !draftBuild || !isBuilderDraftPayload(draftBuild.payload)) {
    return <ErrorState title="Draft unavailable" message="The requested character draft could not be loaded from the local roster." />;
  }

  const payload = draftBuild.payload;

  const updateCurrentStep = (step: BuilderStep) => {
    setDraftBuild((currentBuild) => (currentBuild ? { ...currentBuild, currentStep: step } : currentBuild));
  };

  const updateCharacterName = (name: string) => {
    setDraftBuild((currentBuild) => {
      if (!currentBuild || !isBuilderDraftPayload(currentBuild.payload)) {
        return currentBuild;
      }

      return {
        ...currentBuild,
        payload: {
          ...currentBuild.payload,
          characteristicsStep: {
            ...currentBuild.payload.characteristicsStep,
            name,
          },
        },
      };
    });
  };

  const updateNotes = (notes: string) => {
    setDraftBuild((currentBuild) => {
      if (!currentBuild || !isBuilderDraftPayload(currentBuild.payload)) {
        return currentBuild;
      }

      return {
        ...currentBuild,
        payload: {
          ...currentBuild.payload,
          notesStep: {
            notes,
          },
        },
      };
    });
  };

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.eyebrow}>Builder Shell</Text>
        <Text style={styles.title}>{payload.characteristicsStep.name || data.character.name}</Text>
        <Text style={styles.subtitle}>
          This shell loads and resumes the draft, autosaves changes locally, and keeps the step flow aligned with the `9a` contract while deeper step logic lands in later slices.
        </Text>

        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, draftBuild.buildState === 'complete' && styles.completeBadge]}>
            <Text style={[styles.statusBadgeLabel, draftBuild.buildState === 'complete' && styles.completeBadgeLabel]}>
              {draftBuild.buildState === 'complete' ? 'Complete' : 'Draft'}
            </Text>
          </View>
          <Text style={styles.statusText}>{saveBuildMutation.isPending ? 'Saving...' : 'Autosave ready'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Step navigation</Text>
        <View style={styles.stepGrid}>
          {builderService.steps.map((step) => {
            const isActive = step === draftBuild.currentStep;

            return (
              <Pressable
                accessibilityRole="button"
                key={step}
                onPress={() => updateCurrentStep(step)}
                style={({ pressed }) => [styles.stepChip, isActive && styles.stepChipActive, pressed && styles.stepChipPressed]}
              >
                <Text style={[styles.stepChipLabel, isActive && styles.stepChipLabelActive]}>{step}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Draft basics</Text>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Character name</Text>
          <TextInput
            autoCapitalize="words"
            autoCorrect={false}
            onChangeText={updateCharacterName}
            placeholder="Character name"
            placeholderTextColor={theme.colors.textFaint}
            style={styles.input}
            value={payload.characteristicsStep.name}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Notes</Text>
          <TextInput
            multiline
            onChangeText={updateNotes}
            placeholder="Optional reminders, ideas, or follow-up notes."
            placeholderTextColor={theme.colors.textFaint}
            style={[styles.input, styles.notesInput]}
            textAlignVertical="top"
            value={payload.notesStep.notes ?? ''}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Validation contract</Text>
        <View style={styles.validationGrid}>
          <View style={styles.validationCard}>
            <Text style={styles.validationLabel}>Blockers</Text>
            <Text style={styles.validationValue}>{validationSummary?.blockers.length ?? 0}</Text>
          </View>
          <View style={styles.validationCard}>
            <Text style={styles.validationLabel}>Checklist</Text>
            <Text style={styles.validationValue}>{validationSummary?.checklistItems.length ?? 0}</Text>
          </View>
          <View style={styles.validationCard}>
            <Text style={styles.validationLabel}>Notices</Text>
            <Text style={styles.validationValue}>{validationSummary?.notices.length ?? 0}</Text>
          </View>
          <View style={styles.validationCard}>
            <Text style={styles.validationLabel}>Overrides</Text>
            <Text style={styles.validationValue}>{validationSummary?.overrides.length ?? 0}</Text>
          </View>
        </View>
        <Text style={styles.validationHint}>
          Completion is currently contract-driven: a character can complete only when no unresolved blockers or checklist items remain.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xl,
  },
  headerCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  eyebrow: {
    color: theme.colors.accentPrimarySoft,
    ...typography.eyebrow,
  },
  title: {
    color: theme.colors.textPrimary,
    ...typography.titleLg,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statusBadge: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  completeBadge: {
    backgroundColor: theme.colors.accentSuccess,
    borderColor: theme.colors.accentSuccessSoft,
  },
  statusBadgeLabel: {
    color: theme.colors.textSecondary,
    ...typography.meta,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  completeBadgeLabel: {
    color: theme.colors.backgroundDeep,
  },
  statusText: {
    color: theme.colors.textMuted,
    ...typography.meta,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    ...typography.sectionTitle,
  },
  stepGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  stepChip: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  stepChipActive: {
    backgroundColor: theme.colors.accentPrimaryDeep,
    borderColor: theme.colors.accentPrimary,
  },
  stepChipPressed: {
    borderColor: theme.colors.accentPrimary,
  },
  stepChipLabel: {
    color: theme.colors.textSecondary,
    ...typography.meta,
    fontWeight: '700',
  },
  stepChipLabelActive: {
    color: theme.colors.accentPrimarySoft,
  },
  fieldGroup: {
    gap: theme.spacing.sm,
  },
  fieldLabel: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    color: theme.colors.textPrimary,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
  },
  notesInput: {
    minHeight: 132,
  },
  validationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  validationCard: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    gap: 4,
    minWidth: '47%',
    padding: theme.spacing.sm,
  },
  validationLabel: {
    color: theme.colors.textMuted,
    ...typography.meta,
    textTransform: 'uppercase',
  },
  validationValue: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  validationHint: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
});
