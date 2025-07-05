"use client";
import { useEffect, useState } from "react";

export default function LeafletMap({ lat, lng }: { lat: number; lng: number }) {
  const [LeafletComponents, setLeafletComponents] = useState<any>(null);

  useEffect(() => {
    async function loadLeaflet() {
      const L = await import("leaflet");
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const { MapContainer, TileLayer, Marker, useMap } = await import("react-leaflet");
      setLeafletComponents({ MapContainer, TileLayer, Marker, useMap });
    }

    loadLeaflet();
  }, []);

  if (!LeafletComponents) return <div>Cargando mapa...</div>;

  const { MapContainer, TileLayer, Marker, useMap } = LeafletComponents;

  function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
      map.setView([lat, lng], map.getZoom());
    }, [lat, lng]);
    return null;
  }

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      scrollWheelZoom={false}
      className="w-full h-full"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[lat, lng]} />
      <RecenterMap lat={lat} lng={lng} />
    </MapContainer>
  );
}
