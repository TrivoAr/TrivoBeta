import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { connectDB } from "./mongodb";
import User from "@/models/user";
import Notificacion from "@/models/notificacion";
import mongoose from "mongoose";

export interface AuthenticatedSocket extends Socket {
  userId: string;
  user: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
  };
}

interface SocketWithAuth extends Socket {
  userId?: string;
  user?: any;
}

// Esquema para tracking de conexiones activas
const ActiveConnectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    socketId: { type: String, required: true },
    connectedAt: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const ActiveConnection =
  mongoose.models.ActiveConnection ||
  mongoose.model("ActiveConnection", ActiveConnectionSchema);

export function initializeSocketServer(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Middleware de autenticación
  io.use(async (socket: SocketWithAuth, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        console.error("[SOCKET] Token de autenticación no proporcionado");
        return next(new Error("Token de autenticación requerido"));
      }

      // Verificar JWT
      let decoded: any;
      try {
        decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!);
      } catch (jwtError: any) {
        console.error("[SOCKET] Error verificando JWT:", jwtError.message);
        if (jwtError.name === "TokenExpiredError") {
          return next(new Error("Token expirado"));
        }
        return next(new Error("Token inválido"));
      }

      if (!decoded.sub) {
        console.error("[SOCKET] Token no contiene subject (sub)");
        return next(new Error("Token inválido - sin subject"));
      }

      // Conectar a DB y verificar usuario
      await connectDB();
      const user = await User.findById(decoded.sub);

      if (!user) {
        console.error(`[SOCKET] Usuario no encontrado: ${decoded.sub}`);
        return next(new Error("Usuario no encontrado"));
      }

      // Agregar datos del usuario al socket
      socket.userId = user._id.toString();
      socket.user = {
        id: user._id.toString(),
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
      };

      console.log(
        `[SOCKET] Usuario autenticado: ${user.firstname} (${user._id})`
      );
      next();
    } catch (error) {
      console.error("[SOCKET] Error de autenticación:", error);
      next(new Error("Error de autenticación"));
    }
  });

  // Manejar conexiones
  io.on("connection", async (socket: SocketWithAuth) => {
    if (!socket.userId) return;

    console.log(
      `[SOCKET] Cliente conectado: ${socket.user?.firstname} (${socket.userId})`
    );

    try {
      // Registrar conexión activa
      await ActiveConnection.findOneAndUpdate(
        { userId: socket.userId },
        {
          socketId: socket.id,
          lastActivity: new Date(),
        },
        { upsert: true, new: true }
      );

      // Unir al usuario a su sala personal
      socket.join(`user:${socket.userId}`);

      // Enviar notificaciones pendientes al conectarse
      await sendPendingNotifications(socket);

      // Manejar solicitud de historial de notificaciones
      socket.on(
        "get:notifications",
        async (
          options: {
            limit?: number;
            offset?: number;
            onlyUnread?: boolean;
          } = {}
        ) => {
          try {
            const { limit = 20, offset = 0, onlyUnread = false } = options;

            const query: any = { userId: socket.userId };
            if (onlyUnread) query.read = false;

            const notifications = await Notificacion.find(query)
              .sort({ createdAt: -1 })
              .skip(offset)
              .limit(limit)
              .populate("fromUserId", "firstname lastname")
              .lean();

            socket.emit("notifications:history", {
              notifications,
              hasMore: notifications.length === limit,
            });

            console.log(
              `[SOCKET] Enviado historial: ${notifications.length} notificaciones`
            );
          } catch (error) {
            console.error("[SOCKET] Error obteniendo historial:", error);
            socket.emit("error", {
              message: "Error obteniendo notificaciones",
            });
          }
        }
      );

      // Marcar notificación como leída
      socket.on("notification:mark-read", async (notificationId: string) => {
        try {
          await Notificacion.findOneAndUpdate(
            { _id: notificationId, userId: socket.userId },
            { read: true, readAt: new Date() }
          );

          socket.emit("notification:marked-read", { notificationId });
          console.log(
            `[SOCKET] Notificación marcada como leída: ${notificationId}`
          );
        } catch (error) {
          console.error("[SOCKET] Error marcando como leída:", error);
        }
      });

      // Marcar todas las notificaciones como leídas
      socket.on("notifications:mark-all-read", async () => {
        try {
          const result = await Notificacion.updateMany(
            { userId: socket.userId, read: false },
            { read: true, readAt: new Date() }
          );

          socket.emit("notifications:all-marked-read", {
            count: result.modifiedCount,
          });
          console.log(
            `[SOCKET] ${result.modifiedCount} notificaciones marcadas como leídas`
          );
        } catch (error) {
          console.error("[SOCKET] Error marcando todas como leídas:", error);
        }
      });

      // Actualizar actividad del usuario
      socket.on("user:activity", async () => {
        try {
          await ActiveConnection.findOneAndUpdate(
            { userId: socket.userId },
            { lastActivity: new Date() }
          );
        } catch (error) {
          console.error("[SOCKET] Error actualizando actividad:", error);
        }
      });

      // Manejar desconexión
      socket.on("disconnect", async (reason) => {
        console.log(
          `[SOCKET] Cliente desconectado: ${socket.user?.firstname} - Razón: ${reason}`
        );

        try {
          // Remover conexión activa después de un delay (por si reconecta rápido)
          setTimeout(async () => {
            await ActiveConnection.deleteOne({ socketId: socket.id });
          }, 30000); // 30 segundos de gracia
        } catch (error) {
          console.error("[SOCKET] Error removiendo conexión:", error);
        }
      });
    } catch (error) {
      console.error("[SOCKET] Error en conexión:", error);
      socket.disconnect();
    }
  });

  // Función para enviar notificaciones pendientes
  async function sendPendingNotifications(socket: SocketWithAuth) {
    try {
      const pendingNotifications = await Notificacion.find({
        userId: socket.userId,
        read: false,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Últimas 24 horas
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("fromUserId", "firstname lastname")
        .lean();

      if (pendingNotifications.length > 0) {
        socket.emit("notifications:pending", pendingNotifications);
        console.log(
          `[SOCKET] Enviadas ${pendingNotifications.length} notificaciones pendientes`
        );
      }
    } catch (error) {
      console.error(
        "[SOCKET] Error enviando notificaciones pendientes:",
        error
      );
    }
  }

  // Función para emitir notificación a usuario específico
  async function emitToUser(userId: string, event: string, data: any): Promise<boolean> {
    try {
      const room = `user:${userId}`;

      // Verificar si hay sockets conectados ANTES de emitir
      const sockets = await io.in(room).fetchSockets();

      if (sockets.length === 0) {
        console.log(
          `[SOCKET] Usuario ${userId} no está conectado. Notificación guardada en DB pero no enviada en tiempo real.`
        );
        return false;
      }

      // Emitir a la sala del usuario
      io.to(room).emit(event, data);

      console.log(
        `[SOCKET] ✅ Emitido '${event}' a ${sockets.length} cliente(s) del usuario ${userId}`
      );
      return true;
    } catch (error) {
      console.error(`[SOCKET] ❌ Error emitiendo a usuario ${userId}:`, error);
      return false;
    }
  }

  // Función para broadcast a todos los usuarios conectados
  function broadcast(event: string, data: any) {
    io.emit(event, data);
    console.log(`[SOCKET] Broadcast '${event}' a todos los clientes`);
  }

  // Función para obtener usuarios conectados
  async function getConnectedUsers(): Promise<string[]> {
    try {
      const connections = await ActiveConnection.find({
        lastActivity: { $gte: new Date(Date.now() - 5 * 60 * 1000) }, // Activos en últimos 5 min
      }).distinct("userId");

      return connections.map((id) => id.toString());
    } catch (error) {
      console.error("[SOCKET] Error obteniendo usuarios conectados:", error);
      return [];
    }
  }

  console.log("[SOCKET] Servidor Socket.IO inicializado correctamente");

  return { io, emitToUser, broadcast, getConnectedUsers };
}

export type SocketServer = ReturnType<typeof initializeSocketServer>;

// Singleton para acceso seguro al servidor Socket.IO
let socketServerInstance: SocketServer | null = null;

export function setSocketServerInstance(server: SocketServer) {
  socketServerInstance = server;
  // TAMBIÉN guardar en global para acceso cruzado entre procesos
  if (typeof global !== "undefined") {
    (global as any).socketServer = server;
  }
  console.log("[SOCKET_SINGLETON] Instancia del servidor registrada en singleton y global");
}

export function getSocketServerInstance(): SocketServer | null {
  // Intentar obtener de global primero (para acceso desde API routes)
  if (typeof global !== "undefined" && (global as any).socketServer) {
    return (global as any).socketServer;
  }
  return socketServerInstance;
}

export function isSocketServerReady(): boolean {
  const instance = getSocketServerInstance();
  return (
    instance !== null &&
    instance.io !== null &&
    typeof instance.emitToUser === "function"
  );
}

// Función helper para usar desde las API routes
export async function emitNotificationToUser(
  userId: string,
  event: string,
  data: any
): Promise<boolean> {
  try {
    console.log(`[SOCKET_EMIT] 🔍 Intentando emitir '${event}' a usuario ${userId}`);

    // Opción 1: Intentar con el global primero (server.js - mismo proceso)
    if (typeof global !== "undefined" && (global as any).socketServer) {
      const globalSocket = (global as any).socketServer;
      console.log(`[SOCKET_EMIT] ✅ global.socketServer encontrado`);

      if (globalSocket && typeof globalSocket.emitToUser === "function") {
        const enviado = await globalSocket.emitToUser(userId, event, data);
        console.log(
          `[SOCKET_GLOBAL] Notificación ${enviado ? '✅ ENVIADA' : '❌ NO ENVIADA'} via global instance a ${userId}`
        );
        return enviado;
      } else {
        console.warn(`[SOCKET_EMIT] ⚠️ global.socketServer existe pero no tiene emitToUser`);
      }
    } else {
      console.warn(`[SOCKET_EMIT] ❌ global.socketServer NO está disponible`);
    }

    // Opción 2: Fallback con singleton
    if (isSocketServerReady()) {
      console.log(`[SOCKET_EMIT] 🔄 Usando singleton instance...`);
      await socketServerInstance!.emitToUser(userId, event, data);
      return true;
    }

    // Opción 3: NUEVO - Llamar al endpoint HTTP interno
    console.log(`[SOCKET_EMIT] 🌐 Intentando vía endpoint HTTP interno...`);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const response = await fetch(`${baseUrl}/api/internal/socket/emit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, event, data }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(
          `[SOCKET_EMIT] ${result.enviado ? '✅ ENVIADA' : '⚠️ Usuario offline'} vía HTTP a ${userId}`
        );
        return result.enviado;
      } else {
        console.error(`[SOCKET_EMIT] ❌ Error HTTP ${response.status}:`, await response.text());
      }
    } catch (fetchError) {
      console.error(`[SOCKET_EMIT] ❌ Error en fetch:`, fetchError);
    }

    console.error(
      `[SOCKET_EMIT] ❌ NINGÚN método disponible. Notificación guardada pero NO enviada en tiempo real.`
    );
    return false;
  } catch (error) {
    console.error("[SOCKET] ❌ Error emitiendo notificación:", error);
    return false;
  }
}

// Función para obtener info de debug
export function getSocketDebugInfo() {
  return {
    instanceExists: socketServerInstance !== null,
    hasIo: socketServerInstance?.io !== null,
    hasEmitFunction: typeof socketServerInstance?.emitToUser === "function",
    ready: isSocketServerReady(),
    timestamp: new Date().toISOString(),
  };
}
