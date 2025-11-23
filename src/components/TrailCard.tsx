import React from "react";
import Image from "next/image";
import { Heart, MapPin, Clock, TrendingUp } from "lucide-react";
import RatingStars from "./RatingStars";

interface TrailCardProps {
    id: string;
    title: string;
    image: string;
    location: string;
    localidad?: string;
    difficulty?: "facil" | "media" | "dificil";
    category?: string;
    distance?: string;
    duration?: string;
    rating?: number;
    reviewCount?: number;
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
    location,
    localidad,
    difficulty,
    category,
    distance,
    duration,
    rating = 0,
    reviewCount = 0,
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

    return (
        <div
            onClick={onClick}
            className="group cursor-pointer bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700"
        >
            {/* Image Container */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-700">
                <Image
                    src={image || "/assets/icons/placeholder.png"}
                    alt={title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    priority={priority}
                    sizes="(max-width: 390px) 50vw, 195px"
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

                {/* Difficulty Badge */}
                {difficultyInfo && (
                    <div className="absolute top-2 left-2 z-10">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${difficultyInfo.color}`}>
                            {difficultyInfo.label}
                        </span>
                    </div>
                )}

                {/* Category Badge */}
                {category && (
                    <div className="absolute bottom-2 left-2 z-10">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-black/60 text-white backdrop-blur-sm">
                            {category}
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-3 space-y-2">
                {/* Title */}
                <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-tight min-h-[2.5rem]">
                    {title}
                </h3>

                {/* Location */}
                <div className="flex items-start gap-1 text-xs text-muted-foreground">
                    <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-1">{localidad || location}</span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {distance && (
                        <div className="flex items-center gap-1">
                            <TrendingUp size={12} />
                            <span>{distance}</span>
                        </div>
                    )}
                    {duration && (
                        <div className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>{duration}</span>
                        </div>
                    )}
                </div>

                {/* Rating */}
                {rating > 0 && (
                    <div className="flex items-center gap-1.5 pt-1">
                        <RatingStars rating={rating} size={12} />
                        <span className="text-xs font-medium text-foreground">{rating.toFixed(1)}</span>
                        {reviewCount > 0 && (
                            <span className="text-xs text-muted-foreground">({reviewCount})</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
