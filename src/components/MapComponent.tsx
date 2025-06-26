"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";

interface LatLng {
  lat: number;
  lng: number;
}

export default function MapComponent({
  onChange,
  position,
}: {
  onChange: (latlng: LatLng) => void;
  position: LatLng | null;
}) {
  const [localPosition, setLocalPosition] = useState<LatLng | null>(null);

  // ⚙️ Configuración de íconos Leaflet
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  // 🔄 Sincronizar posición externa -> interna
  useEffect(() => {
    if (position && typeof position.lat === "number" && typeof position.lng === "number") {
      setLocalPosition(position);
    }
  }, [position]);

  function LocationMarker() {
    useMapEvents({
      click(e) {
        const newCoords = e.latlng;
        setLocalPosition(newCoords);
        onChange(newCoords);
      },
    });

    return localPosition ? <Marker position={localPosition} /> : null;
  }

  // 🌍 Valor inicial para el mapa
  const initialCenter = localPosition || { lat: -26.8333, lng: -65.2167 };

  return (
    <div className="h-[200px] w-full rounded-md overflow-hidden">
      <MapContainer
        center={initialCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LocationMarker />
      </MapContainer>
    </div>
  );
}
