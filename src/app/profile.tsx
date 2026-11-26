import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  AppButton,
  Card,
  ErrorBanner,
  Screen,
  ScreenHeader,
  usePalette,
} from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  getCurrentPushToken,
  setupPushForUser,
  teardownPushForUser,
} from '@/lib/notifications';
import { ROLE_LABEL } from '@/lib/status';

export default function ProfileScreen() {
  const router = useRouter();
  const palette = usePalette();
  const { user, isAuthenticated, logout } = useAuth();

  const [token, setToken] = useState<string | null>(getCurrentPushToken());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [testError, setTestError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  const registerToken = async () => {
    setTestError('');
    const t = await setupPushForUser();
    setToken(t);
    if (!t) {
      setTestError(
        'No push token available. Push requires a physical device via a dev build (see README).',
      );
    }
  };

  const sendTest = async () => {
    if (!token) return;
    setTesting(true);
    setTestResult('');
    setTestError('');
    try {
      await api('/api/push-tokens/test', { method: 'POST' });
      setTestResult('Test push sent — check your device notification tray.');
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'Could not send test push.');
    } finally {
      setTesting(false);
    }
  };

  const handleLogout = async () => {
    await teardownPushForUser();
    await logout();
    router.replace('/login');
  };

  if (!user) {
    return (
      <Screen>
        <ScreenHeader title="Profile" onBack={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Profile" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name.trim()[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={[styles.name, { color: palette.text }]}>{user.name}</Text>
        <Text style={[styles.role, { color: palette.textSecondary }]}>
          {ROLE_LABEL[user.role] ?? user.role}
        </Text>

        <Card style={styles.infoCard}>
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Agency" value={user.agency ?? '—'} />
          <InfoRow label="Phone" value={user.phone ?? '—'} />
        </Card>

        <Card style={styles.infoCard}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Push notifications</Text>
          {token ? (
            <Text
              selectable
              style={[styles.token, { color: palette.textSecondary }]}>
              {token}
            </Text>
          ) : (
            <Text style={[styles.token, { color: palette.textSecondary }]}>
              No push token registered. Tap “Register token” on a physical device.
            </Text>
          )}
          <Text style={[styles.hint, { color: palette.textSecondary }]}>
            Long-press the token to copy it.
          </Text>
          <View style={styles.buttonRow}>
            <AppButton
              title={token ? 'Refresh token' : 'Register token'}
              variant="secondary"
              onPress={registerToken}
            />
            <AppButton
              title="Test push"
              onPress={sendTest}
              loading={testing}
              disabled={testing || !token}
            />
          </View>
          {testResult ? (
            <Text style={[styles.success, { color: '#10B981' }]}>{testResult}</Text>
          ) : null}
          {testError ? <ErrorBanner message={testError} /> : null}
        </Card>

        <AppButton title="Log out" variant="danger" onPress={handleLogout} />
      </ScrollView>
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const palette = usePalette();
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: palette.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: palette.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 16,
    alignItems: 'stretch',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#208AEF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  role: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: -8,
  },
  infoCard: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  token: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  hint: {
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  success: {
    fontSize: 14,
    fontWeight: '600',
  },
});
