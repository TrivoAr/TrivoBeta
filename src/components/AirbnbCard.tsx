"use client";

import React from "react";
import Image from "next/image";
import { MapPin, Users, Calendar, DollarSign, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AirbnbCardProps {
  id: string;
  title: string;
  image: string;
  category: string;
  location?: string;
  localidad?: string;
  price?: string;
  participants?: number;
  maxParticipants?: number;
  date?: string;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string) => void;
  onClick?: () => void;
  type: "academia" | "salida";
  className?: string;
  priority?: boolean; // Para optimizar LCP en las primeras imágenes
}

/**
 * AirbnbCard - Card component inspired by Airbnb's 2025 design system
 *
 * Features:
 * - Clean, spacious layout with rounded corners
 * - High-quality image with aspect ratio preservation
 * - Subtle shadows and hover effects
 * - Favorite/like functionality
 * - Responsive and accessible
 */
export default function AirbnbCard({
  id,
  title,
  image,
  category,
  location,
  localidad,
  price,
  participants,
  maxParticipants,
  date,
  isFavorite = false,
  onFavoriteToggle,
  onClick,
  type,
  className,
  priority = false,
}: AirbnbCardProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteToggle?.(id);
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "group cursor-pointer transition-all duration-300",
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl mb-3 bg-gray-100 dark:bg-gray-800">
        <Image
          src={image || "/assets/placeholder-image.jpg"}
          alt={title}
          fill
          priority={priority}
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Favorite Button */}
        {onFavoriteToggle && (
          <button
            onClick={handleFavoriteClick}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white shadow-md transition-all duration-200 hover:scale-110"
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
          >
            <Heart
              size={18}
              className={cn(
                "transition-colors",
                isFavorite
                  ? "fill-[#C95100] stroke-[#C95100]"
                  : "fill-none stroke-gray-700"
              )}
            />
          </button>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm shadow-sm">
          <span className="text-xs font-semibold text-gray-800">
            {category}
          </span>
        </div>

        {/* Participants Badge (for salidas) */}
        {type === "salida" && participants !== undefined && maxParticipants && (
          <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-white">
              <Users size={12} />
              <span className="text-xs font-medium">
                {participants}/{maxParticipants}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-1.5">
        {/* Location */}
        {(localidad || location) && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin size={14} className="text-[#C95100]" />
            <span className="truncate">{localidad || location}</span>
          </div>
        )}

        {/* Title */}
        <h3 className="font-semibold text-base text-foreground line-clamp-2 group-hover:text-[#C95100] transition-colors">
          {title}
        </h3>

        {/* Date (for salidas) */}
        {type === "salida" && date && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar size={14} className="text-[#C95100]" />
            <span>{date}</span>
          </div>
        )}

        {/* Price */}
        {price && (
          <div className="flex items-center gap-1 pt-1">
            <DollarSign size={16} className="text-[#C95100]" />
            <span className="font-semibold text-foreground">{price}</span>
            <span className="text-sm text-muted-foreground">
              {type === "academia" ? "/ mes" : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
