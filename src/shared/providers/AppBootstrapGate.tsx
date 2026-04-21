import type { ReactNode } from 'react';

import { useAppBootstrap } from '@/shared/hooks/useAppBootstrap';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';

interface AppBootstrapGateProps {
  children: ReactNode;
}

export function AppBootstrapGate({ children }: AppBootstrapGateProps) {
  const { isReady, error } = useAppBootstrap();

  if (error) {
    return <ErrorState title="App bootstrap failed" message={error.message} />;
  }

  if (!isReady) {
    return <LoadingState label="Preparing local cache and shared providers..." />;
  }

  return <>{children}</>;
}
