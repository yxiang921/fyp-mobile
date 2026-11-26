import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useSyncExternalStore } from 'react';
import { translations } from './translations';

export type Locale = 'en' | 'ms' | 'zh';
let locale: Locale = 'en';
const listeners = new Set<() => void>();
export const getLocale = () => locale;
export async function setLocale(value: Locale) {
  locale = value; listeners.forEach(fn => fn());
  await AsyncStorage.setItem('findsight-language', value);
}
export async function loadLocale() {
  const saved = await AsyncStorage.getItem('findsight-language');
  if (saved === 'en' || saved === 'ms' || saved === 'zh') { locale = saved; listeners.forEach(fn => fn()); }
}
export function t(text: string): string {
  return locale === 'en' ? text : translations[text]?.[locale === 'ms' ? 0 : 1] ?? text;
}
export function useI18n() {
  const current = useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn); }; }, getLocale, () => 'en' as Locale);
  const translate = useCallback((text: string) => current === 'en' ? text : translations[text]?.[current === 'ms' ? 0 : 1] ?? text, [current]);
  return { t: translate, locale: current, setLocale };
}
