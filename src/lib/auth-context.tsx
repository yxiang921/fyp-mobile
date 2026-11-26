import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { api, setAuthToken } from './api';
import { teardownPushForUser } from './notifications';
import type { User } from './types';

const TOKEN_KEY = 'findsight_token';
const USER_KEY = 'findsight_user';

async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  }
  return SecureStore.getItemAsync(key);
}

async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function storageDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

interface AuthContextValue {
  token: string | null;
  user: User | null;
  isGuest: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          storageGet(TOKEN_KEY),
          storageGet(USER_KEY),
        ]);
        if (storedToken && storedUser) {
          setAuthToken(storedToken);
          setToken(storedToken);
          setUser(JSON.parse(storedUser) as User);
          setIsGuest(false);
        } else {
          setIsGuest(true);
        }
      } catch {
        setIsGuest(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ token: string; user: User }>('/api/login', {
      method: 'POST',
      body: { email, password },
      token: null,
    });
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
    setIsGuest(false);
    await storageSet(TOKEN_KEY, res.token);
    await storageSet(USER_KEY, JSON.stringify(res.user));
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    await teardownPushForUser();
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setIsGuest(true);
    await Promise.all([storageDelete(TOKEN_KEY), storageDelete(USER_KEY)]);
  }, []);

  const continueAsGuest = useCallback(() => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setIsGuest(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isGuest,
      isAuthenticated: Boolean(token && user),
      loading,
      login,
      logout,
      continueAsGuest,
    }),
    [token, user, isGuest, loading, login, logout, continueAsGuest],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
