"use client";
import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { getFCMToken, onMessageListener } from "@/libs/firebaseConfig";
import {
  trackNotificationPermissionRequested,
  trackNotificationPermission,
  trackNotificationTokenActivated,
  trackNotificationReceived,
} from "@/utils/mixpanelEvents";

export default function PushManager() {
  const { data: session } = useSession();
  const [busy, setBusy] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [currentProcess, setCurrentProcess] = useState<Promise<any> | null>(
    null
  );

  // Verificar estado al cargar el componente
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!session?.user) {
        console.log("[PushManager] No hay sesión, saltando verificación");
        return;
      }

      try {
        console.log("[PushManager] Verificando estado de suscripción FCM...");
        // Verificar si existe una suscripción FCM en el backend
        const response = await fetch("/api/check-fcm-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: session.user.id }),
        });

        console.log("[PushManager] Respuesta del servidor:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("[PushManager] Datos de suscripción:", data);
          if (data.subscribed) {
            console.log("[PushManager] Usuario ya tiene notificaciones activas");
            setSubscribed(true);
          } else {
            console.log("[PushManager] Usuario NO tiene notificaciones activas");
          }
        } else {
          console.error("[PushManager] Error en respuesta:", await response.text());
        }
      } catch (err) {
        console.error("[PushManager] Error verificando estado FCM:", err);
      }
    };

    checkSubscriptionStatus();
  }, [session]);

  // Escuchar mensajes en primer plano
  useEffect(() => {
    const unsubscribe = onMessageListener()
      .then((payload: any) => {
        // Mostrar notificación personalizada si es necesario
        if (payload.notification) {
          // Track notification received
          trackNotificationReceived(
            payload.data?.type || "unknown",
            payload.data?.notificationId
          );

          toast.info(
            `${payload.notification.title}: ${payload.notification.body}`,
            {
              icon: "📱",
              duration: 5000,
            }
          );
        }
      })
      .catch((err) => {
        // Error listening to messages
      });

    return () => {
      // Cleanup si es necesario
    };
  }, []);

  const subscribeUser = useCallback(async () => {
    // Evitar ejecuciones múltiples
    if (busy || currentProcess) {
      return;
    }

    setBusy(true);

    const processPromise = (async () => {
      try {
        // 0) Chequeos básicos
        if (!session?.user) {
          toast.warning("Iniciá sesión para activar notificaciones");
          return;
        }

        // 1) Pedir permiso de notificaciones
        if (Notification.permission === "denied") {
          toast.error(
            "Las notificaciones están bloqueadas. Ve a configuración del navegador para habilitarlas.",
            { icon: "🚫" }
          );
          return;
        }

        if (Notification.permission === "default") {
          console.log("[PushManager] Solicitando permisos...");
          trackNotificationPermissionRequested();

          const permission = await Notification.requestPermission();
          console.log("[PushManager] Permiso obtenido:", permission);

          trackNotificationPermission(permission === "granted");

          if (permission !== "granted") {
            toast.error("Necesitamos permisos para enviar notificaciones", {
              icon: "❌",
            });
            return;
          }
        }

        console.log("[PushManager] Permisos granted, obteniendo token FCM...");

        // 2) Obtener token de Firebase FCM
        const fcmToken = await getFCMToken();

        if (!fcmToken) {
          throw new Error("No se pudo obtener el token FCM");
        }

        console.log("[PushManager] Token FCM obtenido, guardando en backend...");

        // 3) Guardar token en el backend
        const response = await fetch("/api/save-fcm-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: fcmToken,
            userId: session.user.id,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[PushManager] Error guardando token:", errorText);
          throw new Error(
            `Error del servidor (${response.status}): ${errorText}`
          );
        }

        console.log("[PushManager] Token guardado exitosamente, actualizando estado...");
        setSubscribed(true);
        console.log("[PushManager] Estado actualizado a subscribed=true");

        // Track token activation
        trackNotificationTokenActivated(session.user.id, {
          platform: typeof navigator !== "undefined" ? navigator.platform : "unknown",
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
        });

        toast.success("Notificaciones Firebase activadas", { icon: "🔥" });
      } catch (err: any) {

        const errorMessage = String(err?.message || err);

        if (errorMessage.includes("Messaging no soportado")) {
          toast.error("Este navegador no soporta Firebase Cloud Messaging", {
            icon: "❌",
          });
        } else if (errorMessage.includes("FIREBASE_VAPID_KEY")) {
          toast.error("Error de configuración - contacta al desarrollador", {
            icon: "🔧",
          });
        } else if (errorMessage.includes("permisos")) {
          toast.error("Permisos de notificaciones denegados", { icon: "🚫" });
        } else if (errorMessage.includes("Error del servidor")) {
          toast.error("Error del servidor - intenta más tarde", { icon: "🔧" });
        } else {
          toast.error(`Error: ${errorMessage.substring(0, 80)}...`, {
            icon: "❌",
          });
        }
      }
    })();

    setCurrentProcess(processPromise);

    try {
      await processPromise;
    } finally {
      setBusy(false);
      setCurrentProcess(null);
    }
  }, [session, busy, currentProcess]);

  return (
    <div className="space-y-2">
      <button
        onClick={subscribeUser}
        disabled={busy || subscribed}
        className="w-full flex items-center justify-center gap-2 border px-4 py-3 text-sm hover:bg-black/5 disabled:opacity-60 rounded-[30px]"
      >
        {subscribed
          ? "✅ Notificaciones activadas"
          : busy
            ? "Activando…"
            : "🔔 Activar notificaciones"}
      </button>
    </div>
  );
}
