"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

export interface Notification {
  _id: string;
  userId: string;
  fromUserId?: {
    _id: string;
    firstname: string;
    lastname: string;
  };
  salidaId?: string;
  type: string;
  message: string;
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
  isConnected: boolean;
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
          console.error(`Error en listener de ${event}:`, error);
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

export function useNotifications(options: NotificationOptions = {}) {
  const { data: session } = useSession();
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    isConnected: false,
    isLoading: false,
    hasMore: false,
  });

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Función para conectar al socket
  const connectSocket = useCallback(() => {
    if (!session?.user?.id || socketRef.current?.connected) return;

    console.log("[NOTIFICATIONS] Conectando socket...");

    const socket = io("/", {
      auth: {
        token: session.user.id, // En un caso real, usarías el JWT token
      },
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: false,
    });

    socket.on("connect", () => {
      console.log("[NOTIFICATIONS] Socket conectado");
      setState((prev) => ({ ...prev, isConnected: true }));
      reconnectAttempts.current = 0;

      // Emitir evento global de conexión
      notificationEmitter.emit("socket:connected");

      // Solicitar notificaciones pendientes
      socket.emit("get:notifications", { ...options, limit: 50 });
    });

    socket.on("disconnect", (reason) => {
      console.log("[NOTIFICATIONS] Socket desconectado:", reason);
      setState((prev) => ({ ...prev, isConnected: false }));
      notificationEmitter.emit("socket:disconnected", reason);

      // Intentar reconectar automáticamente
      if (reason === "io server disconnect") {
        // Servidor cerró la conexión, reconectar
        setTimeout(() => connectSocket(), 1000);
      }
    });

    socket.on("connect_error", (error) => {
      console.error("[NOTIFICATIONS] Error de conexión:", error);
      setState((prev) => ({ ...prev, isConnected: false }));

      // Reconexión exponencial
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.pow(2, reconnectAttempts.current) * 1000;
        reconnectAttempts.current++;

        console.log(
          `[NOTIFICATIONS] Reintentando conexión en ${delay}ms (intento ${reconnectAttempts.current})`
        );

        reconnectTimeoutRef.current = setTimeout(() => {
          connectSocket();
        }, delay);
      } else {
        console.error(
          "[NOTIFICATIONS] Máximo de intentos de reconexión alcanzado"
        );
        notificationEmitter.emit("socket:max-reconnect-attempts");
      }
    });

    // Listeners para notificaciones
    socket.on(
      "notifications:history",
      (data: { notifications: Notification[]; hasMore: boolean }) => {
        setState((prev) => ({
          ...prev,
          notifications: data.notifications,
          hasMore: data.hasMore,
          unreadCount: data.notifications.filter((n) => !n.read).length,
          isLoading: false,
        }));

        notificationEmitter.emit("notifications:updated", data.notifications);
      }
    );

    socket.on("notifications:pending", (notifications: Notification[]) => {
      setState((prev) => {
        const newNotifications = [...notifications, ...prev.notifications];
        const uniqueNotifications = newNotifications.filter(
          (notification, index, self) =>
            index === self.findIndex((n) => n._id === notification._id)
        );

        return {
          ...prev,
          notifications: uniqueNotifications,
          unreadCount: uniqueNotifications.filter((n) => !n.read).length,
        };
      });

      // Mostrar toast para nuevas notificaciones
      notifications.forEach((notification) => {
        toast.info(notification.message, {
          duration: 4000,
          action: {
            label: "Ver",
            onClick: () =>
              notificationEmitter.emit("notification:click", notification),
          },
        });
      });

      notificationEmitter.emit("notifications:new", notifications);
    });

    socket.on("notification:new", (notification: Notification) => {
      setState((prev) => ({
        ...prev,
        notifications: [notification, ...prev.notifications],
        unreadCount: prev.unreadCount + 1,
      }));

      // Toast para notificación nueva
      toast.info(notification.message, {
        duration: 4000,
        action: {
          label: "Ver",
          onClick: () =>
            notificationEmitter.emit("notification:click", notification),
        },
      });

      notificationEmitter.emit("notification:received", notification);
    });

    socket.on(
      "notification:marked-read",
      ({ notificationId }: { notificationId: string }) => {
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((n) =>
            n._id === notificationId
              ? { ...n, read: true, readAt: new Date().toISOString() }
              : n
          ),
          unreadCount: Math.max(0, prev.unreadCount - 1),
        }));

        notificationEmitter.emit("notification:read", notificationId);
      }
    );

    socket.on(
      "notifications:all-marked-read",
      ({ count }: { count: number }) => {
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((n) => ({
            ...n,
            read: true,
            readAt: new Date().toISOString(),
          })),
          unreadCount: 0,
        }));

        notificationEmitter.emit("notifications:all-read", count);
      }
    );

    socket.on("error", (error: { message: string }) => {
      console.error("[NOTIFICATIONS] Error del socket:", error);
      toast.error(`Error: ${error.message}`);
    });

    socketRef.current = socket;
  }, [session?.user?.id, options]);

  // Función para desconectar
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setState((prev) => ({ ...prev, isConnected: false }));
  }, []);

  // Función para marcar como leída
  const markAsRead = useCallback((notificationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("notification:mark-read", notificationId);
    }
  }, []);

  // Función para marcar todas como leídas
  const markAllAsRead = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("notifications:mark-all-read");
    }
  }, []);

  // Función para recargar notificaciones
  const reload = useCallback(
    (newOptions?: NotificationOptions) => {
      if (socketRef.current?.connected) {
        setState((prev) => ({ ...prev, isLoading: true }));
        socketRef.current.emit("get:notifications", {
          ...options,
          ...newOptions,
        });
      }
    },
    [options]
  );

  // Función para cargar más notificaciones
  const loadMore = useCallback(() => {
    if (socketRef.current?.connected && state.hasMore && !state.isLoading) {
      setState((prev) => ({ ...prev, isLoading: true }));
      socketRef.current.emit("get:notifications", {
        ...options,
        offset: state.notifications.length,
      });
    }
  }, [options, state.hasMore, state.isLoading, state.notifications.length]);

  // Efecto para conectar/desconectar
  useEffect(() => {
    if (session?.user?.id) {
      connectSocket();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [session?.user?.id, connectSocket, disconnect]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // Estado
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    isConnected: state.isConnected,
    isLoading: state.isLoading,
    hasMore: state.hasMore,

    // Acciones
    markAsRead,
    markAllAsRead,
    reload,
    loadMore,
    connect: connectSocket,
    disconnect,

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
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "reconnecting"
  >("disconnected");

  useEffect(() => {
    const unsubscribers = [
      notificationEmitter.on(
        "notification:received",
        (notification: Notification) => {
          setLastNotification(notification);
        }
      ),

      notificationEmitter.on("socket:connected", () => {
        setConnectionStatus("connected");
      }),

      notificationEmitter.on("socket:disconnected", () => {
        setConnectionStatus("disconnected");
      }),

      notificationEmitter.on("socket:max-reconnect-attempts", () => {
        setConnectionStatus("disconnected");
        toast.error("No se pudo conectar al servidor de notificaciones");
      }),
    ];

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);

  return {
    lastNotification,
    connectionStatus,
    on: notificationEmitter.on.bind(notificationEmitter),
  };
}
