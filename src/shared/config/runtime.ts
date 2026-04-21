import { env } from '@/shared/config/env';

export const runtimeConfig = {
  app: {
    environment: env.EXPO_PUBLIC_APP_ENV,
    name: 'D&D Builder',
  },
  supabase: {
    url: env.EXPO_PUBLIC_SUPABASE_URL,
    publishableKey: env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  },
} as const;
