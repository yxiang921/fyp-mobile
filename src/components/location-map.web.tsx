import { useEffect, useRef } from 'react';
import { mapHtml, type MapPoint } from './map-html';
type MapProps = { points: MapPoint[]; editable?: boolean; onChange?: (point: MapPoint) => void };
export default function LocationMap({ points, editable = false, onChange }: MapProps) {
  const ref = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.source !== ref.current?.contentWindow) return;
      try { const p = JSON.parse(event.data); if (p.kind === 'location' && Number.isFinite(p.latitude) && Number.isFinite(p.longitude)) onChange?.(p); } catch {}
    };
    window.addEventListener('message', listener); return () => window.removeEventListener('message', listener);
  }, [onChange]);
  return <iframe ref={ref} title="Location map" sandbox="allow-scripts" srcDoc={mapHtml(points, editable)} style={{ height: 280, width: '100%', border: 0 }} />;
}
