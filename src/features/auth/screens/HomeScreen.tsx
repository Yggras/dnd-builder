import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/features/auth/hooks/useSession';
import { appRoutes } from '@/shared/constants/routes';
import { Screen } from '@/shared/ui/Screen';
import { SurfaceCard } from '@/shared/ui/SurfaceCard';
import { theme, typography } from '@/shared/ui/theme';

const SURFACES = [
  {
    title: 'Campaigns',
    description: 'Invites & party',
    meta: 'Table roster',
    badge: 'Guild',
    href: '/(app)/campaigns',
    icon: 'map-marker-path',
    iconColor: theme.colors.accentLegacySoft,
  },
  {
    title: 'Characters',
    description: 'Sheets & builds',
    meta: 'Hero records',
    badge: 'Party',
    href: '/(app)/characters',
    icon: 'shield-sword',
    iconColor: theme.colors.textPrimary,
  },
  {
    title: 'Compendium',
    description: 'Rules & spells',
    meta: 'Offline search',
    badge: 'Lore',
    href: '/(app)/compendium',
    icon: 'book-open-page-variant',
    iconColor: theme.colors.accentPrimarySoft,
  },
  {
    title: 'DM Screen',
    description: 'Party overview',
    meta: 'Live status',
    badge: 'Watch',
    href: '/(app)/dm',
    icon: 'tower-fire',
    iconColor: theme.colors.accentSuccessSoft,
  },
] as const;

const QUICK_ACTIONS = [
  { label: 'New Character', icon: 'account-plus', href: appRoutes.newCharacter },
  { label: 'Join Campaign', icon: 'account-group', href: appRoutes.campaigns },
  { label: 'Search Rules', icon: 'magnify', href: appRoutes.compendium },
] as const;

export function HomeScreen() {
  const router = useRouter();
  const { session, signOut, isLoading } = useSession();

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroCrest}>
            <MaterialCommunityIcons color={theme.colors.accentLegacySoft} name="shield-crown" size={28} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Your Table</Text>
            <Text style={styles.title}>Ready for play</Text>
            <Text style={styles.subtitle}>Campaign tools, party records, and rules reference in one place.</Text>
          </View>
        </View>

        <View style={styles.heroFooter}>
          <View style={styles.heroIdentity}>
            <Text style={styles.heroMetaLabel}>Signed in as</Text>
            <Text numberOfLines={1} style={styles.heroMetaValue}>
              {session?.user?.email ?? 'No active session'}
            </Text>
          </View>

          <Pressable accessibilityRole="button" onPress={() => router.push('/(app)/compendium')} style={({ pressed }) => [styles.heroAction, pressed && styles.heroActionPressed]}>
            <Text style={styles.heroActionLabel}>Resume</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Adventures</Text>
        <Text style={styles.sectionMeta}>Choose a path</Text>
      </View>

      <View style={styles.grid}>
        {SURFACES.map((surface) => (
          <View key={surface.title} style={styles.gridItem}>
            <SurfaceCard
              badge={surface.badge}
              description={surface.description}
              icon={<MaterialCommunityIcons color={surface.iconColor} name={surface.icon} size={24} />}
              meta={surface.meta}
              onPress={() => router.push(surface.href as never)}
              title={surface.title}
            />
          </View>
        ))}
      </View>

      <View style={styles.quickSection}>
        <Text style={styles.quickSectionTitle}>Quick actions</Text>
        <View style={styles.quickActionsRow}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              accessibilityRole="button"
              key={action.label}
              onPress={() => router.push(action.href as never)}
              style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]}
            >
              <MaterialCommunityIcons color={theme.colors.accentPrimarySoft} name={action.icon} size={18} />
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.accountPanel}>
        <View style={styles.accountIdentity}>
          <View style={styles.accountSigil}>
            <MaterialCommunityIcons color={theme.colors.textPrimary} name="account-circle" size={22} />
          </View>
          <View style={styles.accountCopy}>
            <Text style={styles.accountLabel}>Account</Text>
            <Text numberOfLines={1} style={styles.accountEmail}>
              {session?.user?.email ?? 'No active session'}
            </Text>
          </View>
        </View>

        <Pressable accessibilityRole="button" disabled={isLoading} onPress={() => void signOut()} style={({ pressed }) => [styles.signOutButton, pressed && styles.signOutButtonPressed, isLoading && styles.signOutButtonDisabled]}>
          <Text style={styles.signOutLabel}>{isLoading ? 'Signing out...' : 'Sign Out'}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xl,
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderAccent,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  heroTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  heroCrest: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.accentLegacy,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  heroCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  eyebrow: {
    color: theme.colors.accentLegacySoft,
    ...typography.eyebrow,
  },
  title: {
    color: theme.colors.textPrimary,
    ...typography.titleMd,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
  heroFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  heroIdentity: {
    flex: 1,
    gap: 4,
  },
  heroMetaLabel: {
    color: theme.colors.textMuted,
    ...typography.meta,
  },
  heroMetaValue: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  heroAction: {
    alignItems: 'center',
    backgroundColor: theme.colors.accentPrimary,
    borderColor: theme.colors.accentPrimarySoft,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: theme.spacing.lg,
  },
  heroActionPressed: {
    backgroundColor: theme.colors.borderAccent,
  },
  heroActionLabel: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
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
    color: theme.colors.textMuted,
    ...typography.meta,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  gridItem: {
    width: '47.5%',
  },
  quickSection: {
    gap: theme.spacing.sm,
  },
  quickSectionTitle: {
    color: theme.colors.textPrimary,
    ...typography.sectionTitle,
    fontSize: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  quickAction: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 42,
    paddingHorizontal: 14,
  },
  quickActionPressed: {
    borderColor: theme.colors.accentPrimary,
  },
  quickActionLabel: {
    color: theme.colors.textSecondary,
    ...typography.meta,
    fontWeight: '700',
  },
  accountPanel: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  accountIdentity: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  accountSigil: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  accountCopy: {
    flex: 1,
    gap: 2,
  },
  accountLabel: {
    color: theme.colors.textMuted,
    ...typography.meta,
  },
  accountEmail: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  signOutButton: {
    alignItems: 'center',
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: theme.spacing.md,
  },
  signOutButtonPressed: {
    borderColor: theme.colors.accentPrimary,
  },
  signOutButtonDisabled: {
    opacity: 0.6,
  },
  signOutLabel: {
    color: theme.colors.textSecondary,
    ...typography.meta,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
