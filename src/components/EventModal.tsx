"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useSession } from "next-auth/react";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: any;
    title: string;
    date: string;
    time: string;
    location: string;
    teacher: string;
    participants: string[];
    locationCoords: { lat: number; lng: number } | string | string[] | null;
  } | null;
}

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
});

function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export default function EventModal({
  isOpen,
  onClose,
  event,
}: EventModalProps) {
  const { data: session } = useSession();
  const [yaUnido, setYaUnido] = useState(false);
  const router = useRouter();
  const [miembros, setMiembros] = useState([]);

  useEffect(() => {
    console.log("Evento recibido:", event);
  }, [event]);
  useEffect(() => {
    const fetchMiembros = async () => {
      try {
        const res = await fetch(`/api/social/miembros?salidaId=${event.id}`);
        const data = await res.json();
        setMiembros(data);
      } catch (err) {
        console.error("Error al obtener los miembros:", err);
      }
    };

    fetchMiembros();
  }, [event?.id]);

  useEffect(() => {
    const checkUnido = async () => {
      if (!event?.id) return;
      const res = await fetch("/api/social/unirse/estado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salidaId: event.id }),
      });
      const data = await res.json();
      setYaUnido(data.unido);
    };
    if (session) checkUnido();
  }, [event?.id, session]);

  if (!isOpen || !event || !event.locationCoords) return null;

  // Normalizar las coordenadas
  let lat = 0,
    lng = 0;

  if (Array.isArray(event.locationCoords)) {
    [lat, lng] = event.locationCoords.map(Number);
  } else if (typeof event.locationCoords === "string") {
    try {
      const parsed = JSON.parse(event.locationCoords);
      if (Array.isArray(parsed)) {
        [lat, lng] = parsed.map(Number);
      } else if (parsed.lat && parsed.lng) {
        lat = Number(parsed.lat);
        lng = Number(parsed.lng);
      }
    } catch (err) {
      console.error("Error al parsear locationCoords:", err);
      return null;
    }
  } else if (
    typeof event.locationCoords === "object" &&
    event.locationCoords !== null
  ) {
    // Manejo del objeto directo { lat, lng }
    lat = Number(event.locationCoords.lat);
    lng = Number(event.locationCoords.lng);
  } else {
    return null;
  }

  const handleUnirse = async () => {
    if (!event?.id) return;

    try {
      const res = await fetch("/api/social/unirse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ salidaId: event.id }),
      });

      if (res.ok) {
        alert("¡Te uniste exitosamente!");
        onClose();
      } else {
        const msg = await res.text();
        alert("Error: " + msg);
      }
    } catch (err) {
      console.error("Error al unirse:", err);
      alert("Ocurrió un error al intentar unirte.");
    }
  };

  const handleAccion = async () => {
    const metodo = yaUnido ? "DELETE" : "POST";
    const url = yaUnido
      ? `/api/social/unirse?salidaId=${event.id}`
      : "/api/social/unirse";

    const res = await fetch(url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
      },
      body: yaUnido ? null : JSON.stringify({ salidaId: event.id }),
    });

    if (res.ok) {
      alert(yaUnido ? "Has salido de la salida" : "¡Te uniste exitosamente!");
      setYaUnido(!yaUnido);
    } else {
      const msg = await res.text();
      alert("Error: " + msg);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999999] flex items-end justify-center ">
      <div className="EventModal w-full max-w-md rounded-t-2xl p-4 space-y-4 relative">
        <button
          className="absolute rounded-[12px] bg-white top-2 right-4 text-[12px] px-1"
          onClick={onClose}
        >
          ✕
        </button>

        <div className="w-full h-40 rounded-xl overflow-hidden">
          {/* <MapComponent
         key={`${lat}-${lng}`}
          position={{ lat, lng }}
          onChange={() => {}}
  
          
        /> */}

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
        </div>

        <div className="text-sm">
          <p className="text-md flex i font-semibold tems-center gap-1 text-white pb-[6px]">
            {" "}
            <img
              src="/assets/icons/Location.svg"
              alt=""
              className="w-[18px] h-[18px] object-cover"
            />{" "}
            {event.location}
          </p>
          <p className="text-xs flex items-center gap-1 font-semibold  text-white">
            <img
              src="/assets/icons/Calendar.svg"
              alt=""
              className="w-[14px] h-[14px] object-cover"
            />{" "}
            {event.date} - {event.time} hs
          </p>
        </div>

        <div className="text-sm text-white">
          <p className="text-md flex items-center gap-1 text-white font-semibold">
            <p className="font-bold">Organizador:</p>
            <img
              src="/assets/icons/person_24dp_E8EAED.svg"
              alt=""
              className="w-[14px] h-[14px] object-cover"
            />
            {event.teacher}
          </p>

          <div className="flex flex-col items-start gap-2 mt-1">
            <span className="font-bold">Participantes:</span>
            <div className="flex gap-1">
              {miembros.length > 0 ? (
              <>
                {miembros.slice(0, 2).map((m) => (
                  <img
                    key={m._id}
                    src={m.imagen}
                    alt={m.nombre}
                    className="h-8 w-8 rounded-full object-cover border"
                    title={m.nombre}
                    onError={(e) =>
                      ((e.target as HTMLImageElement).src = "/assets/icons/person_24dp_E8EAED.svg")
                    }
                  />
                ))}
                {miembros.length > 2 && (
                  <div className="h-8 w-8 rounded-full bg-white text-xs flex items-center justify-center border text-orange-500 border font-semibold">
                    +{miembros.length - 2}
                  </div>
                )}
              </>
            ) : (
              <span className="text-xs text-white font-semibold">Nadie se ha unido aún</span>
            )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
          onClick={handleAccion}
          className={`w-[150px] py-2 border rounded-[15px] font-semibold transition ${
            yaUnido
              ? "border-red-600  text-red-600"
              : "border-orange-500 text-orange-500 bg-orange-500 text-white"
          }`}
        >
          {yaUnido ? "Salir" : "Machear"}
        </button>

        <button
          onClick={() => router.push(`/social/${event.id}`)}
          className="block mx-auto text-sm text-[#FFFFFF]"
        >
          Más info
        </button>

        </div>

        
      </div>
    </div>
  );
}
