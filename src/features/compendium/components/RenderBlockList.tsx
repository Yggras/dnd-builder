import { StyleSheet, Text, View } from 'react-native';

import { BasicTableBlock } from '@/features/compendium/components/BasicTableBlock';
import { RichTextLine } from '@/features/compendium/components/RichTextLine';
import type { DetailRenderBlock } from '@/features/compendium/utils/detailBlocks';
import { parseInlineText } from '@/features/compendium/utils/inlineText';
import { theme, typography } from '@/shared/ui/theme';

interface RenderBlockListProps {
  blocks: DetailRenderBlock[];
}

export function RenderBlockList({ blocks }: RenderBlockListProps) {
  if (blocks.length === 0) {
    return (
      <Text style={styles.emptyText}>No detail text is available for this entry yet.</Text>
    );
  }

  return (
    <View style={styles.blocks}>
      {blocks.map((block, index) => {
        switch (block.kind) {
          case 'heading':
            return <Text key={`heading-${index}`} style={styles.heading}>{block.text}</Text>;
          case 'paragraph':
            return <RichTextLine key={`paragraph-${index}`} tokens={block.tokens} />;
          case 'fallbackText':
            return <RichTextLine key={`fallback-${index}`} tokens={parseInlineText(block.text)} />;
          case 'list':
            return (
              <View key={`list-${index}`} style={styles.list}>
                {block.items.map((item, itemIndex) => (
                  <View key={`list-item-${index}-${itemIndex}`} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <View style={styles.listItemText}>
                      <RichTextLine tokens={item} />
                    </View>
                  </View>
                ))}
              </View>
            );
          case 'table':
            return <BasicTableBlock key={`table-${index}`} headers={block.headers} rows={block.rows} />;
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  blocks: {
    gap: theme.spacing.md,
  },
  heading: {
    color: theme.colors.textPrimary,
    ...typography.sectionTitle,
    marginTop: theme.spacing.xs,
  },
  list: {
    gap: theme.spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  bullet: {
    color: theme.colors.accentPrimarySoft,
    fontSize: 18,
    lineHeight: 24,
  },
  listItemText: {
    flex: 1,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 24,
  },
});
