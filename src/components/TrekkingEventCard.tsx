"use client";

import Image from "next/image";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { getImagenesToShow } from "@/utils/imageFallbacks";

type TrekkingEventType = {
  _id: string;
  title: string;
  image: string;
  imagenes?: string[];
  category: string;
  creadorId: string;
};

type TrekkingEventCardProps = {
  event: TrekkingEventType;
};

export default function TrekkingEventCard({ event }: TrekkingEventCardProps) {
  const [esFavorito, setEsFavorito] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const { data: session } = useSession();
  const router = useRouter();

  // Obtener todas las imágenes usando el helper
  const images = getImagenesToShow(event.imagenes, event.image, event.category);

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

  const handleCardClick = (e: React.MouseEvent) => {
    // No navegar si se está haciendo click en el botón de favorito
    if ((e.target as HTMLElement).closest('button')) return;
    router.push(`/social/${event._id}`);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Handle touch events for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
    if (isRightSwipe) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group cursor-pointer w-full"
    >
      {/* Image Container - Floating design without border */}
      <div
        className="relative w-full h-[320px] overflow-hidden rounded-2xl mb-3 shadow-lg hover:shadow-xl transition-shadow duration-300"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={images[currentImageIndex]}
          alt={event.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 640px"
        />

        {/* Favorite Button */}
        <button
          onClick={toggleFavorito}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-md hover:scale-110 transition-transform duration-200 z-20"
          aria-label={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          <Heart
            size={20}
            className={esFavorito ? "fill-red-500 text-red-500" : "text-gray-600 dark:text-gray-300"}
          />
        </button>

        {/* Navigation Arrows - Only show if more than 1 image */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white transition-all z-10 opacity-0 group-hover:opacity-100"
              aria-label="Imagen anterior"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white transition-all z-10 opacity-0 group-hover:opacity-100"
              aria-label="Imagen siguiente"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Image Indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentImageIndex
                    ? 'bg-white w-6'
                    : 'bg-white/60 w-1.5 hover:bg-white/80'
                }`}
                aria-label={`Ir a imagen ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Title - Simple and minimal */}
      <h3 className="font-light text-lg text-foreground line-clamp-2 leading-tight px-1">
        {event.title}
      </h3>
    </div>
  );
}
