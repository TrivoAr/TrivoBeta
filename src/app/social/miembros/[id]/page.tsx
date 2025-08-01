"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useSession } from "next-auth/react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  FaInstagram,
  FaFacebookF,
  FaTwitter,
  FaUserCircle,
} from "react-icons/fa";

// Configuración del icono por defecto de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
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
  telnumber: string;
  imagen: string;
  instagram?: string;
}

export default function EventPage({ params }: PageProps) {
  const { data: session } = useSession();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
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
        console.log("miembro puto", data);
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
  console.log(filteredMiembros);

  const placeholders = Array.from(
    { length: filteredMiembros.length },
    (_, index) => index + 1
  );
  console.log("que pingo es esto", placeholders);

  if (loading)
    return (
      <div
        style={{
          width: 390,
          height: 844,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          background: "#fff",
        }}
      >
        {/* Flecha y título */}
        <div
          className="flex-col "
          style={{ display: "flex", alignItems: "start", gap: 8 }}
        >
          <Skeleton circle height={32} width={32} /> {/* botón atrás */}
          <Skeleton height={24} width={120} /> {/* título "Participantes" */}
        </div>

        {/* Input de búsqueda */}
        <Skeleton height={40} width="100%" borderRadius={8} />

        {/* Encabezado tabla: Foto | Nombre | Acciones */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 8,
          }}
        >
          <Skeleton height={16} width={40} />
          <Skeleton height={16} width={60} />
          {event?.creador_id?._id &&
          session?.user?.id === event.creador_id._id ? (
            <Skeleton height={16} width={50} />
          ) : null}
        </div>

        {/* Lista de participantes */}
        {[1, 2].map((item) => (
          <div
            key={item}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 16,
            }}
          >
            <Skeleton circle height={40} width={40} /> {/* foto */}
            <Skeleton height={16} width={180} /> {/* nombre */}
            {event?.creador_id?._id &&
            session?.user?.id === event.creador_id._id ? (
              <Skeleton height={24} width={24} />
            ) : null}
          </div>
        ))}
      </div>
    );

  if (error || !event)
    return (
      <main className="py-20 text-center">
        {error || "Evento no encontrado"}
      </main>
    );

  return (
    <div className="w-[390px] p-4 relative">
      <button
        onClick={() => router.back()}
        className="text-[#C76C01] relative bg-white shadow-md rounded-full w-[40px] h-[40px] flex justify-center items-center left-[10px]"
      >
        <img
          src="/assets/icons/Collapse Arrow.svg"
          alt="callback"
          className="h-[20px] w-[20px]"
        />
      </button>

      <p className="font-bold text-orange-500 text-2xl mb-3 mt-3">
        Participantes
      </p>
      <div className="px-1 mb-5">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar participante..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
      </div>

      <table className="w-[370px]">
        <thead>
          <tr>
            <th className="font-bold">Foto</th>
            <th className="font-bold">Nombre</th>
            {event?.creador_id?._id &&
              session?.user?.id === event.creador_id._id && (
                <th className="font-bold">Acciones</th>
              )}
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
                <img
                  src={miembro.imagen}
                  alt={miembro.nombre}
                  className="w-[50px] h-[50px] rounded-full"
                />
              </td>
              <td>{miembro.nombre}</td>
              {session?.user?.id === event?.creador_id?._id ? (
                <td>
                  {" "}
                  <button>
                    {" "}
                    <svg
                      viewBox="0 0 24 24"
                      height={25}
                      width={25}
                      fill="none"
                      stroke="#6f6d6d"
                    >
                      <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                      <g
                        id="SVGRepo_tracerCarrier"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></g>
                      <g id="SVGRepo_iconCarrier">
                        {" "}
                        <path
                          d="M20.5001 6H3.5"
                          stroke="#6e6c6c"
                          stroke-width="1.5"
                          stroke-linecap="round"
                        ></path>{" "}
                        <path
                          d="M18.8332 8.5L18.3732 15.3991C18.1962 18.054 18.1077 19.3815 17.2427 20.1907C16.3777 21 15.0473 21 12.3865 21H11.6132C8.95235 21 7.62195 21 6.75694 20.1907C5.89194 19.3815 5.80344 18.054 5.62644 15.3991L5.1665 8.5"
                          stroke="#6e6c6c"
                          stroke-width="1.5"
                          stroke-linecap="round"
                        ></path>{" "}
                        <path
                          d="M9.5 11L10 16"
                          stroke="#6e6c6c"
                          stroke-width="1.5"
                          stroke-linecap="round"
                        ></path>{" "}
                        <path
                          d="M14.5 11L14 16"
                          stroke="#6e6c6c"
                          stroke-width="1.5"
                          stroke-linecap="round"
                        ></path>{" "}
                        <path
                          d="M6.5 6C6.55588 6 6.58382 6 6.60915 5.99936C7.43259 5.97849 8.15902 5.45491 8.43922 4.68032C8.44784 4.65649 8.45667 4.62999 8.47434 4.57697L8.57143 4.28571C8.65431 4.03708 8.69575 3.91276 8.75071 3.8072C8.97001 3.38607 9.37574 3.09364 9.84461 3.01877C9.96213 3 10.0932 3 10.3553 3H13.6447C13.9068 3 14.0379 3 14.1554 3.01877C14.6243 3.09364 15.03 3.38607 15.2493 3.8072C15.3043 3.91276 15.3457 4.03708 15.4286 4.28571L15.5257 4.57697C15.5433 4.62992 15.5522 4.65651 15.5608 4.68032C15.841 5.45491 16.5674 5.97849 17.3909 5.99936C17.4162 6 17.4441 6 17.5 6"
                          stroke="#6e6c6c"
                          stroke-width="1.5"
                        ></path>{" "}
                      </g>
                    </svg>
                  </button>
                </td>
              ) : null}
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
            onClick={(e) => e.stopPropagation()}
          >
            {/* Imagen clara de fondo */}
            <img
              src={selectedMiembro.imagen}
              alt={selectedMiembro.nombre}
              className="object-cover w-full h-full"
            />

            {/* Overlay SOLO en parte inferior */}
            <div className="absolute inset-0 flex flex-col justify-end">
              <div className="w-full p-4 bg-gradient-to-t from-black/60 via-black/80 to-transparent">
                <p className="text-white text-xl font-semibold mb-1" onClick={() => router.push(`/profile/${selectedMiembro._id}`)}>
                  {selectedMiembro.nombre}
                </p>
                <p className="text-white text-sm opacity-80">
                  {selectedMiembro.email}
                </p>
                <p className="text-white text-xs mt-2">
                    {selectedMiembro.instagram && (
                                <a
                                  href={`https://instagram.com/${selectedMiembro.instagram}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <FaInstagram />
                                </a>
                              )}
                </p>
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
