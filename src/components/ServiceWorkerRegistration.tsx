"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * Componente para registrar Service Worker unificado de la PWA
 * - Registra UN SOLO SW (/api/firebase-sw) que maneja:
 *   1. Cache de recursos estáticos
 *   2. Firebase Cloud Messaging para push notifications
 * - Maneja actualizaciones automáticas del Service Worker
 */
export default function ServiceWorkerRegistration() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    // Solo registrar si el navegador lo soporta
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Des-registrar cualquier SW viejo que pueda existir
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          // Des-registrar /sw.js (SW de cache separado - ya no se usa)
          if (registration.active?.scriptURL.includes('/sw.js')) {
            console.log("[SW] Des-registrando SW viejo de cache:", registration.active.scriptURL);
            registration.unregister();
          }
        });
      });

      // Registrar SW unificado (cache + Firebase messaging)
      navigator.serviceWorker
        .register("/api/firebase-sw")
        .then((registration) => {
          console.log("[SW] Service Worker unificado registrado correctamente");

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
          console.error("[SW] Error al registrar SW unificado:", error);
        });
    }
  }, []);

  const showUpdateNotification = (worker: ServiceWorker) => {
    // Solo mostrar en producción, en desarrollo actualizar automáticamente
    if (process.env.NODE_ENV === "development") {
      console.log("[SW] Nueva versión detectada en desarrollo - actualizando automáticamente");
      worker.postMessage({ type: "SKIP_WAITING" });
      return;
    }

    // En producción, mostrar toast
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
