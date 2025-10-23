"use client";
import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { getFCMToken, onMessageListener } from "@/libs/firebaseConfig";

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
      if (!session?.user) return;

      try {
        // Verificar si existe una suscripción FCM en el backend
        const response = await fetch("/api/check-fcm-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: session.user.id }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.subscribed) {
            setSubscribed(true);
          }
        }
      } catch (err) {
        // Error verificando estado FCM
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
          toast.success(
            `📱 ${payload.notification.title}: ${payload.notification.body}`
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
          toast("Iniciá sesión para activar notificaciones");
          return;
        }

        // 1) Pedir permiso de notificaciones
        if (Notification.permission === "default") {
          const permission = await Notification.requestPermission();
          if (permission !== "granted") {
            toast.error("❌ Necesitamos permisos para enviar notificaciones");
            return;
          }
        } else if (Notification.permission === "denied") {
          toast.error(
            "🚫 Las notificaciones están bloqueadas. Ve a configuración del navegador para habilitarlas."
          );
          return;
        }

        // 2) Obtener token de Firebase FCM
        const fcmToken = await getFCMToken();

        if (!fcmToken) {
          throw new Error("No se pudo obtener el token FCM");
        }

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
          throw new Error(
            `Error del servidor (${response.status}): ${errorText}`
          );
        }
        setSubscribed(true);
        toast.success("🔥 Notificaciones Firebase activadas");
      } catch (err: any) {

        const errorMessage = String(err?.message || err);

        if (errorMessage.includes("Messaging no soportado")) {
          toast.error("❌ Este navegador no soporta Firebase Cloud Messaging");
        } else if (errorMessage.includes("FIREBASE_VAPID_KEY")) {
          toast.error("🔧 Error de configuración - contacta al desarrollador");
        } else if (errorMessage.includes("permisos")) {
          toast.error("🚫 Permisos de notificaciones denegados");
        } else if (errorMessage.includes("Error del servidor")) {
          toast.error("🔧 Error del servidor - intenta más tarde");
        } else {
          toast.error(`❌ Error: ${errorMessage.substring(0, 80)}...`);
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

  const sendTestNotification = useCallback(async () => {
    if (!session?.user || !subscribed) {
      toast.error("Activa las notificaciones primero");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/send-test-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("🧪 Notificación de prueba enviada");
      } else {
        if (data.tokenRemoved) {
          setSubscribed(false);
          toast.error("Token inválido - reactiva las notificaciones");
        } else {
          toast.error(`Error: ${data.error}`);
        }
      }
    } catch (error) {
      toast.error("Error enviando notificación de prueba");
    } finally {
      setBusy(false);
    }
  }, [session, subscribed]);

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

      {subscribed && (
        <button
          onClick={sendTestNotification}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 hover:bg-blue-100 disabled:opacity-60"
        >
          {busy ? "Enviando..." : "🧪 Enviar prueba"}
        </button>
      )}
    </div>
  );
}
