import Constants from 'expo-constants';
import { ZodError } from 'zod';
import { z } from 'zod';

import { ConfigurationError } from '@/shared/errors/app-error';

const envSchema = z.object({
  EXPO_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const processEnvValues = {
  EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
};

function readEnvValue(key: keyof z.infer<typeof envSchema>) {
  const processValue = processEnvValues[key];

  if (processValue) {
    return processValue;
  }

  const expoExtra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;
  return expoExtra?.[key];
}

function parseEnvironment() {
  try {
    return envSchema.parse({
      EXPO_PUBLIC_APP_ENV: readEnvValue('EXPO_PUBLIC_APP_ENV'),
      EXPO_PUBLIC_SUPABASE_URL: readEnvValue('EXPO_PUBLIC_SUPABASE_URL'),
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: readEnvValue('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const fields = error.issues.map((issue) => issue.path.join('.')).filter(Boolean).join(', ');
      throw new ConfigurationError(
        fields
          ? `Invalid or missing runtime configuration: ${fields}.`
          : 'Invalid or missing runtime configuration.',
      );
    }

    throw error;
  }
}

export const env = parseEnvironment();
