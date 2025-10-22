"use client";

import React from "react";
import {
  NotificationManager,
  NotificationIndicator,
  useNotificationObserver,
} from "@/components/NotificationManager";
import { useNotificationListener } from "@/hooks/useNotifications";

// Ejemplo de cómo usar en el header de la aplicación
export function AppHeader() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">Trivo</h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Otros elementos del header */}

            {/* Manager completo de notificaciones */}
            <NotificationManager />
          </div>
        </div>
      </div>
    </header>
  );
}

// Ejemplo de indicador simple en navegación móvil
export function MobileNavItem({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="relative flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
    >
      {children}
      {href === "/notifications" && (
        <NotificationIndicator className="ml-auto" />
      )}
    </a>
  );
}

// Ejemplo de componente que observa nuevas notificaciones
export function DashboardWidget() {
  const { newNotificationCount, resetCount } = useNotificationObserver();
  const { lastNotification, connectionStatus } = useNotificationListener();

  React.useEffect(() => {
    if (lastNotification) {
      // Aquí podrías actualizar el título de la página, reproducir un sonido, etc.

      // Reset del contador después de un tiempo
      setTimeout(() => {
        resetCount();
      }, 5000);
    }
  }, [lastNotification, resetCount]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Estado de Notificaciones
      </h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Conexión:</span>
          <span
            className={`font-medium ${
              connectionStatus === "connected"
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {connectionStatus === "connected" ? "Conectado" : "Desconectado"}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Nuevas notificaciones:</span>
          <span className="font-medium text-blue-600">
            {newNotificationCount}
          </span>
        </div>

        {lastNotification && (
          <div className="mt-4 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
            <p className="text-sm font-medium text-blue-800">
              Última notificación:
            </p>
            <p className="text-sm text-blue-700 mt-1">
              {lastNotification.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Ejemplo de provider para inicializar notificaciones globalmente
export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { connectionStatus } = useNotificationListener();

  React.useEffect(() => {
    // Listener global para eventos de conexión
  }, [connectionStatus]);

  return <>{children}</>;
}
