"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * Componente para registrar el Service Worker con PWA
 * Mejora el rendimiento mediante caching de recursos estáticos
 * Maneja actualizaciones automáticas del Service Worker
 */
export default function ServiceWorkerRegistration() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    // Solo registrar si el navegador lo soporta
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("✓ Service Worker registrado correctamente");

          // Verificar si hay un SW esperando
          if (registration.waiting) {
            setWaitingWorker(registration.waiting);
            showUpdateNotification(registration.waiting);
          }

          // Escuchar actualizaciones del SW
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;

            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // Hay una nueva versión disponible
                  setWaitingWorker(newWorker);
                  showUpdateNotification(newWorker);
                }
              });
            }
          });

          // Escuchar cambios de controlador (nueva versión activada)
          let refreshing = false;
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            if (!refreshing) {
              refreshing = true;
              window.location.reload();
            }
          });
        })
        .catch((error) => {
          console.error("Error al registrar Service Worker:", error);
        });
    }
  }, []);

  const showUpdateNotification = (worker: ServiceWorker) => {
    toast.info("Nueva versión disponible", {
      description: "Hay una actualización disponible para Trivo",
      duration: 10000,
      action: {
        label: "Actualizar",
        onClick: () => {
          worker.postMessage({ type: "SKIP_WAITING" });
        },
      },
    });
  };

  return null; // Este componente no renderiza nada
}
