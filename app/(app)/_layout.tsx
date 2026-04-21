import { Stack } from 'expo-router';

export default function AppLayout() {
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
