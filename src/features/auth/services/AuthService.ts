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

  signInWithMagicLink(email: string): Promise<void> {
    return this.repository.signInWithMagicLink(email);
  }

  signOut(): Promise<void> {
    return this.repository.signOut();
  }
}
