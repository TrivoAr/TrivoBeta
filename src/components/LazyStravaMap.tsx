"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Lazy load del mapa de Strava solo cuando sea visible
const StravaMap = dynamic(() => import("@/components/StravaMap"), {
  loading: () => (
    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md flex items-center justify-center">
      <span className="text-gray-500 dark:text-gray-400">Cargando recorrido...</span>
    </div>
  ),
  ssr: false,
});

interface LazyStravaMapProps {
  coords: [number, number][];
  className?: string;
}

export default function LazyStravaMap({ coords, className = "" }: LazyStravaMapProps) {
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
    <div ref={containerRef} className={className} style={{ width: "100%", height: "300px" }}>
      {isVisible ? (
        <StravaMap coords={coords} />
      ) : (
        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-md" />
      )}
    </div>
  );
}
