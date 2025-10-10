"use client";

import { useEffect, useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";

/**
 * Componente que inicializa la conexión de Socket.IO para notificaciones
 * Renderiza un indicador visual de estado de conexión
 */
export function NotificationProvider() {
  const { isConnected, on, connect } = useNotifications();
  const [hasShownDisconnectedToast, setHasShownDisconnectedToast] = useState(false);
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Indicador visual de conexión con auto-reconexión
  useEffect(() => {
    if (isConnected) {
      if (isDevelopment) {
        console.log("🟢 [NOTIFICATIONS] Socket conectado - LISTO para recibir notificaciones");
      }
      setHasShownDisconnectedToast(false);
    } else {
      if (isDevelopment) {
        console.log("🔴 [NOTIFICATIONS] Socket desconectado - NO se recibirán notificaciones en tiempo real");
      }

      // Solo mostrar toast de desconexión una vez
      if (!hasShownDisconnectedToast) {
        if (isDevelopment) {
          console.warn("⚠️ [NOTIFICATIONS] Intentando reconectar...");
        }
        setHasShownDisconnectedToast(true);

        // Intentar reconectar después de 2 segundos
        setTimeout(() => {
          if (isDevelopment) {
            console.log("🔄 [NOTIFICATIONS] Reconectando socket...");
          }
          connect();
        }, 2000);
      }
    }
  }, [isConnected, hasShownDisconnectedToast, connect, isDevelopment]);

  // Logs detallados de eventos (solo en desarrollo)
  useEffect(() => {
    const unsubscribers = [
      on("notification:received", (notification: any) => {
        if (isDevelopment) {
          console.log("📩 [NOTIFICATIONS] Notificación recibida:", {
            tipo: notification.type,
            mensaje: notification.message,
            de: notification.fromUserId,
          });
        }
      }),
      on("socket:connected", () => {
        if (isDevelopment) {
          console.log("✅ [NOTIFICATIONS] Socket conectado exitosamente");
          toast.success("Conectado a notificaciones en tiempo real", {
            duration: 2000,
            position: "bottom-right",
          });
        }
      }),
      on("socket:disconnected", (reason: any) => {
        if (isDevelopment) {
          console.log("❌ [NOTIFICATIONS] Socket desconectado:", reason);
        }
      }),
    ];

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [on, isDevelopment]);

  // Indicador visual de estado (solo en desarrollo)
  return (
    <>
      {isDevelopment && (
        <div className="fixed bottom-20 right-4 z-50">
          {isConnected ? (
            <div className="flex items-center gap-2 bg-green-500/20 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-full text-xs font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Online
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 px-3 py-1.5 rounded-full text-xs font-medium">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              Reconectando...
            </div>
          )}
        </div>
      )}
    </>
  );
}
