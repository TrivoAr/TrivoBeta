"use client"
import { useEffect } from "react";

const PushManager = () => {
  const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    const subscribeUser = async () => {
      if ("serviceWorker" in navigator) {
        try {
          // Registro del Service Worker
          const registration = await navigator.serviceWorker.register("/worker.js");
          console.log("Service Worker registrado correctamente:", registration);

          // Esperar a que el Service Worker esté listo
          const readyRegistration = await navigator.serviceWorker.ready;
          console.log("Service Worker listo para usar:", readyRegistration);

          // Solicitar permiso para notificaciones
          const permission = await Notification.requestPermission();
          if (permission !== "granted") {
            console.warn("Permiso para notificaciones denegado.");
            return;
          }
          console.log("Permiso para notificaciones otorgado.");

          // Suscripción al PushManager
          const subscription = await readyRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: publicVapidKey,
          });
          console.log("Usuario suscrito:", subscription);

          // Enviar la suscripción al backend
          await fetch("/api/save-subscription", {
            method: "POST",
            body: JSON.stringify(subscription),
            headers: {
              "Content-Type": "application/json",
            },
          });

          console.log("Suscripción guardada correctamente en el backend.");
        } catch (error) {
          console.error("Error al habilitar notificaciones:", error);
        }
      }
    };

    subscribeUser();
  }, []);

  return null;
};

export default PushManager;
