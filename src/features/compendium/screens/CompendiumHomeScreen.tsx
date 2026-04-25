import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import type { CompendiumCategory } from '@/features/compendium/types';
import { compendiumCategoryLabels, compendiumCategorySummaries } from '@/features/compendium/utils/catalog';
import { Screen } from '@/shared/ui/Screen';
import { theme, typography } from '@/shared/ui/theme';

const categories: CompendiumCategory[] = ['classes', 'backgrounds', 'feats', 'items', 'species', 'spells'];

export function CompendiumHomeScreen() {
  const router = useRouter();

  return (
    <Screen contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Compendium</Text>
        <Text style={styles.title}>Choose a library</Text>
        <Text style={styles.summary}>Browse rules by category so every section gets search, filters, and sorting that fit the content.</Text>
      </View>

      <View style={styles.grid}>
        {categories.map((category) => (
          <Pressable
            accessibilityRole="button"
            key={category}
            onPress={() => router.push(`/(app)/compendium/category/${category}`)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <Text style={styles.cardTitle}>{compendiumCategoryLabels[category]}</Text>
            <Text style={styles.cardSummary}>{compendiumCategorySummaries[category]}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    gap: theme.spacing.sm,
  },
  eyebrow: {
    color: theme.colors.accentPrimarySoft,
    ...typography.eyebrow,
  },
  title: {
    color: theme.colors.textPrimary,
    ...typography.titleLg,
  },
  summary: {
    color: theme.colors.textSecondary,
    ...typography.body,
  },
  grid: {
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.lg,
  },
  cardPressed: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.accentPrimary,
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    ...typography.sectionTitle,
  },
  cardSummary: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
});
