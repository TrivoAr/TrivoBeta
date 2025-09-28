"use client";

import React, { useState, useEffect } from "react";
import {
  useNotifications,
  useNotificationListener,
  type Notification,
} from "@/hooks/useNotifications";
import {
  Bell,
  BellDot,
  Check,
  CheckCheck,
  X,
  Wifi,
  WifiOff,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface NotificationManagerProps {
  className?: string;
  showConnectionStatus?: boolean;
}

export function NotificationManager({
  className = "",
  showConnectionStatus = true,
}: NotificationManagerProps) {
  const {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    hasMore,
    markAsRead,
    markAllAsRead,
    loadMore,
    reload,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [expandedNotifications, setExpandedNotifications] = useState<
    Set<string>
  >(new Set());

  // Listener para eventos específicos
  const { connectionStatus } = useNotificationListener();

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }

    // Toggle expanded state
    setExpandedNotifications((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(notification._id)) {
        newSet.delete(notification._id);
      } else {
        newSet.add(notification._id);
      }
      return newSet;
    });
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    setExpandedNotifications(new Set());
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "payment_approved":
        return "💰";
      case "payment_pending":
        return "📄";
      case "pago_aprobado":
        return "✅";
      case "pago_rechazado":
        return "❌";
      default:
        return "📢";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "payment_approved":
      case "pago_aprobado":
        return "bg-green-50 border-green-200";
      case "payment_pending":
        return "bg-blue-50 border-blue-200";
      case "pago_rechazado":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: es,
      });
    } catch {
      return "hace un momento";
    }
  };

  const ConnectionIndicator = () => {
    if (!showConnectionStatus) return null;

    return (
      <div className="flex items-center gap-1 text-xs">
        {isConnected ? (
          <>
            <Wifi className="w-3 h-3 text-green-500" />
            <span className="text-green-600">En línea</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3 text-red-500" />
            <span className="text-red-600">Desconectado</span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Botón de notificaciones */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ""}`}
      >
        {unreadCount > 0 ? (
          <BellDot className="w-6 h-6 text-gray-700" />
        ) : (
          <Bell className="w-6 h-6 text-gray-700" />
        )}

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {isOpen && (
        <>
          {/* Overlay para cerrar */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 max-h-96 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                <ConnectionIndicator />
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    title="Marcar todas como leídas"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Marcar todas
                  </button>
                )}

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Lista de notificaciones */}
            <div className="flex-1 overflow-y-auto">
              {isLoading && notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  Cargando notificaciones...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No hay notificaciones
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => {
                    const isExpanded = expandedNotifications.has(
                      notification._id
                    );

                    return (
                      <div
                        key={notification._id}
                        className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                          !notification.read ? "bg-blue-50" : ""
                        } ${getNotificationColor(notification.type)}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg" role="img">
                            {getNotificationIcon(notification.type)}
                          </span>

                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm ${!notification.read ? "font-medium" : ""}`}
                            >
                              {isExpanded
                                ? notification.message
                                : notification.message.length > 80
                                  ? `${notification.message.substring(0, 80)}...`
                                  : notification.message}
                            </p>

                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-gray-500">
                                {formatTime(notification.createdAt)}
                              </span>

                              {!notification.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification._id);
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                  title="Marcar como leída"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {notification.fromUserId && (
                              <p className="text-xs text-gray-400 mt-1">
                                De: {notification.fromUserId.firstname}{" "}
                                {notification.fromUserId.lastname}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Botón cargar más */}
                  {hasMore && (
                    <div className="p-3 text-center border-t">
                      <button
                        onClick={loadMore}
                        disabled={isLoading}
                        className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                      >
                        {isLoading ? "Cargando..." : "Cargar más"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer con estado de conexión */}
            {!showConnectionStatus && (
              <div className="p-2 border-t bg-gray-50 text-center">
                <ConnectionIndicator />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Componente simplificado para solo mostrar el indicador
export function NotificationIndicator({
  className = "",
}: {
  className?: string;
}) {
  const { unreadCount } = useNotifications({ limit: 0 }); // Solo obtener el count, no las notificaciones

  if (unreadCount === 0) return null;

  return (
    <div className={`relative ${className}`}>
      <BellDot className="w-5 h-5 text-red-500" />
      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
        {unreadCount > 9 ? "9+" : unreadCount}
      </span>
    </div>
  );
}

// Hook para usar en otros componentes que necesiten observar notificaciones
export function useNotificationObserver() {
  const [newNotificationCount, setNewNotificationCount] = useState(0);
  const { on } = useNotificationListener();

  useEffect(() => {
    const unsubscribe = on("notification:received", () => {
      setNewNotificationCount((prev) => prev + 1);
    });

    return unsubscribe;
  }, [on]);

  const resetCount = () => setNewNotificationCount(0);

  return {
    newNotificationCount,
    resetCount,
  };
}
