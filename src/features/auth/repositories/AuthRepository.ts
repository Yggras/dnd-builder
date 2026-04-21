import type { Session } from '@supabase/supabase-js';

export interface AuthSessionSubscription {
  unsubscribe: () => void;
}

export interface AuthRepository {
  getSession: () => Promise<Session | null>;
  onAuthStateChange: (listener: (session: Session | null) => void) => AuthSessionSubscription;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
