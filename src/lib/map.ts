import { Linking, Platform } from 'react-native';

/**
 * Open the device's map app with turn-by-turn directions to the given
 * coordinates. Uses Apple Maps on iOS and Google Maps elsewhere.
 */
export async function openDirections(lat: number, lng: number): Promise<void> {
  const destination = `${lat},${lng}`;
  const url =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?daddr=${destination}`
      : `https://www.google.com/maps/dir/?api=1&destination=${destination}`;

  await Linking.openURL(url);
}
