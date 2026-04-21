import type { Session } from '@supabase/supabase-js';

import type { AuthRepository, AuthSessionSubscription } from '@/features/auth/repositories/AuthRepository';
import { supabase } from '@/shared/supabase/client';

export class SupabaseAuthRepository implements AuthRepository {
  async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    return data.session;
  }

  onAuthStateChange(listener: (session: Session | null) => void): AuthSessionSubscription {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      listener(session);
    });

    return {
      unsubscribe: () => subscription.unsubscribe(),
    };
  }

  async signInWithMagicLink(email: string): Promise<void> {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      throw error;
    }
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }
}
