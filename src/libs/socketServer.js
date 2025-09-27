const { Server: SocketIOServer } = require("socket.io");
const jwt = require("jsonwebtoken");
const { connectDB } = require("./mongodb");
const User = require("../models/user");
const Notificacion = require("../models/notificacion");
const mongoose = require("mongoose");

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

function initializeSocketServer(httpServer) {
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
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Token de autenticación requerido"));
      }

      // Para el modo de desarrollo simple, usar el token como userId
      if (token.startsWith("test-user") || token.startsWith("user-")) {
        socket.userId = token;
        socket.user = {
          id: token,
          email: `${token}@test.com`,
          firstname: "Usuario",
          lastname: "Prueba",
        };
        console.log(`[SOCKET] Usuario de prueba conectado: ${token}`);
        return next();
      }

      // Verificar JWT para usuarios reales
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);

      if (!decoded.sub) {
        return next(new Error("Token inválido"));
      }

      // Conectar a DB y verificar usuario
      await connectDB();
      const user = await User.findById(decoded.sub);

      if (!user) {
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
  io.on("connection", async (socket) => {
    if (!socket.userId) return;

    console.log(
      `[SOCKET] Cliente conectado: ${socket.user?.firstname} (${socket.userId})`
    );

    try {
      // Unir al usuario a su sala personal
      socket.join(`user:${socket.userId}`);

      // Enviar notificaciones pendientes al conectarse (solo para usuarios reales)
      if (
        !socket.userId.startsWith("test-user") &&
        !socket.userId.startsWith("user-")
      ) {
        await sendPendingNotifications(socket);
      }

      // Manejar solicitud de historial de notificaciones
      socket.on("get:notifications", async (options = {}) => {
        try {
          const { limit = 20, offset = 0, onlyUnread = false } = options;

          // Para usuarios de prueba, retornar datos mock
          if (
            socket.userId.startsWith("test-user") ||
            socket.userId.startsWith("user-")
          ) {
            socket.emit("notifications:history", {
              notifications: [],
              hasMore: false,
            });
            return;
          }

          const query = { userId: socket.userId };
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
          socket.emit("error", { message: "Error obteniendo notificaciones" });
        }
      });

      // Marcar notificación como leída
      socket.on("notification:mark-read", async (notificationId) => {
        try {
          if (
            !socket.userId.startsWith("test-user") &&
            !socket.userId.startsWith("user-")
          ) {
            await Notificacion.findOneAndUpdate(
              { _id: notificationId, userId: socket.userId },
              { read: true, readAt: new Date() }
            );
          }

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
          let count = 0;

          if (
            !socket.userId.startsWith("test-user") &&
            !socket.userId.startsWith("user-")
          ) {
            const result = await Notificacion.updateMany(
              { userId: socket.userId, read: false },
              { read: true, readAt: new Date() }
            );
            count = result.modifiedCount;
          }

          socket.emit("notifications:all-marked-read", { count });
          console.log(`[SOCKET] ${count} notificaciones marcadas como leídas`);
        } catch (error) {
          console.error("[SOCKET] Error marcando todas como leídas:", error);
        }
      });

      // Manejar desconexión
      socket.on("disconnect", async (reason) => {
        console.log(
          `[SOCKET] Cliente desconectado: ${socket.user?.firstname} - Razón: ${reason}`
        );
      });
    } catch (error) {
      console.error("[SOCKET] Error en conexión:", error);
      socket.disconnect();
    }
  });

  // Función para enviar notificaciones pendientes
  async function sendPendingNotifications(socket) {
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
  async function emitToUser(userId, event, data) {
    try {
      const room = `user:${userId}`;
      io.to(room).emit(event, data);

      // Log solo si hay sockets conectados en esa sala
      const sockets = await io.in(room).fetchSockets();
      if (sockets.length > 0) {
        console.log(
          `[SOCKET] Emitido '${event}' a ${sockets.length} cliente(s) del usuario ${userId}`
        );
        return true;
      } else {
        console.log(
          `[SOCKET] No hay clientes conectados para usuario ${userId}`
        );
        return false;
      }
    } catch (error) {
      console.error(`[SOCKET] Error emitiendo a usuario ${userId}:`, error);
      return false;
    }
  }

  // Función para broadcast a todos los usuarios conectados
  function broadcast(event, data) {
    io.emit(event, data);
    console.log(`[SOCKET] Broadcast '${event}' a todos los clientes`);
  }

  // Función para obtener usuarios conectados
  async function getConnectedUsers() {
    try {
      const rooms = io.sockets.adapter.rooms;
      const connectedUsers = [];

      for (const [roomId, room] of rooms) {
        if (roomId.startsWith("user:")) {
          const userId = roomId.replace("user:", "");
          if (room.size > 0) {
            connectedUsers.push(userId);
          }
        }
      }

      return connectedUsers;
    } catch (error) {
      console.error("[SOCKET] Error obteniendo usuarios conectados:", error);
      return [];
    }
  }

  console.log("[SOCKET] Servidor Socket.IO inicializado correctamente");

  return { io, emitToUser, broadcast, getConnectedUsers };
}

// Singleton para acceso seguro al servidor Socket.IO
let socketServerInstance = null;

function setSocketServerInstance(server) {
  socketServerInstance = server;
  console.log("[SOCKET_SINGLETON] Instancia del servidor registrada");
}

function getSocketServerInstance() {
  return socketServerInstance;
}

function isSocketServerReady() {
  return (
    socketServerInstance !== null &&
    socketServerInstance.io !== null &&
    typeof socketServerInstance.emitToUser === "function"
  );
}

// Función helper para usar desde las API routes
async function emitNotificationToUser(userId, event, data) {
  try {
    if (!isSocketServerReady()) {
      console.error("[SOCKET_SINGLETON] Servidor no disponible");
      return false;
    }

    return await socketServerInstance.emitToUser(userId, event, data);
  } catch (error) {
    console.error("[SOCKET_SINGLETON] Error emitiendo notificación:", error);
    return false;
  }
}

// Función para obtener info de debug
function getSocketDebugInfo() {
  return {
    instanceExists: socketServerInstance !== null,
    hasIo: socketServerInstance?.io !== null,
    hasEmitFunction: typeof socketServerInstance?.emitToUser === "function",
    ready: isSocketServerReady(),
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  initializeSocketServer,
  setSocketServerInstance,
  getSocketServerInstance,
  isSocketServerReady,
  emitNotificationToUser,
  getSocketDebugInfo,
};
