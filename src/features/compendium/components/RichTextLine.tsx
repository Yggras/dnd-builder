import { StyleSheet, Text } from 'react-native';

import type { InlineTextToken } from '@/features/compendium/utils/inlineText';
import { theme } from '@/shared/ui/theme';

interface RichTextLineProps {
  tokens: InlineTextToken[];
  variant?: 'body' | 'summary' | 'table';
}

export function RichTextLine({ tokens, variant = 'body' }: RichTextLineProps) {
  return (
    <Text style={[styles.base, styles[variant]]}>
      {tokens.map((token, index) => (
        <Text key={`${token.kind}-${index}`} style={styles[token.kind]}>
          {token.text}
        </Text>
      ))}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: theme.colors.textSecondary,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
  },
  summary: {
    fontSize: 15,
    lineHeight: 23,
  },
  table: {
    fontSize: 13,
    lineHeight: 18,
  },
  text: {
    color: theme.colors.textSecondary,
  },
  reference: {
    color: theme.colors.accentPrimarySoft,
    fontWeight: '700',
  },
  dice: {
    color: theme.colors.accentSuccessSoft,
    fontWeight: '700',
  },
  emphasis: {
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  strong: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
  },
});
