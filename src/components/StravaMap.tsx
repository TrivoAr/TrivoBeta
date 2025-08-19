<<<<<<< HEAD
// "use client";

// import { useState } from "react";
// import Map, { Source, Layer } from "@mapbox/mapbox-gl-draw"
// import polyline from "polyline";
// import mapboxgl from "mapbox-gl";

// mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;


// export default function StravaMap({ summary_polyline }: { summary_polyline: string }) {
// //   const coords = polyline.decode(summary_polyline);
// //   const geojson = {
// //     type: "Feature",
// //     geometry: {
// //       type: "LineString",
// //       coordinates: coords.map(([lat, lng]) => [lng, lat]),
// //     },
// //   };

// if (!summary_polyline) {
//   return <p className="text-sm text-gray-600">No hay recorrido disponible.</p>;
// }

// const coords = polyline.decode(summary_polyline);
// const geojson = {
//   type: "Feature",
//   geometry: {
//     type: "LineString",
//     coordinates: coords.map(([lat, lng]) => [lng, lat]),
//   },
// };


//   return (
//     <Map
//       initialViewState={{
//         longitude: geojson.geometry.coordinates[0][0],
//         latitude: geojson.geometry.coordinates[0][1],
//         zoom: 13,
//       }}
//       style={{ width: "100%", height: "200px", borderRadius: "12px" }}
//       mapStyle="mapbox://styles/mapbox/outdoors-v12"
//     >
//       <Source id="route" type="geojson" data={geojson}>
//         <Layer
//           id="route-layer"
//           type="line"
//           paint={{
//             "line-color": "#FC4C02", // naranja Strava
//             "line-width": 4,
//           }}
//         />
//       </Source>
//     </Map>
//   );
// }

"use client";

import Map, { Source, Layer } from "react-map-gl/maplibre";
import polyline from "polyline";
import type { FeatureCollection, LineString } from "geojson";

export default function StravaMap({ summary_polyline }: { summary_polyline?: string }) {
  if (!summary_polyline) {
    return <p className="text-sm text-gray-600">No hay recorrido disponible.</p>;
  }

  const coords = polyline.decode(summary_polyline);
  if (!coords.length) return null; // prevenir error si coords está vacío

const geojson: FeatureCollection<LineString> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: coords.map(([lat, lng]) => [lng, lat]),
      },
      properties: {}, // opcional, pero a veces TypeScript lo requiere
    },
  ],
};

  return (
  <Map
  initialViewState={{
    longitude: geojson.features[0].geometry.coordinates[0][0],
    latitude: geojson.features[0].geometry.coordinates[0][1],
    zoom: 13,
  }}
  style={{ width: "100%", height: "200px", borderRadius: "12px" }}
  mapStyle="mapbox://styles/mapbox/outdoors-v12"
>
      <Source id="route" type="geojson" data={geojson}>
        <Layer
          id="route-layer"
          type="line"
          paint={{
            "line-color": "#FC4C02",
            "line-width": 4,
          }}
        />
      </Source>
    </Map>
  );
}
=======
// components/StravaMap.tsx
// import { useEffect, useRef } from "react";
// import mapboxgl, { Map as MapboxMap, GeoJSONSource } from "mapbox-gl";

// // Asegúrate de tener tu token en .env.local
// mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

// type StravaMapProps = {
//   coords: [number, number][]; // array de [lng, lat]
// };

// const StravaMap = ({ coords }: StravaMapProps) => {
//   const mapContainer = useRef<HTMLDivElement>(null);
//   const map = useRef<MapboxMap | null>(null);

//   useEffect(() => {
//     if (map.current) return; // mapa ya inicializado

//     map.current = new mapboxgl.Map({
//       container: mapContainer.current!,
//       style: "mapbox://styles/mapbox/streets-v11",
//       center: coords[0] || [0, 0],
//       zoom: 12,
//     });

//     map.current.on("load", () => {
//       // Crear GeoJSON inicial
//       const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
//         type: "Feature",
//         geometry: {
//           type: "LineString",
//           coordinates: coords,
//         },
//         properties: {},
//       };

//       // Agregar source
//       map.current!.addSource("route", {
//         type: "geojson",
//         data: geojson,
//       });

//       // Agregar layer para la línea
//       map.current!.addLayer({
//         id: "route",
//         type: "line",
//         source: "route",
//         layout: {
//           "line-join": "round",
//           "line-cap": "round",
//         },
//         paint: {
//           "line-color": "#FC4C02",
//           "line-width": 4,
//         },
//       });
//     });
//   }, []);

//   // Actualizar ruta si cambian coords
//   useEffect(() => {
//     if (!map.current) return;

//     const source = map.current.getSource("route") as GeoJSONSource | undefined;
//     if (!source) return;

//     const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
//       type: "Feature",
//       geometry: {
//         type: "LineString",
//         coordinates: coords,
//       },
//       properties: {},
//     };

//     source.setData(geojson);
//   }, [coords]);

//   return <div ref={mapContainer} className="w-full h-full" />;
// };

// export default StravaMap;

// components/StravaMap.tsx
import { useEffect, useRef } from "react";
import mapboxgl, { Map as MapboxMap, GeoJSONSource } from "mapbox-gl";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type StravaMapProps = {
  coords: [number, number][];
};

const StravaMap = ({ coords }: StravaMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<MapboxMap | null>(null);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: "mapbox://styles/mapbox/light-v11", // estilo similar a Strava
      center: coords[0] || [0, 0],
      zoom: 12,
    });

    map.current.on("load", () => {
      const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: coords,
        },
        properties: {},
      };

      map.current!.addSource("route", {
        type: "geojson",
        data: geojson,
      });

      map.current!.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#FC4C02",
          "line-width": 4,
        },
      });

      // 🔹 Ajustar zoom y centrado según la ruta
      if (coords.length > 0) {
        const bounds = new mapboxgl.LngLatBounds(coords[0], coords[0]);
        coords.forEach(([lng, lat]) => bounds.extend([lng, lat]));
        map.current!.fitBounds(bounds, { padding: 40 });
      }
    });
  }, [coords]);

  // Actualizar ruta si cambian coords
  useEffect(() => {
    if (!map.current) return;

    const source = map.current.getSource("route") as GeoJSONSource | undefined;
    if (!source) return;

    const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: coords,
      },
      properties: {},
    };

    source.setData(geojson);

    // 🔹 También ajustar bounds al actualizar coords
    if (coords.length > 0) {
      const bounds = new mapboxgl.LngLatBounds(coords[0], coords[0]);
      coords.forEach(([lng, lat]) => bounds.extend([lng, lat]));
      map.current!.fitBounds(bounds, { padding: 40 });
    }
  }, [coords]);

  return <div ref={mapContainer} className="w-full h-full" />;
};

export default StravaMap;
>>>>>>> mat-clean
