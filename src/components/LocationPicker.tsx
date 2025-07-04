"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LatLng {
  lat: number;
  lng: number;
}

export default function LocationPicker({
  onChange,
  position,
}: {
  onChange: (latlng: LatLng) => void;
  position: LatLng | null;
}) {
  function LocationMarker() {
    useMapEvents({
      click(e) {
        onChange(e.latlng);
      },
    });
    return position ? <Marker position={position} /> : null;
  }

  return (
    <MapContainer
      center={[-26.8333, -65.2167]}

      zoom={13}
      className="h-[200px] w-full rounded-md"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <LocationMarker />
    </MapContainer>
  );
}
