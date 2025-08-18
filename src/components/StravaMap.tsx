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
