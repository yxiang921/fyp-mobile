import { WebView } from 'react-native-webview';
import { mapHtml, type MapPoint } from './map-html';
export type MapProps = { points: MapPoint[]; editable?: boolean; onChange?: (point: MapPoint) => void };
export default function LocationMap({ points, editable = false, onChange }: MapProps) {
  return <WebView style={{ height: 280, flex: 0 }} originWhitelist={['about:*']} source={{ html: mapHtml(points, editable) }}
    onMessage={event => { try { const p = JSON.parse(event.nativeEvent.data); if (p.kind === 'location' && Number.isFinite(p.latitude) && Number.isFinite(p.longitude)) onChange?.(p); } catch {} }} />;
}
