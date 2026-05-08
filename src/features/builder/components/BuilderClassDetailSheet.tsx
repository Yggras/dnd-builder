import { StyleSheet, Text, View } from 'react-native';

import { BuilderChoiceSheet } from '@/features/builder/components/BuilderChoiceSheet';
import {
  buildClassKeyLevels,
  buildExpandedClassFacts,
  getClassEditionBadge,
  getClassSpellcastingBadge,
} from '@/features/builder/utils/classMetadata';
import type { ContentEntity } from '@/shared/types/domain';
import { theme, typography } from '@/shared/ui/theme';

interface BuilderClassDetailSheetProps {
  visible: boolean;
  classEntity: ContentEntity | null;
  isSelected: boolean;
  onClose: () => void;
  onChoose: () => void;
  onOpenCompendium: () => void;
}

export function BuilderClassDetailSheet({
  visible,
  classEntity,
  isSelected,
  onClose,
  onChoose,
  onOpenCompendium,
}: BuilderClassDetailSheetProps) {
  const facts = classEntity ? buildExpandedClassFacts(classEntity) : [];
  const keyLevels = classEntity ? buildClassKeyLevels(classEntity) : [];

  return (
    <BuilderChoiceSheet
      visible={visible && Boolean(classEntity)}
      title={classEntity?.name ?? 'Class details'}
      subtitle="Rules snapshot for builder selection"
      onClose={onClose}
      primaryAction={isSelected ? { label: 'Close', onPress: onClose } : { label: 'Choose this class', onPress: onChoose }}
      secondaryAction={{ label: 'Open in Compendium', onPress: onOpenCompendium }}
    >
      {classEntity ? (
        <>
          <View style={styles.badgeRow}>
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceBadgeLabel}>{classEntity.sourceCode}</Text>
            </View>
            <View style={[styles.editionBadge, classEntity.isLegacy && styles.legacyBadge]}>
              <Text style={[styles.editionBadgeLabel, classEntity.isLegacy && styles.legacyBadgeLabel]}>{getClassEditionBadge(classEntity)}</Text>
            </View>
            <View style={styles.spellBadge}>
              <Text style={styles.spellBadgeLabel}>{getClassSpellcastingBadge(classEntity)}</Text>
            </View>
          </View>

          {classEntity.isLegacy || !classEntity.isSelectableInBuilder ? (
            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>Support note</Text>
              {classEntity.isLegacy ? <Text style={styles.warningText}>This is legacy 2014 content and will remain labeled as legacy.</Text> : null}
              {!classEntity.isSelectableInBuilder ? <Text style={styles.warningText}>This class is not currently selectable in the builder.</Text> : null}
            </View>
          ) : null}

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Rules Snapshot</Text>
            <View style={styles.factGrid}>
              {facts.map((fact) => (
                <View key={fact.label} style={styles.factItem}>
                  <Text style={styles.factLabel}>{fact.label}</Text>
                  <Text style={styles.factValue}>{fact.value}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Key Levels</Text>
            <View style={styles.keyLevelList}>
              {keyLevels.map((level) => (
                <Text key={level} style={styles.keyLevelText}>{level}</Text>
              ))}
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.summaryText}>{classEntity.summary || 'No short class summary is structured yet.'}</Text>
          </View>
        </>
      ) : null}
    </BuilderChoiceSheet>
  );
}

const styles = StyleSheet.create({
  badgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  sourceBadge: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sourceBadgeLabel: {
    color: theme.colors.accentSuccessSoft,
    ...typography.meta,
    fontWeight: '800',
  },
  editionBadge: {
    backgroundColor: theme.colors.accentPrimaryDeep,
    borderRadius: theme.radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  editionBadgeLabel: {
    color: theme.colors.accentPrimarySoft,
    fontSize: 12,
    fontWeight: '800',
  },
  legacyBadge: {
    backgroundColor: theme.colors.accentLegacy,
  },
  legacyBadgeLabel: {
    color: theme.colors.accentLegacySoft,
  },
  spellBadge: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  spellBadgeLabel: {
    color: theme.colors.textSecondary,
    ...typography.meta,
    fontWeight: '800',
  },
  warningCard: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.accentLegacy,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    gap: 4,
    padding: theme.spacing.md,
  },
  warningTitle: {
    color: theme.colors.accentLegacySoft,
    fontSize: 13,
    fontWeight: '800',
  },
  warningText: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
  sectionBlock: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    ...typography.sectionTitle,
  },
  factGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  factItem: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    gap: 3,
    minWidth: 140,
    padding: theme.spacing.sm,
  },
  factLabel: {
    color: theme.colors.textFaint,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  factValue: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  keyLevelList: {
    gap: theme.spacing.xs,
  },
  keyLevelText: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    color: theme.colors.textSecondary,
    ...typography.bodySm,
    padding: theme.spacing.sm,
  },
  summaryText: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
});
