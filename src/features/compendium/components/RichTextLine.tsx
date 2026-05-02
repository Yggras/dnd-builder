import { StyleSheet, Text } from 'react-native';

import { useRouter } from 'expo-router';

import type { InlineReferenceTargets } from '@/features/compendium/utils/inlineReferences';
import type { InlineTextToken } from '@/features/compendium/utils/inlineText';
import { theme } from '@/shared/ui/theme';

interface RichTextLineProps {
  tokens: InlineTextToken[];
  referenceTargets?: InlineReferenceTargets;
  variant?: 'body' | 'summary' | 'table' | 'fact';
}

export function RichTextLine({ tokens, referenceTargets = {}, variant = 'body' }: RichTextLineProps) {
  const router = useRouter();

  return (
    <Text style={[styles.base, styles[variant]]}>
      {tokens.map((token, index) => {
        const targetEntryId = token.reference ? referenceTargets[token.reference.key] : undefined;
        return (
          <Text
            accessibilityRole={targetEntryId ? 'link' : undefined}
            key={`${token.kind}-${index}`}
            onPress={targetEntryId ? () => router.push(`/(app)/compendium/${encodeURIComponent(targetEntryId)}`) : undefined}
            style={[styles[token.kind], targetEntryId && styles.linkReference]}
          >
            {token.text}
          </Text>
        );
      })}
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
  fact: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  text: {
    color: theme.colors.textSecondary,
  },
  reference: {
    color: theme.colors.accentPrimarySoft,
    fontWeight: '700',
  },
  linkReference: {
    textDecorationLine: 'underline',
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
