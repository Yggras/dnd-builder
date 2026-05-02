import { StyleSheet, Text, View } from 'react-native';

import { RichTextLine } from '@/features/compendium/components/RichTextLine';
import type { DetailFact } from '@/features/compendium/utils/detailFacts';
import { useInlineTokenReferenceTargets } from '@/features/compendium/utils/inlineReferences';
import { theme } from '@/shared/ui/theme';

interface DetailFactGridProps {
  facts: DetailFact[];
}

export function DetailFactGrid({ facts }: DetailFactGridProps) {
  const tokenLines = facts.flatMap((fact) => (fact.tokens ? [fact.tokens] : []));
  const referenceTargets = useInlineTokenReferenceTargets(tokenLines);

  if (facts.length === 0) {
    return null;
  }

  return (
    <View style={styles.grid}>
      {facts.map((fact) => (
        <View key={`${fact.label}:${fact.value ?? fact.tokens?.map((token) => token.text).join('')}`} style={styles.factCard}>
          <Text style={styles.factLabel}>{fact.label}</Text>
          {fact.tokens ? (
            <RichTextLine referenceTargets={referenceTargets} tokens={fact.tokens} variant="fact" />
          ) : (
            <Text style={styles.factValue}>{fact.value}</Text>
          )}
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
