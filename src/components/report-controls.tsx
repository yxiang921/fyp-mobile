import { Pressable, Text, View } from 'react-native';
import { useI18n, type Locale } from '@/lib/i18n';
import { usePalette } from './ui';

export function LanguagePicker() {
  const { locale, setLocale } = useI18n();
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 12 }}>
    {([['en', 'English'], ['ms', 'Bahasa Melayu'], ['zh', '中文']] as [Locale, string][]).map(([code, name]) =>
      <Pressable key={code} accessibilityRole="button" accessibilityState={{ selected: locale === code }} onPress={() => { void setLocale(code); }}>
        <Text style={{ color: '#208AEF', fontWeight: locale === code ? '800' : '400' }}>{name}</Text>
      </Pressable>)}
  </View>;
}
export function Consent({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const { t } = useI18n(); const palette = usePalette();
  return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: value }} onPress={() => onChange(!value)} style={{ padding: 12, borderWidth: 1, borderColor: palette.textSecondary, borderRadius: 8 }}>
    <Text style={{ color: palette.text }}>{value ? '☑' : '☐'} {t('I consent to sharing this report and any evidence with authorised officers for locating the missing person. Witness details and evidence are private. Active case photos and identifying descriptions may be public. Do not include contact details in public descriptions.')}</Text>
  </Pressable>;
}
