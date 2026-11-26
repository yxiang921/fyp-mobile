import { Image } from 'expo-image';
import LocationMap from '@/components/location-map';
import type { MapPoint } from '@/components/map-html';
import { useI18n } from '@/lib/i18n';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { initials } from '@/components/person-card';
import {
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
import { statusColor } from '@/lib/status';
import type {
  ListResponse,
  MissingPerson,
  Sighting,
  SingleResponse,
} from '@/lib/types';

const STATUS_OPTIONS = ['pending', 'active', 'found', 'closed', 'reopened'] as const;

export default function CaseDetailScreen() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const palette = usePalette();
  const { isAuthenticated } = useAuth();

  const [person, setPerson] = useState<MissingPerson | null>(null);
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

  const loadSightings = useCallback(async () => {
    try {
      const res = await api<ListResponse<Sighting>>(`/api/sightings?missing_person_id=${id}&per_page=100`);
      setSightings(res.data ?? []);
    } catch {
      // sightings are non-critical; keep existing list on failure
    }
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    (async () => {
      try {
        const res = await api<SingleResponse<MissingPerson>>(`/api/missing-persons/${id}`);
        setPerson(res.data);
        const map = await api<{data:MapPoint[]}>(`/api/missing-persons/${id}/map`);
        setMapPoints(map.data);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load case.');
      } finally {
        setLoading(false);
      }
    })();
    loadSightings();
  }, [id, isAuthenticated, loadSightings, router]);

  const updateStatus = async (status: string) => {
    if (!person || updating) return;
    setUpdating(true);
    setUpdateError('');
    try {
      const res = await api<SingleResponse<MissingPerson>>(`/api/missing-persons/${id}/status`, {
        method: 'PATCH',
        body: { status },
      });
      // The status endpoint returns a partial object — merge so detail fields aren't lost.
      setPerson((prev) => (prev ? { ...prev, status: res.data.status, updated_at: res.data.updated_at } : res.data));
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Could not update status.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <ScreenHeader title="Case" />
        <Loading />
      </Screen>
    );
  }

  if (!person) {
    return (
      <Screen>
        <ScreenHeader title="Case" onBack={() => router.back()} />
        <ErrorBanner message={error || 'Case not found.'} />
      </Screen>
    );
  }

  const photos = person.photos ?? [];

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader title="Case Details" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={{color:palette.text,fontWeight:'700'}}>{t('Case map')}</Text>
        <Text style={{color:palette.textSecondary}}>{t('Blue: sightings · Red: detections · Purple: last seen')}</Text>
        <LocationMap points={mapPoints}/>
        {photos.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
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
          <Detail label="Ethnicity / Bangsa" value={person.ethnicity ?? '—'} />
          <Detail label="Nationality" value={person.nationality ?? '—'} />
          <Detail label="Height" value={person.height_cm ? `${person.height_cm} cm` : '—'} />
          <Detail label="Weight" value={person.weight_kg ? `${person.weight_kg} kg` : '—'} />
          <Detail label="Hair" value={[person.hair_type, person.hair_color].filter(Boolean).join(', ') || '—'} />
          <Detail label="Eye color" value={person.eye_color ?? '—'} />
          <Detail label="Last seen" value={formatDate(person.last_seen_date)} />
          <Detail label="Last seen location" value={person.last_seen_location ?? '—'} />
        </View>

        {person.clothing_description ? (
          <InfoSection title="Last-worn clothing" value={person.clothing_description} />
        ) : null}
        {person.identifying_features ? (
          <InfoSection title="Distinguishing features" value={person.identifying_features} />
        ) : null}

        {person.description ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Description</Text>
            <Text style={[styles.body, { color: palette.textSecondary }]}>{person.description}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Detections ({person.detections?.length ?? 0})</Text>
          {!person.detections?.length ? (
            <Text style={[styles.body, { color: palette.textSecondary }]}>No face detections recorded yet.</Text>
          ) : person.detections.map((detection) => (
            <Card key={detection.id} style={styles.activityCard}>
              <View style={styles.sightingHead}>
                <Text style={[styles.sightingLocation, { color: palette.text }]}>
                  {detection.camera?.name ?? 'Unknown camera'}
                </Text>
                <Badge status={detection.status} />
              </View>
              <Text style={[styles.sightingMeta, { color: palette.textSecondary }]}>
                {detection.camera?.location ?? 'Location not available'} · {formatDateTime(detection.detected_at)}
              </Text>
              <Text style={[styles.body, { color: palette.text }]}>
                Similarity: {detection.similarity_score !== null ? `${detection.similarity_score.toFixed(1)}%` : '—'}
              </Text>
              {detection.captured_images[0] ? (
                <Image source={{ uri: detection.captured_images[0] }} style={styles.detectionImage} contentFit="cover" />
              ) : null}
            </Card>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Alerts ({person.alerts?.length ?? 0})</Text>
          {!person.alerts?.length ? (
            <Text style={[styles.body, { color: palette.textSecondary }]}>No alerts generated for this case.</Text>
          ) : person.alerts.map((alert) => (
            <Card key={alert.id} style={styles.activityCard}>
              <View style={styles.sightingHead}>
                <Text style={[styles.sightingLocation, { color: palette.text }]}>{alert.alert_id}</Text>
                <Badge status={alert.status} />
              </View>
              <Text style={[styles.sightingMeta, { color: palette.textSecondary }]}>
                {alert.camera?.name ?? 'Unknown camera'} · {formatDateTime(alert.created_at)}
              </Text>
              {alert.description ? <Text style={[styles.body, { color: palette.text }]}>{alert.description}</Text> : null}
            </Card>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Update status</Text>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((s) => (
              <Pressable
                key={s}
                disabled={updating}
                onPress={() => updateStatus(s)}
                style={[
                  styles.statusChip,
                  {
                    backgroundColor:
                      person.status === s ? statusColor(s) : palette.backgroundElement,
                  },
                ]}>
                <Text
                  style={[
                    styles.statusChipText,
                    { color: person.status === s ? '#FFFFFF' : palette.text },
                  ]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
          {updateError ? <ErrorBanner message={updateError} /> : null}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>
            Sightings ({sightings.length})
          </Text>
          {sightings.length === 0 ? (
            <Text style={[styles.body, { color: palette.textSecondary }]}>
              No sightings reported yet.
            </Text>
          ) : (
            sightings.map((s) => (
              <Card key={s.id} style={styles.sightingCard}>
                <View style={styles.sightingHead}>
                  <Text style={[styles.sightingLocation, { color: palette.text }]}>
                    {s.location}
                  </Text>
                  <Badge status={s.status} />
                </View>
                <Text style={[styles.sightingMeta, { color: palette.textSecondary }]}>
                  {formatDateTime(s.sighted_at)}
                </Text>
                {s.reporter_name ? (
                  <Text style={[styles.sightingMeta, { color: palette.textSecondary }]}>
                    Reported by {s.reporter_name}
                  </Text>
                ) : null}
                {s.notes ? (
                  <Text style={[styles.body, { color: palette.text }]}>{s.notes}</Text>
                ) : null}
              </Card>
            ))
          )}
        </View>
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

function InfoSection({ title, value }: { title: string; value: string }) {
  const palette = usePalette();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: palette.text }]}>{title}</Text>
      <Text style={[styles.body, { color: palette.textSecondary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
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
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 56,
    fontWeight: '700',
    color: Brand,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    flexShrink: 1,
  },
  caseNumber: {
    fontSize: 13,
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
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sightingCard: {
    gap: 4,
  },
  activityCard: {
    gap: 6,
  },
  detectionImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginTop: 4,
  },
  sightingHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sightingLocation: {
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  sightingMeta: {
    fontSize: 13,
  },
});
