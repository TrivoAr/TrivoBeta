"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft, Share2, Heart } from "lucide-react";

interface ImageCarouselProps {
    images: string[];
    alt: string;
    onBack?: () => void;
    onShare?: () => void;
    onFavorite?: () => void;
    isFavorite?: boolean;
}

export default function ImageCarousel({
    images,
    alt,
    onBack,
    onShare,
    onFavorite,
    isFavorite = false,
}: ImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const hasMultipleImages = images.length > 1;

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <div className="relative w-full h-[300px] bg-gray-900">
            {/* Image */}
            <Image
                src={images[currentIndex] || "/assets/icons/placeholder.png"}
                alt={alt}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 640px) 100vw, 640px"
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

            {/* Top Controls */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
                {/* Back Button */}
                {onBack && (
                    <button
                        onClick={onBack}
                        className="w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:scale-110 transition-transform"
                        aria-label="Volver"
                    >
                        <ChevronLeft size={24} className="text-gray-900 dark:text-white" />
                    </button>
                )}

                {/* Right Actions */}
                <div className="flex items-center gap-2 ml-auto">
                    {/* Share Button */}
                    {onShare && (
                        <button
                            onClick={onShare}
                            className="w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:scale-110 transition-transform"
                            aria-label="Compartir"
                        >
                            <Share2 size={20} className="text-gray-900 dark:text-white" />
                        </button>
                    )}

                    {/* Favorite Button */}
                    {onFavorite && (
                        <button
                            onClick={onFavorite}
                            className="w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:scale-110 transition-transform"
                            aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                        >
                            <Heart
                                size={20}
                                className={isFavorite ? "fill-red-500 text-red-500" : "text-gray-900 dark:text-white"}
                            />
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation Arrows (only if multiple images) */}
            {hasMultipleImages && (
                <>
                    <button
                        onClick={goToPrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:scale-110 transition-transform z-10"
                        aria-label="Imagen anterior"
                    >
                        <ChevronLeft size={24} className="text-gray-900 dark:text-white" />
                    </button>

                    <button
                        onClick={goToNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:scale-110 transition-transform z-10"
                        aria-label="Imagen siguiente"
                    >
                        <ChevronLeft size={24} className="text-gray-900 dark:text-white rotate-180" />
                    </button>
                </>
            )}

            {/* Dots Indicator (only if multiple images) */}
            {hasMultipleImages && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all ${index === currentIndex
                                    ? "bg-white w-6"
                                    : "bg-white/50 hover:bg-white/75"
                                }`}
                            aria-label={`Ir a imagen ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
