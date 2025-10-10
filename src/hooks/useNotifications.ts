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

// Singleton para el socket - solo una instancia global
let globalSocketInstance: Socket | null = null;
let globalSocketUserId: string | null = null;
let isConnecting: boolean = false; // Flag para evitar conexiones simultáneas

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
  const connectSocket = useCallback(async () => {
    if (!session?.user?.id) return;

    const currentUserId = session.user.id;

    // Si ya existe un socket global para este usuario y está conectado, reutilizarlo
    if (globalSocketInstance?.connected && globalSocketUserId === currentUserId) {
      console.log("[NOTIFICATIONS] Reutilizando socket global existente");
      socketRef.current = globalSocketInstance;
      setState((prev) => ({ ...prev, isConnected: true }));
      return;
    }

    // Si ya está conectando, no iniciar otra conexión
    if (isConnecting) {
      console.log("[NOTIFICATIONS] Ya hay una conexión en progreso, esperando...");
      return;
    }

    // Si hay un socket pero es de otro usuario, desconectarlo
    if (globalSocketInstance && globalSocketUserId !== currentUserId) {
      console.log("[NOTIFICATIONS] Desconectando socket de usuario anterior");
      globalSocketInstance.removeAllListeners();
      globalSocketInstance.disconnect();
      globalSocketInstance = null;
      globalSocketUserId = null;
    }

    // Si ya hay un socket para este usuario pero desconectado, limpiarlo
    if (globalSocketInstance && !globalSocketInstance.connected) {
      console.log("[NOTIFICATIONS] Limpiando socket desconectado");
      globalSocketInstance.removeAllListeners();
      globalSocketInstance.disconnect();
      globalSocketInstance = null;
      globalSocketUserId = null;
    }

    isConnecting = true; // Marcar que estamos conectando
    console.log("[NOTIFICATIONS] Creando nueva conexión socket...");

    // Obtener token JWT para Socket.IO
    let socketToken: string;
    try {
      console.log("[NOTIFICATIONS] Solicitando token de Socket.IO...");
      const response = await fetch("/api/auth/socket-token");
      if (!response.ok) {
        console.error("[NOTIFICATIONS] ❌ Error obteniendo token, status:", response.status);
        isConnecting = false;
        return;
      }
      const data = await response.json();
      socketToken = data.token;
      console.log("[NOTIFICATIONS] ✅ Token obtenido exitosamente");
    } catch (error) {
      console.error("[NOTIFICATIONS] ❌ Error obteniendo token:", error);
      isConnecting = false;
      return;
    }

    console.log("[NOTIFICATIONS] Creando socket con token...");
    const socket = io("/", {
      query: {
        token: socketToken,
      },
      auth: {
        token: socketToken, // Fallback por compatibilidad
      },
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: true, // Forzar nueva conexión para evitar reutilizar sockets viejos
      reconnection: false, // Desactivar reconexión automática, la manejamos manualmente
    });

    console.log("[NOTIFICATIONS] Socket creado, esperando conexión...");

    socket.on("connect", () => {
      console.log("[NOTIFICATIONS] Socket conectado");
      isConnecting = false; // Liberar flag
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
      isConnecting = false; // Liberar flag en caso de error
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

      // Mostrar toast para nuevas notificaciones (desde arriba, clickeable)
      notifications.forEach((notification) => {
        toast.info(notification.message, {
          duration: 5000,
          position: "top-center",
          action: notification.actionUrl ? {
            label: "Ver",
            onClick: () => {
              if (notification.actionUrl) {
                window.location.href = notification.actionUrl;
              }
              notificationEmitter.emit("notification:click", notification);
            },
          } : undefined,
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

      // Toast para notificación nueva (desde arriba, clickeable)
      toast.info(notification.message, {
        duration: 5000,
        position: "top-center",
        action: {
          label: "Ver",
          onClick: () => {
            if (notification.actionUrl) {
              window.location.href = notification.actionUrl;
            }
            notificationEmitter.emit("notification:click", notification);
          },
        },
        onClick: () => {
          if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
          }
          notificationEmitter.emit("notification:click", notification);
        },
        style: {
          cursor: "pointer",
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

    // Guardar en las referencias globales
    globalSocketInstance = socket;
    globalSocketUserId = session.user.id;
    socketRef.current = socket;
  }, [session?.user?.id]); // Remover 'options' de las dependencias para evitar re-renders

  // Función para desconectar
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // No desconectar el socket global, solo quitar la referencia local
    // El socket global se mantiene para otros componentes
    socketRef.current = null;

    setState((prev) => ({ ...prev, isConnected: false }));
  }, []);

  // Función para marcar como leída
  const markAsRead = useCallback((notificationId: string) => {
    const socket = globalSocketInstance || socketRef.current;
    if (socket?.connected) {
      socket.emit("notification:mark-read", notificationId);
    }
  }, []);

  // Función para marcar todas como leídas
  const markAllAsRead = useCallback(() => {
    const socket = globalSocketInstance || socketRef.current;
    if (socket?.connected) {
      socket.emit("notifications:mark-all-read");
    }
  }, []);

  // Función para recargar notificaciones
  const reload = useCallback(
    (newOptions?: NotificationOptions) => {
      const socket = globalSocketInstance || socketRef.current;
      if (socket?.connected) {
        setState((prev) => ({ ...prev, isLoading: true }));
        socket.emit("get:notifications", {
          ...options,
          ...newOptions,
        });
      }
    },
    [options]
  );

  // Función para cargar más notificaciones
  const loadMore = useCallback(() => {
    const socket = globalSocketInstance || socketRef.current;
    if (socket?.connected && state.hasMore && !state.isLoading) {
      setState((prev) => ({ ...prev, isLoading: true }));
      socket.emit("get:notifications", {
        ...options,
        offset: state.notifications.length,
      });
    }
  }, [options, state.hasMore, state.isLoading, state.notifications.length]);

  // Efecto para conectar/desconectar (sin dependencias de funciones para evitar bucles)
  useEffect(() => {
    if (session?.user?.id) {
      connectSocket();
    }

    return () => {
      // Cleanup local: solo limpiar timeouts y referencias locales
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      // No desconectar el socket global, solo limpiar la referencia local
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]); // Solo depende de session.user.id

  // Sincronizar estado de conexión con socket global
  useEffect(() => {
    const checkConnection = () => {
      const socket = globalSocketInstance || socketRef.current;
      if (socket) {
        setState((prev) => ({
          ...prev,
          isConnected: socket.connected,
        }));
      }
    };

    // Revisar inmediatamente
    checkConnection();

    // Revisar periódicamente
    const interval = setInterval(checkConnection, 1000);

    return () => clearInterval(interval);
  }, []);

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
