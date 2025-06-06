'use client';
import React, { useEffect, useState }  from 'react';
import { useRouter } from 'next/navigation';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useSession } from 'next-auth/react';


delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id;
    title: string;
    date: string;
    time: string;
    location: string;
    teacher: string;
    participants: string[];
    locationCoords: string[] | string | null;
  } | null;
}

export default function EventModal({ isOpen, onClose, event }: EventModalProps) {
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
  let lat = 0, lng = 0;

if (Array.isArray(event.locationCoords)) {
  [lat, lng] = event.locationCoords.map(Number);
} else if (typeof event.locationCoords === 'string') {
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
} else if (typeof event.locationCoords === 'object' && event.locationCoords !== null) {
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
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-[80px]">
      <div className="bg-[#aeadad] w-full max-w-md rounded-t-2xl p-4 space-y-4 relative">
        <button
          className="absolute rounded-[12px] bg-white top-2 right-4 text-[12px] px-1"
          onClick={onClose}
        >
          ✕
        </button>

        <div className="w-full h-40 rounded-xl overflow-hidden">
          <MapContainer
            center={[lat, lng]}
            zoom={15}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[lat, lng]}>
              <Popup>{event.title}</Popup>
            </Marker>
          </MapContainer>
        </div>

        <div className="text-sm">
          <p className="text-xs flex items-center gap-1 text-white pb-[6px]">
            {" "}
            <img
              src="/assets/icons/Location.svg"
              alt=""
              className="w-[14px] h-[14px] object-cover"
            />{" "}
            {event.location}
          </p>
          <p className="text-xs flex items-center gap-1  text-white">
            <img
              src="/assets/icons/Calendar.svg"
              alt=""
              className="w-[14px] h-[14px] object-cover"
            />{" "}
            {event.date}- {event.time}
          </p>
        </div>

<div className="text-sm text-white">
  <p className="text-xs flex items-center gap-1 text-white">
    <img
      src="/assets/icons/person_24dp_E8EAED.svg"
      alt=""
      className="w-[14px] h-[14px] object-cover"
    />
    {event.teacher}
  </p>

  <div className="flex items-center gap-2 mt-1">
    <span>Participantes:</span>
    <div className="flex gap-1">
      {miembros.map((m) => (
        <img
          key={m._id}
          src={m.imagen}
          alt={m.nombre}
          className="h-8 w-8 rounded-full object-cover border"
          title={m.nombre}
        />
      ))}
    </div>
  </div>
</div>

        <button
          onClick={handleAccion}
          className={`w-full py-2 border rounded-full font-semibold transition ${
            yaUnido ? "border-red-600 text-red-600 hover:bg-red-600 hover:text-white" :
                      "border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
          }`}
        >
          {yaUnido ? "Salir" : "Unirse"}
        </button>

        <button
          onClick={() => router.push(`/social/${event.id}`)}
          className="block mx-auto text-sm text-[#FFFFFF]"
        >
          Más info
        </button>
      </div>
    </div>
  );
}
