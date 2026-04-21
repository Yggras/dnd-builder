import type { Session } from '@supabase/supabase-js';

import type { AuthRepository, AuthSessionSubscription } from '@/features/auth/repositories/AuthRepository';

export class AuthService {
  constructor(private readonly repository: AuthRepository) {}

  getSession(): Promise<Session | null> {
    return this.repository.getSession();
  }

  onAuthStateChange(listener: (session: Session | null) => void): AuthSessionSubscription {
    return this.repository.onAuthStateChange(listener);
  }

  signInWithPassword(email: string, password: string): Promise<void> {
    return this.repository.signInWithPassword(email, password);
  }

  signOut(): Promise<void> {
    return this.repository.signOut();
  }
}
