import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View, type ImageStyle } from 'react-native';

import { formatDate } from '@/lib/format';
import type { MissingPerson } from '@/lib/types';

import { Badge, Brand, usePalette } from './ui';

export function primaryPhotoUrl(person: MissingPerson): string | null {
  const primary = person.photos?.find((p) => p.is_primary);
  const photo = primary ?? person.photos?.[0];
  return photo?.url ?? null;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || '?';
}

function Photo({
  url,
  name,
  style,
}: {
  url: string | null;
  name: string;
  style: ImageStyle;
}) {
  const palette = usePalette();
  if (url) {
    return <Image source={{ uri: url }} style={style} contentFit="cover" transition={200} />;
  }
  return (
    <View style={[style, styles.placeholder, { backgroundColor: palette.backgroundSelected }]}>
      <Text style={[styles.placeholderText, { color: palette.textSecondary }]}>{initials(name)}</Text>
    </View>
  );
}

export function PersonCard({
  person,
  layout = 'list',
  onPress,
}: {
  person: MissingPerson;
  layout?: 'list' | 'grid';
  onPress: () => void;
}) {
  const palette = usePalette();
  const url = primaryPhotoUrl(person);

  if (layout === 'grid') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.gridCard,
          { backgroundColor: palette.backgroundElement },
          pressed && { opacity: 0.75 },
        ]}>
        <Photo url={url} name={person.full_name} style={styles.gridImage} />
        <View style={styles.gridBody}>
          <Text numberOfLines={1} style={[styles.name, { color: palette.text }]}>
            {person.full_name}
          </Text>
          <Text numberOfLines={1} style={[styles.case, { color: palette.textSecondary }]}>
            {person.case_number}
          </Text>
          <Badge status={person.status} />
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.listCard,
        { backgroundColor: palette.backgroundElement },
        pressed && { opacity: 0.75 },
      ]}>
      <Photo url={url} name={person.full_name} style={styles.listImage} />
      <View style={styles.listBody}>
        <Text numberOfLines={1} style={[styles.name, { color: palette.text }]}>
          {person.full_name}
        </Text>
        <Text style={[styles.case, { color: palette.textSecondary }]}>{person.case_number}</Text>
        <Text style={[styles.case, { color: palette.textSecondary }]}>
          Last seen {formatDate(person.last_seen_date)} · {person.last_seen_location ?? 'Unknown'}
        </Text>
        <Badge status={person.status} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  listCard: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 10,
    gap: 12,
    alignItems: 'center',
  },
  listImage: { width: 64, height: 64, borderRadius: 10 },
  listBody: { flex: 1, gap: 3 },
  gridCard: {
    flex: 1,
    borderRadius: 14,
    padding: 8,
    gap: 8,
  },
  gridImage: { width: '100%', aspectRatio: 1, borderRadius: 10 },
  gridBody: { gap: 3 },
  name: { fontSize: 16, fontWeight: '700' },
  case: { fontSize: 12 },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 22,
    fontWeight: '700',
    color: Brand,
  },
});
