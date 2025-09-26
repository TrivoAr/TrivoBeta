import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

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
  editable?: boolean;
  showControls?: boolean;
}

export default function MapComponent({
  position,
  onChange,
  onRouteChange,
  style = "mapbox://styles/mapbox/navigation-night-v1",
  editable = true,
  showControls = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const drawRef = useRef<any>(null);

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
    if (showControls) {
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }));
    }

    // Draw control solo si es editable
    let draw: MapboxDraw | null = null;
    if (editable) {
      draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          line_string: true,
          trash: true,
        },
        defaultMode: "simple_select",
      });
      drawRef.current = draw;
      map.addControl(draw, "top-left");
    }

    // Marker
    const marker = new mapboxgl.Marker({ draggable: editable }) // draggable solo si editable
      .setLngLat([position.lng, position.lat])
      .addTo(map);
    markerRef.current = marker;

    // Drag end -> callback
    if (editable) {
      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        onChange({ lat: lngLat.lat, lng: lngLat.lng });
      });
    }

    // Click en mapa -> mover marcador
    const onMapClick = (e: mapboxgl.MapMouseEvent) => {
      if (!editable) return; // <- si no editable, no mover
      const { lngLat } = e;
      marker.setLngLat(lngLat);
      onChange({ lat: lngLat.lat, lng: lngLat.lng });
    };
    map.on("click", onMapClick);

    // Escuchar cambios en el dibujo
    const handleDrawUpdate = () => {
      if (!drawRef.current || !onRouteChange) return;
      const data = drawRef.current.getAll();

      if (!data || !data.features || data.features.length === 0) {
        onRouteChange([]);
        return;
      }

      const feat = data.features[0];
      if (!feat.geometry || !feat.geometry.coordinates) {
        onRouteChange([]);
        return;
      }

      const coords = feat.geometry.coordinates.map((c: [number, number]) => ({
        lng: c[0],
        lat: c[1],
      }));
      onRouteChange(coords);
    };

    if (editable) {
      map.on("draw.create", handleDrawUpdate);
      map.on("draw.update", handleDrawUpdate);
      map.on("draw.delete", handleDrawUpdate);
    }

    // cleanup
    return () => {
      map.off("click", onMapClick);
      if (editable) {
        map.off("draw.create", handleDrawUpdate);
        map.off("draw.update", handleDrawUpdate);
        map.off("draw.delete", handleDrawUpdate);
      }
      if (marker) marker.remove();
      if (draw) map.removeControl(draw);
      map.remove();
      mapRef.current = null;
    };
  }, [editable, showControls, style]);

  // Si la prop position cambia desde padre
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLngLat([position.lng, position.lat]);
    }
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [position.lng, position.lat],
        essential: true,
      });
    }
  }, [position.lat, position.lng]);

  return (
    <div className="w-full h-full rounded-md overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
