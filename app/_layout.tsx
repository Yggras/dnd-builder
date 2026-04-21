import { Stack } from 'expo-router';

import { AppProviders } from '@/shared/providers/AppProviders';
import { AppBootstrapGate } from '@/shared/providers/AppBootstrapGate';

export default function RootLayout() {
  return (
    <AppProviders>
      <AppBootstrapGate>
        <Stack screenOptions={{ headerShown: false }} />
      </AppBootstrapGate>
    </AppProviders>
  );
}
