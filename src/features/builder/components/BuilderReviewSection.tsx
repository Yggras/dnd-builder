import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { BuilderDraftPayload, BuilderValidationSummary } from '@/features/builder/types';
import type { BuilderIssueGroup } from '@/features/builder/utils/review';
import type { BuilderStep } from '@/shared/types/domain';
import { theme, typography } from '@/shared/ui/theme';

type BuilderReviewSectionProps = {
  completionMessage: string | null;
  isCompletingBuild: boolean;
  onCompleteBuild: () => void;
  reviewIssueGroups: BuilderIssueGroup[];
  saveIsPending: boolean;
  validationSummary: BuilderValidationSummary | null;
  payload: BuilderDraftPayload;
  formatStepLabel: (step: BuilderStep) => string;
};

export function BuilderReviewSection({
  completionMessage,
  formatStepLabel,
  isCompletingBuild,
  onCompleteBuild,
  payload,
  reviewIssueGroups,
  saveIsPending,
  validationSummary,
}: BuilderReviewSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Review</Text>
        <Text style={styles.sectionMeta}>{validationSummary?.canComplete ? 'Ready' : 'In progress'}</Text>
      </View>
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

      {payload.review.sourceSummary.sourceCodes.length > 0 ? (
        <View style={styles.reviewPanel}>
          <Text style={styles.reviewTitle}>Source summary</Text>
          <Text style={styles.reviewText}>Sources: {payload.review.sourceSummary.sourceCodes.join(', ')}</Text>
          <Text style={styles.reviewText}>Editions: {payload.review.sourceSummary.editionsUsed.join(', ') || 'None yet'}</Text>
          <Text style={styles.reviewText}>
            {payload.review.sourceSummary.usesLegacyContent ? 'Legacy content is in use.' : 'No legacy content selected.'}
          </Text>
        </View>
      ) : null}

      {reviewIssueGroups.length > 0 ? (
        <View style={styles.issueList}>
          {reviewIssueGroups.map((group) => (
            <View key={group.key} style={styles.reviewPanel}>
              <Text style={styles.reviewTitle}>{group.title}</Text>
              <View style={styles.issueList}>
                {group.issues.map((issue, index) => (
                  <View key={`${group.key}-${issue.id}-${index}`} style={styles.issueCard}>
                    <Text style={styles.issueTitle}>{issue.summary}</Text>
                    <Text style={styles.issueMeta}>
                      {formatStepLabel(issue.step)} • {issue.category}
                    </Text>
                    <Text style={styles.issueDetail}>{issue.detail}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {completionMessage ? <Text style={styles.emptyHint}>{completionMessage}</Text> : null}

      <Pressable
        accessibilityRole="button"
        disabled={!validationSummary?.canComplete || isCompletingBuild || saveIsPending}
        onPress={onCompleteBuild}
        style={({ pressed }) => [
          styles.completeButton,
          pressed && styles.addClassButtonPressed,
          (!validationSummary?.canComplete || isCompletingBuild || saveIsPending) && styles.addClassButtonDisabled,
        ]}
      >
        <Text style={styles.addClassButtonLabel}>{isCompletingBuild ? 'Completing...' : 'Complete Character'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  addClassButtonDisabled: {
    opacity: 0.45,
  },
  addClassButtonLabel: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  addClassButtonPressed: {
    opacity: 0.85,
  },
  completeButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.accentPrimary,
    borderColor: theme.colors.accentPrimarySoft,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyHint: {
    color: theme.colors.textMuted,
    ...typography.bodySm,
  },
  issueCard: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
  },
  issueDetail: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
  issueList: {
    gap: theme.spacing.sm,
  },
  issueMeta: {
    color: theme.colors.textMuted,
    ...typography.meta,
  },
  issueTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  reviewPanel: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  reviewText: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
  reviewTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  sectionHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  sectionMeta: {
    color: theme.colors.textMuted,
    ...typography.meta,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    ...typography.sectionTitle,
  },
  validationCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minWidth: 72,
    padding: theme.spacing.sm,
  },
  validationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  validationHint: {
    color: theme.colors.textMuted,
    ...typography.bodySm,
  },
  validationLabel: {
    color: theme.colors.textMuted,
    ...typography.meta,
    textTransform: 'uppercase',
  },
  validationValue: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
});
