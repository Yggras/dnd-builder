import type { Session } from '@supabase/supabase-js';

export interface AuthSessionSubscription {
  unsubscribe: () => void;
}

export interface AuthRepository {
  getSession: () => Promise<Session | null>;
  onAuthStateChange: (listener: (session: Session | null) => void) => AuthSessionSubscription;
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}
