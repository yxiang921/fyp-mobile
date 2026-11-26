import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { initials } from '@/components/person-card';
import {
  AppButton,
  Badge,
  Brand,
  Card,
  ErrorBanner,
  Loading,
  Screen,
  ScreenHeader,
  usePalette,
} from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatDate, formatDateTime } from '@/lib/format';
import { openDirections } from '@/lib/map';
import type { NotificationDetail, SingleResponse } from '@/lib/types';

function resolveCoords(detail: NotificationDetail): { lat: number; lng: number } | null {
  const cam = detail.detection?.camera;
  if (cam && cam.latitude != null && cam.longitude != null) {
    return { lat: cam.latitude, lng: cam.longitude };
  }
  const person = detail.missing_person;
  if (person && person.last_seen_latitude != null && person.last_seen_longitude != null) {
    return { lat: person.last_seen_latitude, lng: person.last_seen_longitude };
  }
  return null;
}

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const palette = usePalette();
  const { isAuthenticated } = useAuth();

  const [detail, setDetail] = useState<NotificationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapError, setMapError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    (async () => {
      try {
        const res = await api<SingleResponse<NotificationDetail>>(`/api/notifications/${id}`);
        setDetail(res.data);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load notification.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isAuthenticated, router]);

  useEffect(() => {
    // Opening a notification marks it read (idempotent).
    if (isAuthenticated && id) {
      api(`/api/notifications/${id}/read`, { method: 'POST' }).catch(() => {});
    }
  }, [id, isAuthenticated]);

  const handleDirections = async () => {
    if (!detail) return;
    const coords = resolveCoords(detail);
    if (!coords) return;
    setMapError('');
    try {
      await openDirections(coords.lat, coords.lng);
    } catch {
      setMapError('Could not open the maps app on this device.');
    }
  };

  if (loading) {
    return (
      <Screen>
        <ScreenHeader title="Notification" />
        <Loading />
      </Screen>
    );
  }

  if (!detail) {
    return (
      <Screen>
        <ScreenHeader title="Notification" onBack={() => router.back()} />
        <ErrorBanner message={error || 'Notification not found.'} />
      </Screen>
    );
  }

  const person = detail.missing_person;
  const detection = detail.detection;
  const coords = resolveCoords(detail);
  const photos = person?.photos ?? [];

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader title="Notification" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: palette.text }]}>{detail.title}</Text>
        <Text style={[styles.message, { color: palette.textSecondary }]}>{detail.message}</Text>
        <Text style={[styles.time, { color: palette.textSecondary }]}>
          {formatDateTime(detail.created_at)}
        </Text>

        {person ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Missing person</Text>
            {photos.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.carousel}>
                {photos.map((photo, i) => (
                  <Image
                    key={i}
                    source={{ uri: photo.url }}
                    style={[styles.photo, { backgroundColor: palette.backgroundElement }]}
                    contentFit="cover"
                    transition={200}
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={[styles.photo, styles.placeholder, { backgroundColor: palette.backgroundElement }]}>
                <Text style={[styles.placeholderText, { color: palette.textSecondary }]}>
                  {initials(person.full_name)}
                </Text>
              </View>
            )}

            <View style={styles.titleRow}>
              <Text style={[styles.name, { color: palette.text }]}>{person.full_name}</Text>
              <Badge status={person.status} />
            </View>
            <Text style={[styles.caseNumber, { color: palette.textSecondary }]}>
              {person.case_number}
            </Text>

            <View style={styles.detailGrid}>
              <Detail label="Gender" value={person.gender ?? '—'} />
              <Detail label="Date of birth" value={formatDate(person.date_of_birth)} />
              <Detail label="Last seen" value={formatDate(person.last_seen_date)} />
              <Detail label="Last seen location" value={person.last_seen_location ?? '—'} />
            </View>

            {person.description ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: palette.text }]}>Description</Text>
                <Text style={[styles.body, { color: palette.textSecondary }]}>{person.description}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {detection ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Detection</Text>
            <Card style={styles.detectionCard}>
              <View style={styles.detectionRow}>
                <Text style={[styles.detectionLabel, { color: palette.textSecondary }]}>
                  Similarity score
                </Text>
                <Text style={[styles.detectionValue, { color: palette.text }]}>
                  {detection.similarity_score != null ? `${detection.similarity_score}%` : '—'}
                </Text>
              </View>
              <View style={styles.detectionRow}>
                <Text style={[styles.detectionLabel, { color: palette.textSecondary }]}>
                  Detected at
                </Text>
                <Text style={[styles.detectionValue, { color: palette.text }]}>
                  {formatDateTime(detection.detected_at)}
                </Text>
              </View>
              <View style={styles.detectionRow}>
                <Text style={[styles.detectionLabel, { color: palette.textSecondary }]}>Camera</Text>
                <Text style={[styles.detectionValue, { color: palette.text }]}>
                  {detection.camera ? detection.camera.name : '—'}
                </Text>
              </View>
              {detection.camera?.location ? (
                <View style={styles.detectionRow}>
                  <Text style={[styles.detectionLabel, { color: palette.textSecondary }]}>
                    Location
                  </Text>
                  <Text style={[styles.detectionValue, { color: palette.text }]}>
                    {detection.camera.location}
                  </Text>
                </View>
              ) : null}
            </Card>

            {detection.captured_images.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.carousel}>
                {detection.captured_images.map((uri, i) => (
                  <Image
                    key={i}
                    source={{ uri }}
                    style={[styles.captured, { backgroundColor: palette.backgroundElement }]}
                    contentFit="cover"
                    transition={200}
                  />
                ))}
              </ScrollView>
            ) : null}
          </View>
        ) : null}

        {coords ? (
          <View style={styles.section}>
            <AppButton title="Get directions" onPress={handleDirections} />
            {mapError ? <ErrorBanner message={mapError} /> : null}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  const palette = usePalette();
  return (
    <View style={styles.detailItem}>
      <Text style={[styles.detailLabel, { color: palette.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: palette.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
  },
  time: {
    fontSize: 13,
    marginTop: -8,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  carousel: {
    flexGrow: 0,
  },
  photo: {
    width: 220,
    height: 220,
    borderRadius: 16,
    marginRight: 10,
  },
  placeholder: {
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 56,
    fontWeight: '700',
    color: Brand,
  },
  captured: {
    width: 240,
    height: 180,
    borderRadius: 12,
    marginRight: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    flexShrink: 1,
  },
  caseNumber: {
    fontSize: 13,
    marginTop: -6,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: 12,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  detectionCard: {
    gap: 10,
  },
  detectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  detectionLabel: {
    fontSize: 14,
  },
  detectionValue: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
});
