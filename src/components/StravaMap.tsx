// export default StravaMap;
"use client";

import { useEffect, useRef, useState } from "react";

// Lazy loading for better performance
let mapboxgl: any = null;
let mapboxLoaded = false;

type StravaMapProps = {
  coords: [number, number][];
};

export default function StravaMap({ coords }: StravaMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const finishMarkerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // helpers
  const makeRoute = (c: [number, number][]) =>
    ({
      type: "Feature",
      geometry: { type: "LineString", coordinates: c },
      properties: {},
    }) as GeoJSON.Feature<GeoJSON.LineString>;

  const makePoint = (c: [number, number]) =>
    ({
      type: "Feature",
      geometry: { type: "Point", coordinates: c },
      properties: {},
    }) as GeoJSON.Feature<GeoJSON.Point>;

  const fitToBounds = (map: any, c: [number, number][]) => {
    if (!c.length) return;
    const bounds = new mapboxgl.LngLatBounds(c[0], c[0]);
    for (let i = 1; i < c.length; i++) bounds.extend(c[i]);
    map.fitBounds(bounds, { padding: 40 });
  };

  // Init map (una sola vez)
  useEffect(() => {
    const initMap = async () => {
      if (!mapContainerRef.current || mapRef.current) return;

      try {
        // Lazy load mapbox-gl library and CSS
        if (!mapboxLoaded) {
          const mapboxModule = await import("mapbox-gl");
          mapboxgl = mapboxModule.default;

          // Dynamically load CSS
          if (!document.querySelector('link[href*="mapbox-gl.css"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://api.mapbox.com/mapbox-gl-js/v3.1.0/mapbox-gl.css";
            document.head.appendChild(link);
          }

          mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
          mapboxLoaded = true;
        }

        setIsLoading(false);

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: "mapbox://styles/mapbox/navigation-night-v1",
          center: coords[0] ?? [0, 0],
          zoom: 12,
        });
        mapRef.current = map;

    map.on("load", () => {
      // Ruta
      map.addSource("route", { type: "geojson", data: makeRoute(coords) });
      map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#FC4C02", "line-width": 4 },
      });

      if (coords.length > 0) {
        // Inicio (círculo verde)
        map.addSource("start-point", {
          type: "geojson",
          data: makePoint(coords[0]),
        });
        map.addLayer({
          id: "start-point",
          type: "circle",
          source: "start-point",
          paint: {
            "circle-radius": 4,
            "circle-color": "#2ECC71",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#fff",
          },
        });
        const finishEl = document.createElement("div");
        finishEl.innerHTML = "🏁";
        finishEl.style.fontSize = "13px";
        finishEl.style.lineHeight = "13px";

        const finishMarker = new mapboxgl.Marker({ element: finishEl })
          .setLngLat(coords[coords.length - 1])
          .setPopup(new mapboxgl.Popup().setText("Fin"))
          .addTo(map);

        finishMarkerRef.current = finishMarker;

        fitToBounds(map, coords);
      }
    });

      } catch (error) {
        console.error("Error initializing Mapbox:", error);
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      finishMarkerRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // no dependas de coords acá para no re-inicializar

  // Actualizaciones cuando cambian las coords
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // route
    const routeSource = map.getSource("route");
    if (routeSource) routeSource.setData(makeRoute(coords));

    // start point
    const startSrc = map.getSource("start-point");
    if (startSrc && coords.length > 0) startSrc.setData(makePoint(coords[0]));

    // finish marker
    if (finishMarkerRef.current && coords.length > 0) {
      finishMarkerRef.current.setLngLat(coords[coords.length - 1]);
    }

    if (coords.length > 0) fitToBounds(map, coords);
  }, [coords]);

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Cargando mapa...</p>
          </div>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
