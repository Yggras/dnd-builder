import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { runtimeConfig } from '@/shared/config/runtime';

export const supabase = createClient(runtimeConfig.supabase.url, runtimeConfig.supabase.publishableKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: false,
    persistSession: true,
    storage: AsyncStorage,
  },
});
