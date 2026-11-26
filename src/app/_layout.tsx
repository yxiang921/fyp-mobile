import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { useEffect } from 'react';
import { loadLocale } from '@/lib/i18n';
import { startOutbox } from '@/lib/outbox';

import { AuthProvider } from '@/lib/auth-context';
import { configureNotifications } from '@/lib/notifications';

configureNotifications();

export default function RootLayout() {
  useEffect(() => { void loadLocale(); return startOutbox(); }, []);
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="gallery" />
          <Stack.Screen name="report" />
          <Stack.Screen name="person/[id]" />
          <Stack.Screen name="cases" />
          <Stack.Screen name="case/[id]" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="notification/[id]" />
          <Stack.Screen name="profile" />
        </Stack>
      </AuthProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
