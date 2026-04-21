import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/features/auth/hooks/useSession';
import { appRoutes } from '@/shared/constants/routes';

export default function AuthLayout() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return null;
  }

  if (session) {
    return <Redirect href={appRoutes.home} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
