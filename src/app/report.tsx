import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  AppButton,
  ErrorBanner,
  Field,
  Screen,
  ScreenHeader,
  usePalette,
} from '@/components/ui';
import { submitReport } from '@/lib/outbox';
import { useI18n } from '@/lib/i18n';
import { Consent, LanguagePicker } from '@/components/report-controls';
import LocationPicker from '@/components/location-picker';
import type { MapPoint } from '@/components/map-html';
import { toInputDate } from '@/lib/format';

interface PickedPhoto {
  uri: string;
  name: string;
  type: string;
}

const GENDERS = ['Male', 'Female', 'Other'];

export default function ReportScreen() {
  const { t } = useI18n();
  const [consent, setConsent] = useState(false);
  const [nationalId, setNationalId] = useState('');
  const [coordinates, setCoordinates] = useState<MapPoint | null>(null);
  const router = useRouter();
  const palette = usePalette();

  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [ethnicity, setEthnicity] = useState('');
  const [nationality, setNationality] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [hairType, setHairType] = useState('');
  const [hairColor, setHairColor] = useState('');
  const [eyeColor, setEyeColor] = useState('');
  const [clothingDescription, setClothingDescription] = useState('');
  const [identifyingFeatures, setIdentifyingFeatures] = useState('');
  const [lastSeenLocation, setLastSeenLocation] = useState('');
  const [lastSeenDate, setLastSeenDate] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [caseNumber, setCaseNumber] = useState('');

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library permission is required to attach a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const ext = asset.mimeType?.split('/')[1] ?? 'jpg';
      setPhoto({
        uri: asset.uri,
        name: asset.fileName ?? `photo-${Date.now()}.${ext}`,
        type: asset.mimeType ?? 'image/jpeg',
      });
    }
  };

  const submit = async () => {
    if (!consent) { setError(t('Please accept the consent notice.')); return; }
    if (!fullName.trim()) {
      setError(t("Please enter the missing person's full name."));
      return;
    }
    if (!lastSeenLocation.trim()) {
      setError(t('Please enter the last known location.'));
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const fields: Record<string,string> = {
        full_name:fullName.trim(), national_id:nationalId.trim(), last_seen_location:lastSeenLocation.trim(),
        gender, date_of_birth:dob, ethnicity:ethnicity.trim(), nationality:nationality.trim(), height_cm:heightCm,
        weight_kg:weightKg, hair_type:hairType.trim(), hair_color:hairColor.trim(), eye_color:eyeColor.trim(),
        clothing_description:clothingDescription.trim(), identifying_features:identifyingFeatures.trim(),
        last_seen_date:lastSeenDate, description:description.trim(), consent:'1',
      };
      if(coordinates){fields.last_seen_latitude=String(coordinates.latitude);fields.last_seen_longitude=String(coordinates.longitude);}
      const entry=await submitReport('/api/missing-persons',Object.fromEntries(Object.entries(fields).filter(([,v])=>v!=='')),photo?[{...photo,field:'photo'}]:[]);
      if(entry.status==='sent' && entry.caseNumber)setCaseNumber(entry.caseNumber);
      else router.replace('/outbox');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  if (caseNumber) {
    return (
      <Screen>
        <ScreenHeader title="Report submitted" onBack={() => router.replace('/gallery')} />
        <View style={styles.successWrap}>
          <View style={styles.successBox}>
            <Text style={styles.successTitle}>{t("Report submitted")}</Text>
            <Text style={[styles.successText, { color: palette.textSecondary }]}>{t("Your case number is")}</Text>
            <Text style={[styles.caseNumber, { color: palette.text }]}>{caseNumber}</Text>
            <Text style={[styles.successText, { color: palette.textSecondary }]}>{t("A PDRM officer will review your case shortly.")}</Text>
          </View>
          <AppButton
            title="Back to gallery"
            onPress={() => router.replace('/gallery')}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Report a missing person" onBack={() => router.back()} />
      <LanguagePicker />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Field
            label="Full name *"
            value={fullName}
            onChangeText={setFullName}
            placeholder="e.g. Ahmad bin Ali"
          />
          <Field label="IC number" value={nationalId} onChangeText={setNationalId} />

          <View style={styles.fieldWrap}>
            <Text style={[styles.label, { color: palette.textSecondary }]}>{t("Gender")}</Text>
            <View style={styles.chips}>
              {GENDERS.map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setGender(g === gender ? '' : g)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        gender === g ? '#208AEF' : palette.backgroundElement,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.chipText,
                      { color: gender === g ? '#FFFFFF' : palette.text },
                    ]}>
                    {t(g)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Field label="Date of birth (YYYY-MM-DD)" value={dob} onChangeText={setDob} placeholder="2000-01-01" />
          <Text style={[styles.sectionTitle, { color: palette.text }]}>{t("Person specifications")}</Text>
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Field label="Ethnicity / Bangsa" value={ethnicity} onChangeText={setEthnicity} placeholder="e.g. Malay" />
            </View>
            <View style={styles.rowItem}>
              <Field label="Nationality" value={nationality} onChangeText={setNationality} placeholder="e.g. Malaysian" />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Field label="Height (cm)" value={heightCm} onChangeText={setHeightCm} placeholder="170" keyboardType="numeric" />
            </View>
            <View style={styles.rowItem}>
              <Field label="Weight (kg)" value={weightKg} onChangeText={setWeightKg} placeholder="65" keyboardType="decimal-pad" />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Field label="Hair type" value={hairType} onChangeText={setHairType} placeholder="e.g. Short, curly" />
            </View>
            <View style={styles.rowItem}>
              <Field label="Hair color" value={hairColor} onChangeText={setHairColor} placeholder="e.g. Black" />
            </View>
          </View>
          <Field label="Eye color" value={eyeColor} onChangeText={setEyeColor} placeholder="e.g. Dark brown" />
          <Field label="Last-worn clothing" value={clothingDescription} onChangeText={setClothingDescription} placeholder="e.g. Red T-shirt, blue jeans, black shoes" multiline />
          <Field label="Distinguishing features" value={identifyingFeatures} onChangeText={setIdentifyingFeatures} placeholder="Scars, tattoos, glasses, birthmarks…" multiline />
          <Field label="Last seen location *" value={lastSeenLocation} onChangeText={setLastSeenLocation} placeholder="e.g. Jalan Sultan, Kuala Lumpur" />
          <LocationPicker value={coordinates} onChange={setCoordinates} />
          <Field label="Last seen date (YYYY-MM-DD)" value={lastSeenDate} onChangeText={setLastSeenDate} placeholder={toInputDate(new Date())} />
          <Field label="Description" value={description} onChangeText={setDescription} placeholder="Height, build, clothing, distinguishing features…" multiline />

          <View style={styles.fieldWrap}>
            <Text style={[styles.label, { color: palette.textSecondary }]}>{t("Photo")}</Text>
            {photo ? (
              <View style={styles.photoRow}>
                <Image source={{ uri: photo.uri }} style={styles.preview} contentFit="cover" />
                <Pressable onPress={() => setPhoto(null)}>
                  <Text style={[styles.remove, { color: '#DC2626' }]}>{t("Remove")}</Text>
                </Pressable>
              </View>
            ) : (
              <AppButton title="Choose photo" variant="secondary" onPress={pickPhoto} />
            )}
          </View>

          {error ? <ErrorBanner message={error} /> : null}
          <Consent value={consent} onChange={setConsent} />

          <AppButton title="Submit report" onPress={submit} loading={submitting} disabled={submitting} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
  },
  fieldWrap: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  rowItem: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  preview: {
    width: 96,
    height: 96,
    borderRadius: 12,
  },
  remove: {
    fontSize: 15,
    fontWeight: '600',
  },
  successWrap: {
    padding: 20,
    gap: 16,
  },
  successBox: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#10B981',
  },
  successText: {
    fontSize: 15,
    textAlign: 'center',
  },
  caseNumber: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
