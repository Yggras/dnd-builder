import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/features/auth/hooks/useSession';
import { appRoutes } from '@/shared/constants/routes';

export default function AppLayout() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return null;
  }

  if (!session) {
    return <Redirect href={appRoutes.auth} />;
  }

  return (
    <Stack
      screenOptions={{
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'D&D Builder' }} />
      <Stack.Screen name="campaigns/index" options={{ title: 'Campaigns' }} />
      <Stack.Screen name="characters/index" options={{ title: 'Characters' }} />
      <Stack.Screen name="compendium/index" options={{ title: 'Compendium' }} />
      <Stack.Screen name="dm/index" options={{ title: 'DM Dashboard' }} />
    </Stack>
  );
}
