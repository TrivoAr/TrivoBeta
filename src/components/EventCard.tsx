"use client";

import Image from "next/image";
import { Clock, MapPin, Tag, Moon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import LoginModal from "@/components/Modals/LoginModal";
import EventModal from "@/components/EventModal";
import { useSession } from "next-auth/react";
import { isNightEvent } from "@/lib/theme";
import { ClubTrekkingBadge } from "@/components/club-trekking/ClubTrekkingBadge";

type EventType = {
  _id: string;
  title: string;
  date: string;
  time: string;
  price?: string;
  image: string;
  location: string;
  creadorId: string;
  localidad: string;
  category: string;
  locationCoords?: {
    lat: number;
    lng: number;
  };
  teacher?: string;
  dificultad?: string;
  stravaMap?: {
    id: string;
    summary_polyline: string;
    polyline: string;
    resource_state: number;
  };
  cupo: number;
  fecha?: string;
  hora?: string;
  clubTrekking?: {
    incluidaEnMembresia: boolean;
    requiereCheckIn: boolean;
    cupoMiembros: number;
    miembrosActuales: number;
  };
};

interface Miembro {
  _id: string;
  firstname: string;
  lastname: string;
  imagen: string;
  estado: string;
  pago_id: {
    comprobanteUrl: string;
    estado: string;
    salidaId: string;
    userId: string;
    _id: string;
  };
}

type ModalEvent = {
  id: any;
  locationCoords: { lat: number; lng: number } | string | string[] | null;
  stravaMap?: {
    id: string;
    summary_polyline: string;
    polyline: string;
    resource_state: number;
  };
};

type EventCardProps = {
  event: EventType;
  onJoin?: (event: EventType) => void;
  onMap?: (coords: { lat: number; lng: number }) => void;
  variant?: "default" | "night";
};

export default function EventCard({
  event,
  onJoin,
  onMap,
  variant,
}: EventCardProps) {
  const [esFavorito, setEsFavorito] = useState(false);
  const { data: session } = useSession();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ModalEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const eventForNightCheck = {
    _id: event._id,
    fecha: event.fecha || event.date,
    hora: event.hora || event.time,
    nombre: event.title,
  };

  const isNight = variant === "night" || isNightEvent(eventForNightCheck);

  const cardClasses = useMemo(() => {
    const baseClasses =
      "rounded-2xl overflow-hidden shadow-md w-[360px] transition-all duration-300";

    if (isNight) {
      return `${baseClasses} theme-bg-secondary theme-glow night-pulse`;
    }

    return `${baseClasses} bg-card`;
  }, [isNight]);

  const parseLocalDate = (isoDateString: string): string => {
    const [year, month, day] = isoDateString.split("-");
    const localDate = new Date(Number(year), Number(month) - 1, Number(day));
    return localDate.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };
  const router = useRouter();

  const toggleFavorito = async () => {
    if (!session?.user?.id) {
      toast.error("Debes iniciar sesión para agregar a favoritos.");
      setShowLoginModal(true);
      return;
    }

    try {
      const res = await axios.post(`/api/favoritos/sociales/${event._id}`);
      const data = res.data;

      setEsFavorito(data.favorito); // true o false según si fue agregado o removido
      toast.success(
        data.favorito
          ? "Academia agregada a favoritos"
          : "Academia eliminada de favoritos"
      );
    } catch (error) {
      toast.error("Hubo un error al actualizar favoritos.");
    }
  };

  useEffect(() => {
    const checkFavorito = async () => {
      try {
        const res = await fetch(`/api/favoritos/sociales/${event._id}`);
        const data = await res.json();
        setEsFavorito(data.favorito);
      } catch (err) {
        // Silently fail - favorito check is not critical
      }
    };

    checkFavorito();
  }, [event._id, session]);

  async function fetchMiembros(salidaId: string) {
    const res = await fetch(`/api/social/miembros/${salidaId}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Miembros ${res.status}: ${text || "error"}`);
    }
    return res.json(); // 👈 esto devuelve, pero nunca lo usás
  }

  useEffect(() => {
    const loadMiembros = async () => {
      try {
        const data = await fetchMiembros(event._id);

        // si solo querés los aprobados:
        const miembrosAprobados = data.filter(
          (m: Miembro) =>
            m.estado === "aprobado" || m.pago_id?.estado === "aprobado"
        );

        setMiembros(miembrosAprobados);
      } catch (err) {
        toast.error("No se pudieron cargar los cupos");
      }
    };

    loadMiembros();
  }, [event._id]);

  return (
    <div className={cardClasses} data-theme={isNight ? "night" : undefined}>
      {/* Imagen */}
      <div
        className="relative w-full h-[180px]"
        style={{
          backgroundImage: `url(${event.image})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      >
        <button
          className="btnFondo absolute top-2 right-5 text-white p-2 rounded-full shadow-md"
          onClick={toggleFavorito}
        >
          {esFavorito ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="red"
              viewBox="0 0 24 24"
              width="24"
              height="24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 3.5 4 5.5 4c1.54 0 3.04.99 3.57 2.36h1.87C13.46 4.99 14.96 4 16.5 4 18.5 4 20 6 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              stroke="black"
              viewBox="0 0 24 24"
              width="24"
              height="24"
            >
              <path
                d="M12.1 21.35l-1.1-1.05C5.14 15.24 2 12.32 2 8.5 2 6 3.98 4 6.5 4c1.74 0 3.41 1.01 4.13 2.44h1.74C14.09 5.01 15.76 4 17.5 4 20.02 4 22 6 22 8.5c0 3.82-3.14 6.74-8.9 11.8l-1 1.05z"
                strokeWidth="2"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Contenido */}
      <div className="p-4 space-y-2">
        {/* Encabezado */}
        <div className="flex justify-between items-start">
          <div className="flex-1 mr-2">
            <h2
              className={`font-bold text-md leading-snug ${
                isNight ? "theme-text-primary" : "text-foreground"
              }`}
            >
              {event.title}
            </h2>
            {isNight && (
              <div className="night-badge mt-1">
                <Moon size={12} />
                <span>Noche</span>
              </div>
            )}
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${
              isNight
                ? "theme-accent-bg-primary text-white"
                : "text-muted-foreground bg-muted"
            }`}
          >
            {event.localidad}
          </span>
        </div>

        <div className="flex w-full justify-between">
          <p
            className={`text-sm capitalize ${
              isNight ? "theme-text-secondary" : "text-muted-foreground"
            }`}
          >
            {event.category} · {event.dificultad}
          </p>
          <p
            className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${
              (event.cupo - miembros.length) / event.cupo > 0.5
                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                : (event.cupo - miembros.length) / event.cupo > 0.2
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                  : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
            }`}
          >
            Cupos: {event.cupo - miembros.length}/{event.cupo}
          </p>
        </div>

        {/* Fecha y hora */}
        <p
          className={`text-sm flex items-center gap-1 ${
            isNight ? "theme-text-primary" : "text-foreground"
          }`}
        >
          <Clock size={16} />
          {parseLocalDate(event.date)} {event.time} hs
        </p>

        {/* Badge del Club del Trekking */}
        {event.clubTrekking?.incluidaEnMembresia && (
          <div className="pt-1">
            <ClubTrekkingBadge
              variant="small"
              incluidaEnMembresia={true}
              showLabel={true}
            />
          </div>
        )}

        {/* Precio */}
        {event.price && (
          <p
            className="text-sm font-semibold flex items-center gap-1"
            style={{ color: "var(--theme-accent-primary)" }}
          >
            <Tag size={16} />{" "}
            {event.price === "0"
              ? "Gratis"
              : `$${Number(event.price).toLocaleString("es-AR")}`}
          </p>
        )}

        {/* Botones */}
        <div className="flex items-center justify-between mt-10 gap-2">
          <button
            onClick={() => router.push(`/social/${event._id}`)}
            className={`text-white rounded-[20px] h-[40px] transition-all ${
              isNight
                ? event.stravaMap?.id
                  ? "w-[50%] seasonal-gradient hover:opacity-90"
                  : "w-[90%] mx-auto seasonal-gradient hover:opacity-90"
                : event.stravaMap?.id
                  ? "w-[50%]"
                  : "w-[90%] mx-auto"
            }`}
            style={
              isNight
                ? {}
                : {
                    backgroundColor: "var(--theme-accent-primary)",
                  }
            }
            onMouseEnter={
              isNight
                ? undefined
                : (e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--theme-accent-secondary)";
                  }
            }
            onMouseLeave={
              isNight
                ? undefined
                : (e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--theme-accent-primary)";
                  }
            }
          >
            {isNight ? "Viví la experiencia nocturna" : "Unirse"}
          </button>
          {event.stravaMap?.id && event.stravaMap?.summary_polyline && (
            <button
              className={`flex justify-center items-center gap-2 rounded-[20px] border w-[50%] h-[40px] shadow-sm transition-colors ${
                isNight
                  ? "border-gray-600 theme-bg-primary hover:theme-accent-bg-secondary/20"
                  : "border-border bg-background hover:bg-accent"
              }`}
              onClick={() => {
                setSelectedEvent({
                  id: event._id,
                  locationCoords: event.locationCoords,
                  stravaMap: {
                    id: event.stravaMap.id,
                    summary_polyline: event.stravaMap.summary_polyline,
                    polyline: event.stravaMap.polyline,
                    resource_state: event.stravaMap.resource_state,
                  },
                });
                setIsModalOpen(true);
              }}
            >
              <MapPin size={16} className="mr-1" />
              Mapa
            </button>
          )}
        </div>
      </div>
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={selectedEvent}
      />
    </div>
  );
}
