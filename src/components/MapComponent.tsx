"use client";

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

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
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  function LocationMarker() {
    useMapEvents({
      click(e) {
        onChange(e.latlng);
      },
    });
    return position ? <Marker position={position} /> : null;
  }

  function RecenterMap({ position }: { position: LatLng }) {
    const map = useMap();
    useEffect(() => {
      map.setView(position);
    }, [position, map]);
    return null;
  }

  const initialCenter = position || { lat: -26.8333, lng: -65.2167 };

  return (
    <div className="h-[200px] w-full rounded-md overflow-hidden" role="application">
      <MapContainer
        center={initialCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {position && <RecenterMap position={position} />}
        <LocationMarker />
      </MapContainer>
    </div>
  );
}


