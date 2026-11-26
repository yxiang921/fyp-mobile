import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  AppButton,
  Brand,
  ErrorBanner,
  Field,
  Screen,
  ScreenHeader,
  usePalette,
} from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { setupPushForUser } from '@/lib/notifications';

export default function LoginScreen() {
  const router = useRouter();
  const palette = usePalette();
  const { login, continueAsGuest } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      await setupPushForUser();
      router.replace('/cases');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuest = () => {
    continueAsGuest();
    router.replace('/gallery');
  };

  return (
    <Screen>
      <ScreenHeader title="Sign in" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Text style={[styles.logo, { color: Brand }]}>FindSight</Text>
            <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
              Missing-person alert system
            </Text>
          </View>

          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />

          {error ? <ErrorBanner message={error} /> : null}

          <AppButton
            title="Sign in"
            onPress={handleLogin}
            loading={submitting}
            disabled={submitting}
          />
          <AppButton title="Continue as guest" variant="secondary" onPress={handleGuest} />

          <Text style={[styles.hint, { color: palette.textSecondary }]}>
            Staff accounts (super admin, PDRM officer, patrol unit) sign in here to view
            notifications and update case status.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 16,
  },
  hero: {
    alignItems: 'center',
    marginVertical: 16,
    gap: 4,
  },
  logo: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
  },
  hint: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
});
