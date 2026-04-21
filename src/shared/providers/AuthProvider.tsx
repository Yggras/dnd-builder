import type { Session, User } from '@supabase/supabase-js';
import type { ReactNode } from 'react';
import { createContext, useEffect, useMemo, useState } from 'react';

import { SupabaseAuthRepository } from '@/features/auth/adapters/SupabaseAuthRepository';
import { AuthService } from '@/features/auth/services/AuthService';
import { logger } from '@/shared/logging/logger';

const authService = new AuthService(new SupabaseAuthRepository());

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void authService
      .getSession()
      .then((initialSession) => {
        if (isMounted) {
          setSession(initialSession);
        }
      })
      .catch((error) => {
        logger.error('auth_session_bootstrap_failed', {
          message: error instanceof Error ? error.message : 'Unknown auth bootstrap error',
        });
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    const subscription = authService.onAuthStateChange((nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      signInWithPassword: (email: string, password: string) =>
        authService.signInWithPassword(email, password),
      signOut: () => authService.signOut(),
    }),
    [isLoading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
