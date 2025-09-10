"use client"
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

const PushManager = () => {
  const { data: session } = useSession();
  const [notificationState, setNotificationState] = useState<string>("checking");
  const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    // Solo intentar suscribir si hay sesión
    if (!session?.user) return;

    const subscribeUser = async () => {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        try {
          setNotificationState("requesting");
          
          // Registro del Service Worker
          const registration = await navigator.serviceWorker.register("/worker.js");
          console.log("📱 Service Worker registrado:", registration);

          // Esperar a que el Service Worker esté listo
          const readyRegistration = await navigator.serviceWorker.ready;
          console.log("📱 Service Worker listo:", readyRegistration);

          // Verificar si ya está suscrito
          const existingSubscription = await readyRegistration.pushManager.getSubscription();
          if (existingSubscription) {
            console.log("📱 Ya existe suscripción push");
            setNotificationState("subscribed");
            return;
          }

          // Solicitar permiso para notificaciones
          const permission = await Notification.requestPermission();
          if (permission !== "granted") {
            console.warn("❌ Permiso para notificaciones denegado");
            setNotificationState("denied");
            toast("ℹ️ Puedes activar notificaciones más tarde en configuración del navegador", {
              duration: 5000,
              icon: "ℹ️"
            });
            return;
          }
          console.log("✅ Permiso para notificaciones otorgado");

          // Suscripción al PushManager
          const subscription = await readyRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: publicVapidKey,
          });
          console.log("📱 Usuario suscrito a push:", subscription);

          // Enviar la suscripción al backend
          const response = await fetch("/api/save-subscription", {
            method: "POST",
            body: JSON.stringify(subscription),
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            console.log("✅ Suscripción guardada en el backend");
            setNotificationState("subscribed");
            toast.success("📱 ¡Notificaciones activadas! Recibirás alertas importantes");
          } else {
            console.error("❌ Error guardando suscripción:", await response.text());
            setNotificationState("error");
            toast.error("❌ Error activando notificaciones");
          }
        } catch (error) {
          console.error("❌ Error al habilitar notificaciones:", error);
          setNotificationState("error");
        }
      } else {
        console.warn("❌ Push notifications no soportadas en este dispositivo");
        setNotificationState("unsupported");
      }
    };

    subscribeUser();
  }, [session, publicVapidKey]);

  return null;
};

export default PushManager;
