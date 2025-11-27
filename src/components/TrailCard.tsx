import React from "react";
import Image from "next/image";
import { Heart, MapPin, Clock, TrendingUp } from "lucide-react";
import { getImagenesToShow } from "@/utils/imageFallbacks";

interface TrailCardProps {
    id: string;
    title: string;
    image: string;
    imagenes?: string[];
    location: string;
    localidad?: string;
    difficulty?: "facil" | "media" | "dificil";
    category?: string;
    distance?: string;
    duration?: string;
    isFavorite?: boolean;
    onFavoriteToggle?: (id: string) => void;
    onClick?: () => void;
    priority?: boolean;
}

const difficultyConfig = {
    facil: { label: "Fácil", color: "text-green-600 bg-green-50 dark:bg-green-900/20" },
    media: { label: "Moderado", color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20" },
    dificil: { label: "Difícil", color: "text-red-600 bg-red-50 dark:bg-red-900/20" },
};

export default function TrailCard({
    id,
    title,
    image,
    imagenes,
    location,
    localidad,
    difficulty,
    category,
    distance,
    duration,
    isFavorite = false,
    onFavoriteToggle,
    onClick,
    priority = false,
}: TrailCardProps) {
    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onFavoriteToggle?.(id);
    };

    const difficultyInfo = difficulty ? difficultyConfig[difficulty] : null;

    // Obtener la imagen con fallback
    const images = getImagenesToShow(imagenes, image, category);
    const displayImage = images[0];

    return (
        <div
            onClick={onClick}
            className="group cursor-pointer bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700"
        >
            {/* Image Container */}
            <div className="relative h-[320px] overflow-hidden bg-gray-100 dark:bg-gray-700">
                <Image
                    src={displayImage}
                    alt={title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    priority={priority}
                    sizes="(max-width: 640px) 100vw, 640px"
                />

                {/* Favorite Button */}
                <button
                    onClick={handleFavoriteClick}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-md hover:scale-110 transition-transform duration-200 z-10"
                    aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                >
                    <Heart
                        size={16}
                        className={isFavorite ? "fill-red-500 text-red-500" : "text-gray-600 dark:text-gray-300"}
                    />
                </button>

                {/* Bottom Badges */}
                <div className="absolute bottom-2 left-2 z-10 flex gap-2">
                    {category && (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-black/60 text-white backdrop-blur-sm">
                            {category}
                        </span>
                    )}
                    {difficulty && (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-black/60 text-white backdrop-blur-sm">
                            {difficultyInfo?.label}
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-2">
                {/* Title */}
                <h3 className="font-light text-lg text-foreground line-clamp-2 leading-tight">
                    {title}
                </h3>

                {/* Location and Stats - Inline with separators */}
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
                    {/* Location */}
                    <span>{localidad || location}</span>

                    {/* Distance */}
                    {distance && (
                        <>
                            <span>•</span>
                            <span>{distance}</span>
                        </>
                    )}

                    {/* Duration */}
                    {duration && (
                        <>
                            <span>•</span>
                            <span>{duration}</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
