import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/features/auth/hooks/useSession';
import { PrimaryButton } from '@/shared/ui/PrimaryButton';
import { Screen } from '@/shared/ui/Screen';
import { SurfaceCard } from '@/shared/ui/SurfaceCard';

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
        <Text style={styles.eyebrow}>Project Scaffold</Text>
        <Text style={styles.title}>D&D Builder Foundation</Text>
        <Text style={styles.description}>
          The app shell, shared providers, and domain boundaries are wired. Feature routes below are
          placeholders for the first vertical slice.
        </Text>
        <Text style={styles.sessionText}>
          {session?.user?.email ? `Signed in as ${session.user.email}` : 'No active session yet'}
        </Text>
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
    gap: 24,
  },
  header: {
    gap: 10,
  },
  eyebrow: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '700',
  },
  description: {
    color: '#CBD5E1',
    fontSize: 16,
    lineHeight: 22,
  },
  sessionText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  grid: {
    gap: 16,
  },
});
