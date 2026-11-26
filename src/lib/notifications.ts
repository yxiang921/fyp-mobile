import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { api } from './api';

let currentToken: string | null = null;

export function getCurrentPushToken(): string | null {
  return currentToken;
}

/** Configure how notifications are presented while the app is foregrounded. */
export function configureNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Request permission and return the Expo push token (null on failure/emulator). */
export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  if (Platform.OS === 'android') {
    // A channel must exist before the token can be requested on Android 13+.
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#208AEF',
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') {
    return null;
  }

  const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)
    ?.eas?.projectId;

  try {
    const token = (
      await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)
    ).data;
    return token;
  } catch (error) {
    console.warn('Could not obtain Expo push token:', error);
    return null;
  }
}

/** Configure handler, obtain a token, and register it with the backend. */
export async function setupPushForUser(): Promise<string | null> {
  configureNotifications();
  const token = await getExpoPushToken();
  currentToken = token;
  if (token) {
    try {
      await api('/api/push-tokens', {
        method: 'POST',
        body: { token, device_type: Platform.OS },
      });
    } catch (error) {
      console.warn('Could not register push token with backend:', error);
    }
  }
  return token;
}

/** Unregister the token from the backend (call before logout). */
export async function teardownPushForUser(): Promise<void> {
  if (!currentToken) return;
  try {
    await api('/api/push-tokens', { method: 'DELETE', body: { token: currentToken } });
  } catch (error) {
    console.warn('Could not unregister push token:', error);
  } finally {
    currentToken = null;
  }
}
