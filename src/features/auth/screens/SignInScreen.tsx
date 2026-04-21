import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useSession } from '@/features/auth/hooks/useSession';
import { errorCodes } from '@/shared/errors/error-codes';
import { mapError } from '@/shared/errors/map-error';
import { PrimaryButton } from '@/shared/ui/PrimaryButton';
import { Screen } from '@/shared/ui/Screen';

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
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="player@example.com"
          placeholderTextColor="#64748B"
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
          placeholderTextColor="#64748B"
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
    gap: 32,
    justifyContent: 'center',
    minHeight: '100%',
  },
  hero: {
    gap: 12,
  },
  eyebrow: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: '700',
  },
  description: {
    color: '#CBD5E1',
    fontSize: 16,
    lineHeight: 24,
  },
  form: {
    backgroundColor: '#111827',
    borderColor: '#1F2937',
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 20,
  },
  label: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#020617',
    borderColor: '#334155',
    borderRadius: 14,
    borderWidth: 1,
    color: '#F8FAFC',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 14,
  },
  feedbackText: {
    color: '#C4B5FD',
    fontSize: 14,
  },
});
