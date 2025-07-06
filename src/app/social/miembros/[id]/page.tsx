"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useSession } from "next-auth/react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Configuración del icono por defecto de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface PageProps {
  params: { id: string };
}

interface EventData {
  _id: string;
  nombre: string;
  ubicacion: string;
  deporte: string;
  fecha: string;
  hora: string;
  duracion: string;
  descripcion: string;
  imagen: string;
  creador_id: {
    _id: string;
    firstname: string;
    lastname: string;
    imagen: string;
  };
  locationCoords?: { lat: number; lng: number };
}

interface Miembro {
  _id: string;
  nombre: string;
  email: string;
  imagen: string;
}

export default function EventPage({ params }: PageProps) {
  const { data: session } = useSession();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMiembro, setSelectedMiembro] = useState<Miembro | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await axios.get(`/api/social/${params.id}`);
        setEvent(response.data);
      } catch (err) {
        console.error("Error al cargar evento", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchMiembros = async () => {
      try {
        const res = await fetch(`/api/social/miembros?salidaId=${params.id}`);
        const data = await res.json();
        setMiembros(data);
      } catch (err) {
        console.error("Error al cargar miembros", err);
      }
    };

    fetchEvent();
    fetchMiembros();
  }, [params.id, session]);

  const filteredMiembros = miembros.filter((miembro) =>
    miembro.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <main className="py-20 text-center">Cargando participantes...</main>;
  if (error || !event) return <main className="py-20 text-center">{error || "Evento no encontrado"}</main>;

  return (
    <div className="w-[390px] p-4 relative">
      <button
        onClick={() => router.back()}
        className="text-[#C76C01] relative bg-white shadow-md rounded-full w-[40px] h-[40px] flex justify-center items-center left-[10px]"
      >
        <img src="/assets/icons/Collapse Arrow.svg" alt="callback" className="h-[20px] w-[20px]" />
      </button>

      <p className="font-bold text-orange-500 text-2xl mb-3 mt-3">Participantes</p>
      <div className="px-1 mb-5">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar participante..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
      </div>

      <table className="w-[300px]">
        <thead>
          <tr>
            <th className="font-bold">Foto</th>
            <th className="font-bold">Nombre</th>
          </tr>
        </thead>
        <tbody>
          {filteredMiembros.map((miembro, index) => (
            <tr 
              key={index} 
              className="w-full h-[70px] text-center cursor-pointer hover:bg-gray-100"
              onClick={() => setSelectedMiembro(miembro)}
            >
              <td className="flex justify-center items-center h-[70px]">
                <img src={miembro.imagen} alt={miembro.nombre} className="w-[50px] h-[50px] rounded-full" />
              </td>
              <td>{miembro.nombre}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Popup modal */}
      {selectedMiembro && (
  <div 
    className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
    onClick={() => setSelectedMiembro(null)}
  >
    <div 
      className="relative w-[300px] h-[450px] rounded-xl overflow-hidden shadow-lg"
      onClick={e => e.stopPropagation()}
    >
      {/* Imagen clara de fondo */}
      <img src={selectedMiembro.imagen} alt={selectedMiembro.nombre} className="object-cover w-full h-full" />

      {/* Overlay SOLO en parte inferior */}
      <div className="absolute inset-0 flex flex-col justify-end">
        <div className="w-full p-4 bg-gradient-to-t from-black/60 via-black/80 to-transparent">
          <p className="text-white text-xl font-semibold mb-1">{selectedMiembro.nombre}</p>
          <p className="text-white text-sm opacity-80">{selectedMiembro.email}</p>
          <p className="text-white text-xs mt-2">+54381123456</p>
        </div>
      </div>

      {/* Botón cerrar */}
      <button 
        className="absolute top-2 right-2 text-white text-xl bg-red-700 w-8 h-8 rounded-full"
        onClick={() => setSelectedMiembro(null)}
      >
        ✕
      </button>
    </div>
  </div>
)}


      <div className="pb-[100px]"></div>
    </div>
  );
}
