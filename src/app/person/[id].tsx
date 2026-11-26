import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { submitReport, type Attachment } from '@/lib/outbox';
import { useI18n } from '@/lib/i18n';
import { Consent, LanguagePicker } from '@/components/report-controls';
import LocationPicker from '@/components/location-picker';
import type { MapPoint } from '@/components/map-html';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { initials } from '@/components/person-card';
import {
  AppButton,
  Badge,
  Brand,
  ErrorBanner,
  Field,
  Screen,
  ScreenHeader,
  usePalette,
} from '@/components/ui';
import { api } from '@/lib/api';
import { formatDate, toInputDate } from '@/lib/format';
import type { MissingPerson, SingleResponse } from '@/lib/types';

export default function PersonDetailScreen() {
  const { t } = useI18n();
  const [consent, setConsent] = useState(false);
  const [coordinates, setCoordinates] = useState<MapPoint | null>(null);
  const [evidence, setEvidence] = useState<Attachment[]>([]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const palette = usePalette();

  const [person, setPerson] = useState<MissingPerson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // sighting form state
  const [showForm, setShowForm] = useState(false);
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(toInputDate(new Date()));
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api<SingleResponse<MissingPerson>>(`/api/missing-persons/${id}`);
        setPerson(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load case.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const openForm = () => {
    const now = new Date();
    setTime(
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    );
    setFormError('');
    setSuccess(false);
    setShowForm(true);
  };

  const submitSighting = async () => {
    if (!consent) { setFormError(t('Please accept the consent notice.')); return; }
    if (!location.trim()) {
      setFormError('Please enter the location where you saw this person.');
      return;
    }
    if (!date || !time) {
      setFormError('Please enter the date and time.');
      return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      const timestamp = new Date(`${date}T${time}:00`);
      if (Number.isNaN(timestamp.getTime()) || timestamp.getTime()>Date.now()) throw new Error(t('Invalid date or time.'));
      const fields: Record<string,string> = {reporter_name:reporterName.trim(),reporter_phone:reporterPhone.trim(),
        location:location.trim(),sighted_at:timestamp.toISOString(),notes:notes.trim(),consent:'1'};
      if(coordinates){fields.latitude=String(coordinates.latitude);fields.longitude=String(coordinates.longitude);}
      const entry=await submitReport(`/api/missing-persons/${id}/sightings`,fields,evidence);
      if(entry.status!=='sent'){setShowForm(false);router.push('/outbox');return;}
      setEvidence([]);setConsent(false);setCoordinates(null);
      setSuccess(true);
      setTimeout(() => {
        setShowForm(false);
        setLocation('');
        setNotes('');
        setReporterName('');
        setReporterPhone('');
      }, 1200);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not submit sighting.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <ScreenHeader title="Details" />
        <View style={{ flex: 1 }} />
      </Screen>
    );
  }

  if (!person) {
    return (
      <Screen>
        <ScreenHeader title="Details" onBack={() => router.back()} />
        <ErrorBanner message={error || 'Case not found.'} />
      </Screen>
    );
  }

  const photos = person.photos ?? [];

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader title="Case Details" onBack={() => router.back()} />
      <LanguagePicker />
      <ScrollView contentContainerStyle={styles.content}>
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
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>{t("Last-worn clothing")}</Text>
            <Text style={[styles.body, { color: palette.textSecondary }]}>{person.clothing_description}</Text>
          </View>
        ) : null}
        {person.identifying_features ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>{t("Distinguishing features")}</Text>
            <Text style={[styles.body, { color: palette.textSecondary }]}>{person.identifying_features}</Text>
          </View>
        ) : null}

        {person.description ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>{t("Description")}</Text>
            <Text style={[styles.body, { color: palette.textSecondary }]}>{person.description}</Text>
          </View>
        ) : null}

        <AppButton title="I've seen this person" onPress={openForm} />
      </ScrollView>

      <Modal visible={showForm} animationType="slide" transparent onRequestClose={() => setShowForm(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}>
          <ScrollView style={{maxHeight:'92%',backgroundColor:palette.background}} contentContainerStyle={styles.modalCard} keyboardShouldPersistTaps="handled">
            <Text style={[styles.modalTitle, { color: palette.text }]}>{t("Report a sighting")}</Text>
            <Text style={[styles.modalSubtitle, { color: palette.textSecondary }]}>
              {t('Where and when did you see this person?')}
            </Text>

            {success ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{t("Thank you! Your report has been submitted.")}</Text>
              </View>
            ) : (
              <>
                <Field label="Location *" value={location} onChangeText={setLocation} placeholder="e.g. Jalan Sultan, Kuala Lumpur" />
                <LocationPicker value={coordinates} onChange={setCoordinates} />
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-08-23" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="Time (HH:MM)" value={time} onChangeText={setTime} placeholder="14:30" />
                  </View>
                </View>
                <Field label="Your name (optional)" value={reporterName} onChangeText={setReporterName} placeholder="Anonymous" />
                <Field label="Phone (optional)" value={reporterPhone} onChangeText={setReporterPhone} placeholder="012-3456789" keyboardType="phone-pad" />
                <Field label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Clothing, direction of travel…" multiline />
                <AppButton title="Attach photos / videos" variant="secondary" onPress={async()=>{
                  try {
                    const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images','videos'],allowsMultipleSelection:true,selectionLimit:3,quality:1});
                    if(!result.canceled){
                      if(result.assets.length>3 || result.assets.some(a=>(a.fileSize??0)>20*1024*1024))throw new Error(t('Photos / videos (up to 3, 20 MB each)'));
                      setEvidence(result.assets.map(a=>({uri:a.uri,name:a.fileName??(a.type==='video'?'video.mp4':'photo.jpg'),type:a.mimeType??(a.type==='video'?'video/mp4':'image/jpeg'),field:'evidence[]'})));
                    }
                  }catch(e){setFormError(e instanceof Error?e.message:'Could not open media library.');}
                }}/>
                <Text style={{color:palette.textSecondary}}>{t('Photos / videos (up to 3, 20 MB each)')}</Text>
                {evidence.map((file,index)=><View key={index} style={{flexDirection:'row',alignItems:'center',gap:8}}><Text style={{flex:1,color:palette.text}}>{file.name}</Text><AppButton title="Remove" variant="ghost" onPress={()=>setEvidence(evidence.filter((_,i)=>i!==index))}/></View>)}
                <Consent value={consent} onChange={setConsent}/>

                {formError ? <ErrorBanner message={formError} /> : null}

                <AppButton title="Submit report" onPress={submitSighting} loading={submitting} disabled={submitting} />
              </>
            )}

            <Pressable onPress={() => setShowForm(false)} style={styles.cancelWrap}>
              <Text style={[styles.cancel, { color: palette.textSecondary }]}>{t("Close")}</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  const { t } = useI18n();
  const palette = usePalette();
  return (
    <View style={styles.detailItem}>
      <Text style={[styles.detailLabel, { color: palette.textSecondary }]}>{t(label)}</Text>
      <Text style={[styles.detailValue, { color: palette.text }]}>{value}</Text>
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
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    gap: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  successBox: {
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 16,
  },
  successText: {
    color: '#065F46',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelWrap: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  cancel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
