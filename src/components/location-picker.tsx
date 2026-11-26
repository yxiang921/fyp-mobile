import * as Location from 'expo-location';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useI18n } from '@/lib/i18n';
import { AppButton, Field, usePalette } from './ui';
import LocationMap from './location-map';
import type { MapPoint } from './map-html';

export default function LocationPicker({ value, onChange }: { value: MapPoint | null; onChange: (p: MapPoint | null) => void }) {
  const { t } = useI18n(); const palette = usePalette();
  const [error, setError] = useState(''); const [locating, setLocating] = useState(false);
  const [lat, setLat] = useState(''); const [lng, setLng] = useState('');
  const [mapPoints, setMapPoints] = useState<MapPoint[]>(value ? [value] : []);
  const choose = (p: MapPoint) => { onChange(p); setLat(String(p.latitude)); setLng(String(p.longitude)); };
  const locate = async () => {
    setLocating(true); setError('');
    try {
      if (!(await Location.requestForegroundPermissionsAsync()).granted) throw new Error();
      const result = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const p = { latitude: result.coords.latitude, longitude: result.coords.longitude }; choose(p); setMapPoints([p]);
    } catch { setError(t('GPS unavailable. Set the pin manually.')); } finally { setLocating(false); }
  };
  const manual = (a: string, b: string) => {
    setLat(a); setLng(b);
    if (a.trim() && b.trim() && Number.isFinite(Number(a)) && Number.isFinite(Number(b)) && Math.abs(Number(a))<=90 && Math.abs(Number(b))<=180) {
      const p={latitude:Number(a),longitude:Number(b)};onChange(p);setMapPoints([p]);
    } else onChange(null);
  };
  return <View style={{ gap: 10 }}>
    <AppButton title="Use current GPS location" variant="secondary" loading={locating} onPress={locate} />
    <Text style={{ color: palette.textSecondary }}>{t('Drag the pin or tap the map to set the location. GPS is optional.')}</Text>
    {error ? <Text style={{ color: '#DC2626' }}>{error}</Text> : null}
    <LocationMap points={mapPoints} editable onChange={choose} />
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <View style={{ flex: 1 }}><Field label="Latitude" value={lat} onChangeText={a => manual(a, lng)} keyboardType="numbers-and-punctuation" /></View>
      <View style={{ flex: 1 }}><Field label="Longitude" value={lng} onChangeText={b => manual(lat, b)} keyboardType="numbers-and-punctuation" /></View>
    </View>
  </View>;
}
