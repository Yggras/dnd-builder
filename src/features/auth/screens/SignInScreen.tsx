import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useSession } from '@/features/auth/hooks/useSession';
import { errorCodes } from '@/shared/errors/error-codes';
import { mapError } from '@/shared/errors/map-error';
import { PrimaryButton } from '@/shared/ui/PrimaryButton';
import { Screen } from '@/shared/ui/Screen';
import { theme, typography } from '@/shared/ui/theme';

export function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const { signInWithPassword, isLoading } = useSession();

  const emailError = useMemo(() => {
    if (!email) {
      return null;
    }

    return email.includes('@') ? null : 'Enter a valid email address.';
  }, [email]);

  const passwordError = useMemo(() => {
    if (!password) {
      return null;
    }

    return password.trim().length > 0 ? null : 'Enter your password.';
  }, [password]);

  const getSignInFeedback = (error: unknown) => {
    const appError = mapError(error);

    if (appError.code === errorCodes.authentication) {
      return 'Sign-in failed. Check your email and password, or verify the account exists in Supabase.';
    }

    if (appError.code === errorCodes.network) {
      return 'Sign-in failed because the app could not reach Supabase. Check your connection and try again.';
    }

    return 'Sign-in failed. Verify the app configuration and try again.';
  };

  const handleSubmit = async () => {
    if (!email || emailError || !password || passwordError) {
      setFeedback('Enter your email and password before signing in.');
      return;
    }

    try {
      setFeedback(null);
      await signInWithPassword(email.trim(), password);
    } catch (error) {
      setFeedback(getSignInFeedback(error));
    }
  };

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Auth</Text>
        <Text style={styles.title}>Private D&D Party App</Text>
        <Text style={styles.description}>
          Sign in with the credentials assigned to your private account. Access is limited to users
          created in Supabase by the app administrator.
        </Text>
        <View style={styles.heroBand}>
          <Text style={styles.heroBandLabel}>Arcane Command Center</Text>
          <Text style={styles.heroBandValue}>Secure party records, compendium access, and campaign operations.</Text>
        </View>
      </View>

      <View style={styles.form}>
        <View style={styles.formHeader}>
          <Text style={styles.formEyebrow}>Private Access</Text>
          <Text style={styles.formTitle}>Enter the table archive</Text>
        </View>
        <Text style={styles.label}>Email</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="player@example.com"
          placeholderTextColor={theme.colors.textFaint}
          style={styles.input}
          value={email}
        />
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        <Text style={styles.label}>Password</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="password"
          onChangeText={setPassword}
          placeholder="Enter your password"
          placeholderTextColor={theme.colors.textFaint}
          secureTextEntry
          style={styles.input}
          value={password}
        />
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        {feedback ? <Text style={styles.feedbackText}>{feedback}</Text> : null}
        <PrimaryButton disabled={isLoading} label="Sign In" onPress={() => void handleSubmit()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xxl,
    justifyContent: 'center',
    minHeight: '100%',
  },
  hero: {
    gap: theme.spacing.sm,
  },
  eyebrow: {
    color: theme.colors.accentPrimarySoft,
    ...typography.eyebrow,
  },
  title: {
    color: theme.colors.textPrimary,
    ...typography.titleLg,
  },
  description: {
    color: theme.colors.textSecondary,
    ...typography.body,
  },
  heroBand: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  heroBandLabel: {
    color: theme.colors.accentPrimarySoft,
    ...typography.eyebrow,
  },
  heroBandValue: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
  form: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  formHeader: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  formEyebrow: {
    color: theme.colors.textMuted,
    ...typography.eyebrow,
  },
  formTitle: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: theme.colors.backgroundDeep,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    color: theme.colors.textPrimary,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 14,
  },
  feedbackText: {
    color: theme.colors.accentPrimarySoft,
    fontSize: 14,
    lineHeight: 20,
  },
});
