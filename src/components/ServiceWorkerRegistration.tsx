"use client";

import { useEffect } from "react";

/**
 * Componente para registrar el Service Worker
 * Mejora el rendimiento mediante caching de recursos estáticos
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Solo registrar en producción y si el navegador lo soporta
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          // Actualizar SW cuando haya uno nuevo disponible
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                }
              });
            }
          });
        })
        .catch((error) => {
        });
    }
  }, []);

  return null; // Este componente no renderiza nada
}
