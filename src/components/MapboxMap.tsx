"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

interface MapboxMapProps {
  onLocationSelect?: (
    coords: { lat: number; lng: number },
    address: string
  ) => void;
  initialCoords?: { lat: number; lng: number };
  className?: string;
}

export interface MapboxMapRef {
  updateMarker: (coords: { lat: number; lng: number }) => void;
  getMap: () => any;
}

const MapboxMap = forwardRef<MapboxMapRef, MapboxMapProps>(
  (
    {
      onLocationSelect,
      initialCoords = { lat: -26.8333, lng: -65.2167 },
      className = "w-full h-[300px]",
    },
    ref
  ) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<any>(null);
    const marker = useRef<any>(null);
    const onLocationSelectRef = useRef(onLocationSelect);

    // Update the ref whenever onLocationSelect changes
    onLocationSelectRef.current = onLocationSelect;

    useImperativeHandle(ref, () => ({
      updateMarker: (coords: { lat: number; lng: number }) => {
        if (marker.current) {
          marker.current.setLngLat([coords.lng, coords.lat]);
          if (map.current) {
            map.current.flyTo({
              center: [coords.lng, coords.lat],
              zoom: 15,
            });
          }
        }
      },
      getMap: () => map.current,
    }));

    useEffect(() => {
      let mapboxgl: any;

      const initializeMap = async () => {
        try {
          // Dynamic import to avoid SSR issues
          mapboxgl = (await import("mapbox-gl")).default;

          // Dynamically load CSS
          if (!document.querySelector('link[href*="mapbox-gl.css"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://api.mapbox.com/mapbox-gl-js/v3.1.0/mapbox-gl.css";
            document.head.appendChild(link);
          }

          if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
            return;
          }

          mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

          if (!mapContainer.current || map.current) return;

          // Ensure container has dimensions
          const container = mapContainer.current;
          if (container.offsetWidth === 0 || container.offsetHeight === 0) {
            // Retry after a short delay
            setTimeout(() => initializeMap(), 100);
            return;
          }

          map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: "mapbox://styles/mapbox/streets-v11",
            center: [initialCoords.lng, initialCoords.lat],
            zoom: 13,
            preserveDrawingBuffer: true,
            antialias: true,
          });

          map.current.on("load", () => {

            // Add marker
            marker.current = new mapboxgl.Marker({ draggable: true })
              .setLngLat([initialCoords.lng, initialCoords.lat])
              .addTo(map.current);

            // Handle marker drag
            marker.current.on("dragend", async () => {
              const lngLat = marker.current.getLngLat();
              const coords = { lat: lngLat.lat, lng: lngLat.lng };

              try {
                const response = await fetch(
                  `/api/search/reverse?lat=${coords.lat}&lon=${coords.lng}`
                );
                const data = await response.json();
                const address =
                  data.display_name ||
                  `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;

                onLocationSelectRef.current?.(coords, address);
              } catch (error) {
                onLocationSelectRef.current?.(
                  coords,
                  `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
                );
              }
            });

            // Handle map click
            map.current.on("click", async (e: any) => {
              const coords = { lat: e.lngLat.lat, lng: e.lngLat.lng };

              marker.current.setLngLat([coords.lng, coords.lat]);

              try {
                const response = await fetch(
                  `/api/search/reverse?lat=${coords.lat}&lon=${coords.lng}`
                );
                const data = await response.json();
                const address =
                  data.display_name ||
                  `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;

                onLocationSelectRef.current?.(coords, address);
              } catch (error) {
                onLocationSelectRef.current?.(
                  coords,
                  `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
                );
              }
            });

            // Add navigation controls
            map.current.addControl(new mapboxgl.NavigationControl());

            // Trigger resize to ensure proper rendering
            setTimeout(() => {
              if (map.current) {
                map.current.resize();
              }
            }, 100);
          });

          map.current.on("error", (e: any) => {
          });

          map.current.on("style.load", () => {
          });

          map.current.on("styledata", () => {
          });

          map.current.on("render", () => {
            // Too noisy, but useful for debugging
            // console.log('Map render event');
          });
        } catch (error) {
        }
      };

      initializeMap();

      return () => {
        if (marker.current) {
          marker.current.remove();
        }
        if (map.current) {
          map.current.remove();
        }
      };
    }, [initialCoords.lat, initialCoords.lng]);

    return (
      <div
        ref={mapContainer}
        className={`${className} bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden`}
        style={{ minHeight: "300px" }}
      />
    );
  }
);

MapboxMap.displayName = "MapboxMap";

export default MapboxMap;
