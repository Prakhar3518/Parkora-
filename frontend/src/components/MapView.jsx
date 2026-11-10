import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { money } from '../utils';

// Fix default marker icons under bundlers
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

const DEFAULT_CENTER = [22.5937, 78.9629]; // India

function FitBounds({ spaces }) {
  const map = useMap();
  useEffect(() => {
    if (!spaces.length) return;
    if (spaces.length === 1) map.setView([spaces[0].latitude, spaces[0].longitude], 15);
    else map.fitBounds(spaces.map((s) => [s.latitude, s.longitude]), { padding: [40, 40], maxZoom: 14 });
  }, [spaces, map]);
  return null;
}

/** Map of parking spaces; each marker links to its details page. */
export default function MapView({ spaces, height = '100%', link = true }) {
  return (
    <div style={{ height }} className="overflow-hidden rounded-xl border border-slate-200">
      <MapContainer center={DEFAULT_CENTER} zoom={5} scrollWheelZoom>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds spaces={spaces} />
        {spaces.map((s) => (
          <Marker key={s.id} position={[s.latitude, s.longitude]}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{s.title}</div>
                <div className="text-slate-500">{money(s.pricePerHour)}/hr</div>
                {link && <Link to={`/parking/${s.id}`} className="font-semibold text-brand-600">View →</Link>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

function ClickHandler({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => { if (lat != null && lng != null) map.setView([lat, lng], Math.max(map.getZoom(), 14)); }, [lat, lng, map]);
  return null;
}

/** Click-to-pick map for the listing form. */
export function LocationPicker({ lat, lng, onPick }) {
  const has = lat !== '' && lng !== '' && lat != null && lng != null && !Number.isNaN(Number(lat));
  return (
    <div className="h-64 overflow-hidden rounded-xl border border-slate-200">
      <MapContainer center={has ? [Number(lat), Number(lng)] : DEFAULT_CENTER} zoom={has ? 14 : 5} scrollWheelZoom>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClickHandler onPick={onPick} />
        {has && <><Marker position={[Number(lat), Number(lng)]} /><Recenter lat={Number(lat)} lng={Number(lng)} /></>}
      </MapContainer>
    </div>
  );
}
