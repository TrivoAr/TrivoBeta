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
          console.log(
            "✅ Service Worker registrado exitosamente:",
            registration.scope
          );

          // Actualizar SW cuando haya uno nuevo disponible
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  console.log(
                    "🔄 Nuevo Service Worker disponible. Recarga para actualizar."
                  );
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("❌ Error registrando Service Worker:", error);
        });
    }
  }, []);

  return null; // Este componente no renderiza nada
}
