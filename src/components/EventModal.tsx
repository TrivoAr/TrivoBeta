"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";
import polyline from "@mapbox/polyline";
import StravaMap from "./StravaMap"; // tu componente

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: any;
    locationCoords: { lat: number; lng: number } | string | string[] | null;
    stravaMap?: {
      id: string;
      summary_polyline: string;
      polyline: string;
      resource_state: number;
    };
  } | null;
}

export default function EventModal({
  isOpen,
  onClose,
  event,
}: EventModalProps) {
  const router = useRouter();
  const [showFullMap, setShowFullMap] = useState(false);

  let coords: [number, number][] = [];

  if (event?.stravaMap?.summary_polyline) {
    const decoded = polyline.decode(event.stravaMap.summary_polyline);
    coords = decoded.map(([lat, lng]) => [lng, lat]);
  }

  if (!isOpen || !event || !event.locationCoords) return null;

  return (
    <div className="fixed inset-0 z-[9999999] flex items-end justify-center">
      {/* Modal principal */}
      <div className="EventModal flex flex-col items-center gap-2 justify-center w-full max-w-md rounded-t-2xl p-4 space-y-4 relative h-[500px] bg-[#111]">
        <button
          className="absolute rounded-full bg-white top-2 right-3 text-[15px] h-[30px] w-[30px] font-bold border"
          onClick={onClose}
        >
          ✕
        </button>

        <div className="self-start">
          <p className="text-white font-medium text-xl">Recorrido</p>
        </div>

        <div
          className="w-full h-64 rounded-xl overflow-hidden cursor-pointer relative"
          onClick={() => setShowFullMap(true)}
        >
          {coords.length > 0 ? (
            <>
              <StravaMap coords={coords} />
              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                Tocar para ampliar
              </div>
            </>
          ) : (
            <p className="text-center text-sm text-gray-400">
              No hay ruta disponible
            </p>
          )}
        </div>

        <button
          className="bg-[#C95100] rounded-[20px] text-white font-semibold w-[170px] h-[40px]"
          onClick={() => router.push(`/social/${event.id}`)}
        >
          Ver evento
        </button>
      </div>

      {/* Overlay fullscreen con el mapa */}
      {showFullMap && (
        <div className="fixed inset-0 bg-black z-[99999999] flex items-center justify-center">
          <button
            className="absolute top-4 right-4 z-50 rounded-full bg-white text-black font-bold w-[35px] h-[35px] shadow"
            onClick={() => setShowFullMap(false)}
          >
            ✕
          </button>
          <div className="w-full h-full">
            <StravaMap coords={coords} />
          </div>
        </div>
      )}
    </div>
  );
}
