export type MapPoint = { latitude: number; longitude: number; type?: string; label?: string; status?: string; at?: string };
export function mapHtml(points: MapPoint[], editable: boolean) {
  const data = JSON.stringify(points).replace(/</g, '\\u003c');
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"><style>html,body,#map{height:100%;margin:0}</style></head><body><div id="map"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>
  const points=${data}, editable=${editable};
  const map=L.map('map').setView(points.length?[points[0].latitude,points[0].longitude]:[3.139,101.687],points.length?15:6);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors',maxZoom:19}).addTo(map);
  let pin;
  function send(lat,lng){const message=JSON.stringify({kind:'location',latitude:lat,longitude:lng});if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(message);else parent.postMessage(message,'*');}
  function setPin(lat,lng){if(pin)pin.setLatLng([lat,lng]);else {pin=L.marker([lat,lng],{draggable:true}).addTo(map);pin.on('dragend',()=>{const p=pin.getLatLng();send(p.lat,p.lng);});}}
  if(editable){if(points.length)setPin(points[0].latitude,points[0].longitude);map.on('click',e=>{setPin(e.latlng.lat,e.latlng.lng);send(e.latlng.lat,e.latlng.lng);});}
  else {points.forEach(p=>{const label=document.createElement('div');label.textContent=[p.type,p.label,p.status,p.at].filter(Boolean).join(' · ');L.circleMarker([p.latitude,p.longitude],{radius:8,color:p.type==='sighting'?'#2563eb':p.type==='detection'?'#dc2626':'#9333ea'}).addTo(map).bindPopup(label);});if(points.length)map.fitBounds(points.map(p=>[p.latitude,p.longitude]),{padding:[20,20],maxZoom:16});}
  </script></body></html>`;
}
