import { Redirect } from 'expo-router';

import { useSession } from '@/features/auth/hooks/useSession';

export default function IndexScreen() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return null;
  }

  if (session) {
    return <Redirect href="/(app)" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}
