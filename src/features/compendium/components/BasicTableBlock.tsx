import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { RichTextLine } from '@/features/compendium/components/RichTextLine';
import type { InlineTextToken } from '@/features/compendium/utils/inlineText';
import { theme } from '@/shared/ui/theme';

interface BasicTableBlockProps {
  headers: InlineTextToken[][];
  rows: InlineTextToken[][][];
}

export function BasicTableBlock({ headers, rows }: BasicTableBlockProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.table}>
        <View style={[styles.row, styles.headerRow]}>
          {headers.map((header, index) => (
            <View key={`header-${index}`} style={styles.cell}>
              <Text style={styles.headerText}>{header.map((token) => token.text).join('')}</Text>
            </View>
          ))}
        </View>
        {rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {row.map((cell, cellIndex) => (
              <View key={`cell-${rowIndex}-${cellIndex}`} style={styles.cell}>
                <RichTextLine tokens={cell} variant="table" />
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  table: {
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  headerRow: {
    backgroundColor: theme.colors.surfaceElevated,
  },
  cell: {
    borderColor: theme.colors.borderSubtle,
    borderRightWidth: 1,
    minWidth: 132,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  headerText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
