import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
  type KeyboardTypeOptions,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { statusColor, statusLabel } from '@/lib/status';
import { useI18n } from '@/lib/i18n';

export const Brand = '#208AEF';

export function usePalette() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? Colors.dark : Colors.light;
}

export function Screen({
  children,
  style,
  edges,
}: {
  children: ReactNode;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}) {
  const palette = usePalette();
  const { t } = useI18n();
  return (
    <SafeAreaView
      edges={edges ?? ['top', 'left', 'right']}
      style={[{ flex: 1, backgroundColor: palette.background }, style]}>
      {children}
    </SafeAreaView>
  );
}

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const palette = usePalette();
  const { t } = useI18n();
  const bg =
    variant === 'primary'
      ? Brand
      : variant === 'danger'
        ? '#DC2626'
        : variant === 'secondary'
          ? palette.backgroundElement
          : 'transparent';
  const color =
    variant === 'primary' || variant === 'danger'
      ? '#FFFFFF'
      : variant === 'ghost'
        ? Brand
        : palette.text;
  const border = variant === 'ghost' ? Brand : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: border, borderWidth: variant === 'ghost' ? 1 : 0 },
        (pressed || disabled) && { opacity: 0.6 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Text style={[styles.buttonText, { color }]}>{t(title)}</Text>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  secureTextEntry,
  ...rest
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  secureTextEntry?: boolean;
} & Omit<TextInputProps, 'value' | 'onChangeText' | 'style'>) {
  const palette = usePalette();
  const { t } = useI18n();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: palette.textSecondary }]}>{t(label)}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ? t(placeholder) : undefined}
        placeholderTextColor={palette.textSecondary}
        keyboardType={keyboardType}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        {...rest}
        style={[
          styles.input,
          {
            color: palette.text,
            backgroundColor: palette.backgroundElement,
            borderColor: palette.backgroundSelected,
          },
          multiline && { minHeight: 90, textAlignVertical: 'top' },
        ]}
      />
    </View>
  );
}

export function Badge({ status }: { status: string | null | undefined }) {
  const { t } = useI18n();
  const color = statusColor(status);
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
      <Text style={[styles.badgeText, { color }]}>{t(statusLabel(status))}</Text>
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}) {
  const palette = usePalette();
  const { t } = useI18n();
  const inner = (
    <View style={[styles.card, { backgroundColor: palette.backgroundElement }, style]}>
      {children}
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.7 }}>
        {inner}
      </Pressable>
    );
  }
  return inner;
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={Brand} />
    </View>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  const palette = usePalette();
  const { t } = useI18n();
  return (
    <View style={styles.center}>
      <Text style={[styles.emptyTitle, { color: palette.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.emptySubtitle, { color: palette.textSecondary }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

export function ScreenHeader({
  title,
  right,
  onBack,
}: {
  title: string;
  right?: ReactNode;
  onBack?: () => void;
}) {
  const palette = usePalette();
  const { t } = useI18n();
  return (
    <View style={[styles.header, { borderBottomColor: palette.backgroundSelected }]}>
      <View style={styles.headerLeft}>
        {onBack ? (
          <Pressable onPress={onBack} style={({ pressed }) => pressed && { opacity: 0.6 }}>
            <Text style={[styles.backText, { color: Brand }]}>‹ {t('Back')}</Text>
          </Pressable>
        ) : null}
        <Text style={[styles.headerTitle, { color: palette.text }]} numberOfLines={1}>
          {t(title)}
        </Text>
      </View>
      {right ? <View style={styles.headerRight}>{right}</View> : null}
    </View>
  );
}

export function LinkButton({ title, onPress }: { title: string; onPress: () => void }) {
  const { t } = useI18n();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.6 }}>
      <Text style={[styles.link, { color: Brand }]}>{t(title)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  fieldWrap: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    borderRadius: 14,
    padding: 14,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    paddingRight: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  link: {
    fontSize: 15,
    fontWeight: '600',
  },
});
