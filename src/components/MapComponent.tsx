// "use client";

// import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
// import L from "leaflet";
// import "leaflet/dist/leaflet.css";
// import { useEffect } from "react";

// interface LatLng {
//   lat: number;
//   lng: number;
// }

// export default function MapComponent({
//   onChange,
//   position,
// }: {
//   onChange: (latlng: LatLng) => void;
//   position: LatLng | null;
// }) {
//   useEffect(() => {
//     delete (L.Icon.Default.prototype as any)._getIconUrl;
//     L.Icon.Default.mergeOptions({
//       iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
//       iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
//       shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
//     });
//   }, []);

//   function LocationMarker() {
//     useMapEvents({
//       click(e) {
//         onChange(e.latlng);
//       },
//     });
//     return position ? <Marker position={position} /> : null;
//   }

//   function RecenterMap({ position }: { position: LatLng }) {
//     const map = useMap();
//     useEffect(() => {
//       map.setView(position);
//     }, [position, map]);
//     return null;
//   }

//   const initialCenter = position || { lat: -26.8333, lng: -65.2167 };

//   return (
//     <div className="h-[200px] w-full rounded-md overflow-hidden" role="application">
//       <MapContainer
//         center={initialCenter}
//         zoom={13}
//         scrollWheelZoom={true}
//         className="h-full w-full z-0"
//       >
//         <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//         {position && <RecenterMap position={position} />}
//         <LocationMarker />
//       </MapContainer>
//     </div>
//   );
// }

import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

// NO importar CSS aquí si usas app router; importalas desde app/layout.tsx o pages/_app.tsx
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface LatLng {
  lat: number;
  lng: number;
}

interface Props {
  position: LatLng;
  onChange: (coords: LatLng) => void;
  onRouteChange?: (coords: LatLng[]) => void;
  style?: string;
}

export default function MapComponent({
  position,
  onChange,
  onRouteChange,
  style = "mapbox://styles/mapbox/streets-v11",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const drawRef = useRef<any>(null);

  // Iniciar mapa solo en cliente
  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return; // ya inicializado

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style,
      center: [position.lng, position.lat],
      zoom: 13,
    });
    mapRef.current = map;

    // Controles básicos
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }));

    // Draw control (línea + borrar)
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        line_string: true,
        trash: true,
      },
      defaultMode: "simple_select",
    });
    drawRef.current = draw;
    map.addControl(draw, "top-left");

    // Marker draggable
    const marker = new mapboxgl.Marker({ draggable: true })
      .setLngLat([position.lng, position.lat])
      .addTo(map);
    markerRef.current = marker;

    // Drag end -> callback
    marker.on("dragend", () => {
      const lngLat = marker.getLngLat();
      onChange({ lat: lngLat.lat, lng: lngLat.lng });
    });

    // Click en mapa -> mover marcador
const onMapClick = (e: mapboxgl.MapMouseEvent) => {
  const { lngLat } = e;
  marker.setLngLat(lngLat);
  onChange({ lat: lngLat.lat, lng: lngLat.lng });
};


    map.on("click", onMapClick);

    // Escuchar cambios en el dibujo
    const handleDrawUpdate = () => {
      if (!drawRef.current) return;
      const data = drawRef.current.getAll();
      if (!onRouteChange) return;

      if (!data || !data.features || data.features.length === 0) {
        onRouteChange([]);
        return;
      }

      // Tomamos la primera feature (si hay varias, podrías adaptar)
      const feat = data.features[0];
      if (!feat.geometry || !feat.geometry.coordinates) {
        onRouteChange([]);
        return;
      }

      const coords = feat.geometry.coordinates.map((c: [number, number]) => ({ lng: c[0], lat: c[1] }));
      onRouteChange(coords);
    };

    map.on("draw.create", handleDrawUpdate);
    map.on("draw.update", handleDrawUpdate);
    map.on("draw.delete", handleDrawUpdate);

    // cleanup
    return () => {
      map.off("click", onMapClick);
      map.off("draw.create", handleDrawUpdate);
      map.off("draw.update", handleDrawUpdate);
      map.off("draw.delete", handleDrawUpdate);
      if (marker) marker.remove();
      if (draw) map.removeControl(draw);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Si la prop position cambia desde padre, mover marcador y centrar
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLngLat([position.lng, position.lat]);
    }
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [position.lng, position.lat], essential: true });
    }
  }, [position.lat, position.lng]);

  return (
    <div className="w-full h-72 rounded-md overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}


