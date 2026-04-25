import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/features/auth/hooks/useSession';
import { appRoutes } from '@/shared/constants/routes';
import { theme } from '@/shared/ui/theme';

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
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.accentPrimarySoft,
        headerTitleStyle: {
          color: theme.colors.textPrimary,
          fontWeight: '700',
        },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'D&D Builder' }} />
      <Stack.Screen name="campaigns/index" options={{ title: 'Campaigns' }} />
      <Stack.Screen name="characters/index" options={{ title: 'Characters' }} />
      <Stack.Screen name="characters/new" options={{ title: 'New Character' }} />
      <Stack.Screen name="characters/[characterId]/builder" options={{ title: 'Character Builder' }} />
      <Stack.Screen name="characters/[characterId]/preview" options={{ title: 'Character Preview' }} />
      <Stack.Screen name="compendium/index" options={{ title: 'Compendium' }} />
      <Stack.Screen name="compendium/category/[category]" options={{ title: 'Compendium' }} />
      <Stack.Screen name="compendium/class/[classId]" options={{ title: 'Class Library' }} />
      <Stack.Screen name="compendium/[entryId]" options={{ title: 'Compendium Entry' }} />
      <Stack.Screen name="dm/index" options={{ title: 'DM Dashboard' }} />
    </Stack>
  );
}
