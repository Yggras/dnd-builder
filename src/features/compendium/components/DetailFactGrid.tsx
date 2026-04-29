import { StyleSheet, Text, View } from 'react-native';

import type { DetailFact } from '@/features/compendium/utils/detailFacts';
import { theme } from '@/shared/ui/theme';

interface DetailFactGridProps {
  facts: DetailFact[];
}

export function DetailFactGrid({ facts }: DetailFactGridProps) {
  if (facts.length === 0) {
    return null;
  }

  return (
    <View style={styles.grid}>
      {facts.map((fact) => (
        <View key={`${fact.label}:${fact.value}`} style={styles.factCard}>
          <Text style={styles.factLabel}>{fact.label}</Text>
          <Text style={styles.factValue}>{fact.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  factCard: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    flexGrow: 1,
    flexBasis: '46%',
    gap: 4,
    minWidth: 136,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  factLabel: {
    color: theme.colors.textFaint,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  factValue: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
});
