"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Lazy load del mapa solo cuando sea visible
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  loading: () => (
    <div className="w-full h-[300px] bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md flex items-center justify-center">
      <span className="text-gray-500 dark:text-gray-400">Cargando mapa...</span>
    </div>
  ),
  ssr: false,
});

interface LazyMapProps {
  position: {
    lat: number;
    lng: number;
  };
  onChange?: () => void;
  editable?: boolean;
  showControls?: boolean;
  className?: string;
}

export default function LazyMap({
  position,
  onChange = () => {},
  editable = false,
  showControls = false,
  className = "",
}: LazyMapProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect(); // Solo cargar una vez
          }
        });
      },
      {
        rootMargin: "100px", // Empezar a cargar 100px antes de ser visible
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {isVisible ? (
        <MapComponent
          position={position}
          onChange={onChange}
          editable={editable}
          showControls={showControls}
        />
      ) : (
        <div className="w-full h-[300px] bg-gray-200 dark:bg-gray-700 rounded-md" />
      )}
    </div>
  );
}
