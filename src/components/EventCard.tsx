"use client";

import Image from "next/image";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { getDeporteFallbackImage } from "@/utils/imageFallbacks";

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
};

type EventCardProps = {
  event: EventType;
  onJoin?: (event: EventType) => void;
  onMap?: (coords: { lat: number; lng: number }) => void;
  variant?: "default" | "night";
};

export default function EventCard({ event }: EventCardProps) {
  const [esFavorito, setEsFavorito] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const toggleFavorito = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!session?.user?.id) {
      toast.error("Debes iniciar sesión para agregar a favoritos.");
      return;
    }

    try {
      const res = await axios.post(`/api/favoritos/sociales/${event._id}`);
      const data = res.data;

      setEsFavorito(data.favorito);
      toast.success(
        data.favorito
          ? "Salida agregada a favoritos"
          : "Salida eliminada de favoritos"
      );
    } catch (error) {
      toast.error("Hubo un error al actualizar favoritos.");
    }
  };

  useEffect(() => {
    const checkFavorito = async () => {
      if (!session?.user?.id) return;

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

  const handleCardClick = () => {
    router.push(`/social/${event._id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group cursor-pointer bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 w-full"
    >
      {/* Image Container */}
      <div className="relative w-full h-[240px] overflow-hidden bg-gray-100 dark:bg-gray-700">
        <Image
          src={event.image || getDeporteFallbackImage(event.category)}
          alt={event.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, 640px"
        />

        {/* Favorite Button */}
        <button
          onClick={toggleFavorito}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-md hover:scale-110 transition-transform duration-200 z-10"
          aria-label={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          <Heart
            size={20}
            className={esFavorito ? "fill-red-500 text-red-500" : "text-gray-600 dark:text-gray-300"}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        {/* Title */}
        <h3 className="font-bold text-lg text-foreground line-clamp-2 leading-tight">
          {event.title}
        </h3>

        {/* Location, Price, and Difficulty Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Location */}
          <span className="text-sm text-muted-foreground">
            {event.localidad}
          </span>

          {/* Price Chip */}
          {event.price !== undefined && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 font-medium">
              {event.price === "0" || event.price === "0.00"
                ? "Gratis"
                : `$${Number(event.price).toLocaleString("es-AR")}`}
            </span>
          )}

          {/* Difficulty Chip */}
          {event.dificultad && (
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${event.dificultad.toLowerCase() === "facil"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                  : event.dificultad.toLowerCase() === "media"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                }`}
            >
              {event.dificultad.charAt(0).toUpperCase() + event.dificultad.slice(1)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
