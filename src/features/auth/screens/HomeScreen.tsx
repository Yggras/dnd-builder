import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/features/auth/hooks/useSession';
import { PrimaryButton } from '@/shared/ui/PrimaryButton';
import { Screen } from '@/shared/ui/Screen';
import { SurfaceCard } from '@/shared/ui/SurfaceCard';
import { theme, typography } from '@/shared/ui/theme';

const SURFACES = [
  {
    title: 'Campaigns',
    description: 'Campaign membership, invites, and the active party shell.',
    href: '/(app)/campaigns',
  },
  {
    title: 'Characters',
    description: 'Character records, build data, and live sheet entry points.',
    href: '/(app)/characters',
  },
  {
    title: 'Compendium',
    description: 'Curated rules content, local search, and future filters.',
    href: '/(app)/compendium',
  },
  {
    title: 'DM Dashboard',
    description: 'Read-only party snapshots and live status monitoring.',
    href: '/(app)/dm',
  },
];

export function HomeScreen() {
  const router = useRouter();
  const { session, signOut, isLoading } = useSession();

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Command Center</Text>
        <Text style={styles.title}>Private D&D Party App</Text>
        <Text style={styles.description}>
          The shared shell is online. Move between campaign operations, character records, compendium
          lookup, and the DM overview from one central hub.
        </Text>
        <View style={styles.identityPanel}>
          <Text style={styles.identityLabel}>Current session</Text>
          <Text style={styles.sessionText}>
            {session?.user?.email ? session.user.email : 'No active session yet'}
          </Text>
          <Text style={styles.identityHint}>Authenticated access to private campaign data and local rules content.</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Operational Surfaces</Text>
        <Text style={styles.sectionMeta}>4 routes ready</Text>
      </View>

      <View style={styles.grid}>
        {SURFACES.map((surface) => (
          <SurfaceCard
            key={surface.title}
            title={surface.title}
            description={surface.description}
            onPress={() => router.push(surface.href as never)}
          />
        ))}
      </View>

      <PrimaryButton disabled={isLoading} label="Sign Out" onPress={() => void signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xl,
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
    ...typography.titleMd,
  },
  description: {
    color: theme.colors.textSecondary,
    ...typography.body,
  },
  identityPanel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  identityLabel: {
    color: theme.colors.textMuted,
    ...typography.eyebrow,
  },
  sessionText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  identityHint: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    ...typography.sectionTitle,
  },
  sectionMeta: {
    color: theme.colors.accentSuccessSoft,
    ...typography.meta,
    fontWeight: '700',
  },
  grid: {
    gap: theme.spacing.md,
  },
});
