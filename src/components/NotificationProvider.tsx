"use client";

import { useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";

/**
 * Componente que inicializa el sistema de notificaciones por polling
 * Renderiza un indicador visual cuando hay notificaciones nuevas
 */
export function NotificationProvider() {
  const { unreadCount, on } = useNotifications();
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Mostrar indicador cuando hay notificaciones nuevas
  useEffect(() => {
    const unsubscribers = [
      on("notification:received", (notification: any) => {
        // El toast ya se muestra en useNotifications
        // Este listener es por si necesitamos hacer algo adicional
      }),
      on("notifications:updated", (notifications: any[]) => {
        // Las notificaciones se actualizaron
      }),
    ];

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [on, isDevelopment]);

  // Indicador visual de notificaciones no leídas (solo en desarrollo)
  return (
    <>
      {isDevelopment && unreadCount > 0 && (
        <div className="fixed bottom-20 right-4 z-50">
          <div className="flex items-center gap-2 bg-blue-500/20 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full text-xs font-medium">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </>
  );
}
