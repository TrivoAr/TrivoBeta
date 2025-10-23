"use client";

import { useEffect, useState, useCallback, useRef, createElement } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { NotificationToast } from "@/components/NotificationToast";

export interface Notification {
  _id: string;
  userId: string;
  fromUserId?: {
    _id: string;
    firstname: string;
    lastname: string;
  };
  salidaId?: string;
  academiaId?: string;
  teamSocialId?: string;
  type: string;
  message: string;
  actionUrl?: string;
  actionType?: "navigate" | "modal" | "action";
  metadata?: Record<string, any>;
  read: boolean;
  readAt?: string;
  createdAt: string;
  data?: Record<string, any>;
}

interface NotificationOptions {
  limit?: number;
  offset?: number;
  onlyUnread?: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
}

// Event emitter personalizado para el patrón observador
class NotificationEventEmitter {
  private listeners: Map<string, Set<Function>> = new Map();

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Retornar función de cleanup
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  emit(event: string, ...args: any[]) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(...args);
        } catch (error) {
          // Error in listener
        }
      });
    }
  }

  removeAllListeners(event?: string) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

// Instancia global del event emitter
const notificationEmitter = new NotificationEventEmitter();

// Estado global para tracking de notificaciones ya mostradas
const shownNotificationIds = new Set<string>();

/**
 * Muestra un toast personalizado según el tipo de notificación
 */
function showCustomToast(notification: Notification) {
  // Evitar mostrar el mismo toast dos veces
  if (shownNotificationIds.has(notification._id)) {
    return;
  }

  shownNotificationIds.add(notification._id);

  toast.custom(
    (t) => {
      return createElement(
        'div',
        { onClick: () => toast.dismiss(t) },
        createElement(NotificationToast, {
          type: notification.type,
          message: notification.message,
          actionUrl: notification.actionUrl,
          onClose: () => toast.dismiss(t),
        })
      );
    },
    {
      duration: 10000, // 10 segundos
      position: "top-center",
    }
  );
}

export function useNotifications(options: NotificationOptions = {}) {
  const { data: session, status: sessionStatus } = useSession();
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    hasMore: false,
  });

  const pollingIntervalRef = useRef<NodeJS.Timeout>();
  const previousNotificationIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  // Función para obtener notificaciones desde el API
  const fetchNotifications = useCallback(async (showToasts = false) => {
    if (sessionStatus !== "authenticated" || !session?.user?.id) {
      return;
    }

    try {
      const response = await fetch("/api/notificaciones");

      if (!response.ok) {
        return;
      }

      const notifications: Notification[] = await response.json();

      // Detectar nuevas notificaciones no leídas
      if (showToasts && !isFirstLoadRef.current) {
        const currentIds = new Set(notifications.map(n => n._id));
        const previousIds = previousNotificationIdsRef.current;

        // Encontrar notificaciones nuevas que no estaban antes
        const newNotifications = notifications.filter(
          n => !n.read && !previousIds.has(n._id)
        );

        // Mostrar toast solo para las nuevas
        newNotifications.forEach(notification => {
          showCustomToast(notification);
          notificationEmitter.emit("notification:received", notification);
        });
      }

      // Actualizar el set de IDs previos
      previousNotificationIdsRef.current = new Set(notifications.map(n => n._id));
      isFirstLoadRef.current = false;

      const unreadCount = notifications.filter(n => !n.read).length;

      setState({
        notifications,
        unreadCount,
        isLoading: false,
        hasMore: false, // El endpoint devuelve todas las notificaciones
      });

      notificationEmitter.emit("notifications:updated", notifications);
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [session?.user?.id, sessionStatus]);

  // Función para marcar como leída
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notificaciones/${notificationId}/markAsRead`, {
        method: "PATCH",
      });

      if (!response.ok) {
        return;
      }

      // Actualizar estado local
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n =>
          n._id === notificationId
            ? { ...n, read: true, readAt: new Date().toISOString() }
            : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));

      notificationEmitter.emit("notification:read", notificationId);
    } catch (error) {
      // Error silencioso
    }
  }, []);

  // Función para marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch("/api/notificaciones/mark-all-read", {
        method: "PATCH",
      });

      if (!response.ok) {
        return;
      }

      const unreadNotifications = state.notifications.filter(n => !n.read);

      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({
          ...n,
          read: true,
          readAt: new Date().toISOString(),
        })),
        unreadCount: 0,
      }));

      notificationEmitter.emit("notifications:all-read", unreadNotifications.length);
    } catch (error) {
      // Error silencioso
    }
  }, [state.notifications]);

  // Función para recargar notificaciones manualmente
  const reload = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true }));
    fetchNotifications(false);
  }, [fetchNotifications]);

  // Efecto para iniciar el polling cuando hay sesión
  useEffect(() => {
    if (sessionStatus !== "authenticated" || !session?.user?.id) {
      // Limpiar polling si no hay sesión
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = undefined;
      }
      return;
    }

    // Carga inicial
    fetchNotifications(false);

    // Configurar polling cada 20 segundos
    pollingIntervalRef.current = setInterval(() => {
      fetchNotifications(true); // Mostrar toasts en polls subsiguientes
    }, 20000);

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = undefined;
      }
    };
  }, [session?.user?.id, sessionStatus, fetchNotifications]);

  return {
    // Estado
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    isLoading: state.isLoading,
    hasMore: state.hasMore,

    // Acciones
    markAsRead,
    markAllAsRead,
    reload,

    // Event emitter para observadores externos
    on: notificationEmitter.on.bind(notificationEmitter),
    emit: notificationEmitter.emit.bind(notificationEmitter),
  };
}

// Hook simplificado para solo escuchar eventos
export function useNotificationListener() {
  const [lastNotification, setLastNotification] = useState<Notification | null>(
    null
  );

  useEffect(() => {
    const unsubscribers = [
      notificationEmitter.on(
        "notification:received",
        (notification: Notification) => {
          setLastNotification(notification);
        }
      ),
    ];

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);

  return {
    lastNotification,
    on: notificationEmitter.on.bind(notificationEmitter),
  };
}
