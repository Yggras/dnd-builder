import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BuilderFeatureOptionRow } from '@/features/builder/components/BuilderFeatureOptionRow';
import type { BuilderIssue } from '@/features/builder/types';
import { getGrantTitle } from '@/features/builder/utils/classStep';
import type { ChoiceGrant, ContentEntity } from '@/shared/types/domain';
import { theme, typography } from '@/shared/ui/theme';

interface BuilderFeatureChoiceGroupProps {
  grant: ChoiceGrant;
  options: readonly ContentEntity[];
  selectedOptionIds: readonly string[];
  issues: readonly BuilderIssue[];
  onOpenOption: (option: ContentEntity) => void;
  onOpenClassCompendium: () => void;
}

function getIssueStatus(issues: readonly BuilderIssue[]) {
  if (issues.some((issue) => issue.category === 'blocker' || issue.category === 'checklist')) {
    return 'Fix';
  }

  if (issues.some((issue) => issue.category === 'notice')) {
    return 'Need';
  }

  return 'OK';
}

export function BuilderFeatureChoiceGroup({
  grant,
  options,
  selectedOptionIds,
  issues,
  onOpenOption,
  onOpenClassCompendium,
}: BuilderFeatureChoiceGroupProps) {
  const status = getIssueStatus(issues);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{getGrantTitle(grant)}</Text>
          <Text style={styles.meta}>Level {grant.atLevel} • {selectedOptionIds.length}/{grant.count} selected</Text>
        </View>
        <View style={[styles.statusBadge, status === 'Fix' && styles.statusBadgeFix, status === 'Need' && styles.statusBadgeNeed]}>
          <Text style={[styles.statusBadgeLabel, status === 'Fix' && styles.statusBadgeLabelFix]}>{status}</Text>
        </View>
      </View>

      {issues.length > 0 ? (
        <View style={styles.issueList}>
          {issues.map((issue) => (
            <Text key={issue.id} style={styles.issueText}>{issue.summary}</Text>
          ))}
        </View>
      ) : null}

      {options.length > 0 ? (
        <View style={styles.optionList}>
          {options.map((option) => (
            <BuilderFeatureOptionRow
              key={option.id}
              option={option}
              isSelected={selectedOptionIds.includes(option.id)}
              onPress={() => onOpenOption(option)}
            />
          ))}
        </View>
      ) : (
        <View style={styles.unsupportedCard}>
          <Text style={styles.unsupportedTitle}>No structured builder options yet</Text>
          <Text style={styles.unsupportedText}>This feature grant exists, but its selectable options are not structured for the builder yet.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onOpenClassCompendium}
            style={({ pressed }) => [styles.compendiumButton, pressed && styles.compendiumButtonPressed]}
          >
            <Text style={styles.compendiumButtonLabel}>Open in Compendium</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  meta: {
    color: theme.colors.textMuted,
    ...typography.meta,
  },
  statusBadge: {
    backgroundColor: theme.colors.surfaceSuccess,
    borderColor: theme.colors.accentSuccess,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeFix: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.danger,
  },
  statusBadgeNeed: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.accentLegacy,
  },
  statusBadgeLabel: {
    color: theme.colors.accentSuccessSoft,
    fontSize: 11,
    fontWeight: '800',
  },
  statusBadgeLabelFix: {
    color: theme.colors.danger,
  },
  issueList: {
    gap: theme.spacing.xs,
  },
  issueText: {
    color: theme.colors.accentLegacySoft,
    ...typography.meta,
    fontWeight: '700',
  },
  optionList: {
    gap: theme.spacing.sm,
  },
  unsupportedCard: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.accentLegacy,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  unsupportedTitle: {
    color: theme.colors.accentLegacySoft,
    fontSize: 14,
    fontWeight: '800',
  },
  unsupportedText: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
  compendiumButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  compendiumButtonPressed: {
    borderColor: theme.colors.accentPrimary,
  },
  compendiumButtonLabel: {
    color: theme.colors.textSecondary,
    ...typography.meta,
    fontWeight: '800',
  },
});
