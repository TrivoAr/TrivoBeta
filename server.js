const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT, 10) || 3000;

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

let io = null;
let socketServerInstance = null;

// Configuración de Socket.IO optimizada
async function initializeSocketIO(httpServer) {
  try {
    const { Server } = await import('socket.io');
    const jwt = require('jsonwebtoken');
    const mongoose = require('mongoose');

    io = new Server(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // Middleware de autenticación a nivel de Engine.IO (más seguro y eficiente)
    io.engine.use((req, res, next) => {
      const isHandshake = req._query.sid === undefined;

      if (!isHandshake) {
        return next();
      }

      // Extraer token del handshake inicial
      const token = req._query.token ||
                    req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        console.error('[SOCKET] Token de autenticación no proporcionado');
        res.writeHead(401);
        res.end(JSON.stringify({ error: "Token de autenticación requerido" }));
        return;
      }

      // Verificar JWT
      jwt.verify(token, process.env.NEXTAUTH_SECRET, (jwtError, decoded) => {
        if (jwtError) {
          console.error('[SOCKET] Error verificando JWT:', jwtError.message);
          const errorMsg = jwtError.name === 'TokenExpiredError' ? "Token expirado" : "Token inválido";
          res.writeHead(401);
          res.end(JSON.stringify({ error: errorMsg }));
          return;
        }

        if (!decoded.sub) {
          console.error('[SOCKET] Token no contiene subject (sub)');
          res.writeHead(401);
          res.end(JSON.stringify({ error: "Token inválido - sin subject" }));
          return;
        }

        // Agregar datos del usuario al request para acceso posterior
        req.user = {
          id: decoded.sub,
          email: decoded.email,
          firstname: decoded.firstname,
          lastname: decoded.lastname
        };

        console.log(`[SOCKET] Usuario autenticado en handshake: ${decoded.firstname} (${decoded.sub})`);
        next();
      });
    });

    // Middleware adicional de Socket.IO para adjuntar datos del usuario al socket
    io.use((socket, next) => {
      const user = socket.request.user;

      if (!user) {
        return next(new Error("Usuario no autenticado"));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    });

    // Manejar conexiones
    io.on("connection", async (socket) => {
      console.log(`[SOCKET] Cliente conectado: ${socket.user?.firstname || socket.userId}`);

      // Unir al usuario a su sala personal
      socket.join(`user:${socket.userId}`);

      // Conectar a MongoDB para acceder a las notificaciones
      const connectDB = async () => {
        if (mongoose.connection.readyState === 1) return;
        try {
          await mongoose.connect(process.env.MONGODB_URI);
          console.log('[SOCKET] Conectado a MongoDB');
        } catch (error) {
          console.error('[SOCKET] Error conectando a MongoDB:', error);
        }
      };

      // Enviar notificaciones pendientes al conectarse
      try {
        await connectDB();

        // Definir el esquema de notificaciones si no existe
        const NotificacionSchema = new mongoose.Schema({
          userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
          fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          type: { type: String, required: true },
          message: { type: String, required: true },
          read: { type: Boolean, default: false },
          readAt: { type: Date },
          actionUrl: { type: String },
          actionType: { type: String, enum: ['navigate', 'modal', 'action'], default: 'navigate' },
          metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
          academiaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Academia' },
          salidaId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalidaSocial' },
          teamSocialId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamSocial' }
        }, { timestamps: true });

        const Notificacion = mongoose.models.Notificacion || mongoose.model('Notificacion', NotificacionSchema);

        const pendingNotifications = await Notificacion.find({
          userId: socket.userId,
          read: false,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Últimas 24 horas
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .populate('fromUserId', 'firstname lastname')
          .lean();

        if (pendingNotifications.length > 0) {
          socket.emit('notifications:pending', pendingNotifications);
          console.log(`[SOCKET] Enviadas ${pendingNotifications.length} notificaciones pendientes`);
        }
      } catch (error) {
        console.error('[SOCKET] Error enviando notificaciones pendientes:', error);
      }

      // Manejar solicitud de notificaciones
      socket.on("get:notifications", async (options = {}) => {
        try {
          await connectDB();
          const Notificacion = mongoose.models.Notificacion || mongoose.model('Notificacion', require('./src/models/notificacion').default.schema);

          const { limit = 20, offset = 0, onlyUnread = false } = options;
          const query = { userId: socket.userId };
          if (onlyUnread) query.read = false;

          const notifications = await Notificacion.find(query)
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .populate('fromUserId', 'firstname lastname')
            .lean();

          socket.emit("notifications:history", {
            notifications,
            hasMore: notifications.length === limit
          });

          console.log(`[SOCKET] Enviado historial: ${notifications.length} notificaciones`);
        } catch (error) {
          console.error("[SOCKET] Error obteniendo notificaciones:", error);
          socket.emit("error", { message: "Error obteniendo notificaciones" });
        }
      });

      // Marcar notificación como leída
      socket.on("notification:mark-read", async (notificationId) => {
        try {
          await connectDB();
          const Notificacion = mongoose.models.Notificacion || mongoose.model('Notificacion', require('./src/models/notificacion').default.schema);

          await Notificacion.findOneAndUpdate(
            { _id: notificationId, userId: socket.userId },
            { read: true, readAt: new Date() }
          );

          socket.emit("notification:marked-read", { notificationId });
          console.log(`[SOCKET] Notificación marcada como leída: ${notificationId}`);
        } catch (error) {
          console.error("[SOCKET] Error marcando como leída:", error);
        }
      });

      // Marcar todas las notificaciones como leídas
      socket.on("notifications:mark-all-read", async () => {
        try {
          await connectDB();
          const Notificacion = mongoose.models.Notificacion || mongoose.model('Notificacion', require('./src/models/notificacion').default.schema);

          const result = await Notificacion.updateMany(
            { userId: socket.userId, read: false },
            { read: true, readAt: new Date() }
          );

          socket.emit("notifications:all-marked-read", { count: result.modifiedCount });
          console.log(`[SOCKET] ${result.modifiedCount} notificaciones marcadas como leídas`);
        } catch (error) {
          console.error("[SOCKET] Error marcando todas como leídas:", error);
        }
      });

      // Manejar desconexión
      socket.on("disconnect", (reason) => {
        console.log(`[SOCKET] Cliente desconectado: ${socket.user?.firstname || socket.userId} - Razón: ${reason}`);
      });
    });

    // Función para emitir a usuario específico
    async function emitToUser(userId, event, data) {
      try {
        const room = `user:${userId}`;
        io.to(room).emit(event, data);

        const sockets = await io.in(room).fetchSockets();
        console.log(`[SOCKET] Emitido '${event}' a ${sockets.length} cliente(s) del usuario ${userId}`);
        return sockets.length > 0;
      } catch (error) {
        console.error(`[SOCKET] Error emitiendo a usuario ${userId}:`, error);
        return false;
      }
    }

    // Crear instancia del servidor
    socketServerInstance = {
      io,
      emitToUser,
      isReady: () => io !== null
    };

    // Exponer globalmente (para desarrollo - aunque no funciona con Next.js workers)
    global.socketServer = socketServerInstance;

    // IMPORTANTE: También intentar registrar con el singleton de TypeScript
    // Esto puede no funcionar debido a la separación de procesos en Next.js dev mode
    try {
      // Intentar importar dinámicamente el módulo de TS
      const socketServerModule = await import('./src/libs/socketServer.ts');
      if (socketServerModule.setSocketServerInstance) {
        socketServerModule.setSocketServerInstance(socketServerInstance);
        console.log("[SOCKET] Singleton de TS registrado exitosamente");
      }
    } catch (err) {
      console.warn("[SOCKET] No se pudo registrar singleton de TS:", err.message);
    }

    console.log("[SOCKET] Servidor Socket.IO inicializado correctamente");
    return socketServerInstance;
  } catch (error) {
    console.error("[SOCKET] Error inicializando Socket.IO:", error);
    throw error;
  }
}

app.prepare().then(async () => {
  const httpServer = createServer(async (req, res) => {
    try {
      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url, true);

      // Interceptar ruta de Socket.IO emit ANTES de pasar a Next.js
      if (req.url === '/api/internal/socket/emit' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const { userId, event, data } = JSON.parse(body);

            if (!userId || !event) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'userId y event son requeridos' }));
              return;
            }

            if (socketServerInstance && typeof socketServerInstance.emitToUser === 'function') {
              const enviado = await socketServerInstance.emitToUser(userId, event, data);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                enviado,
                message: enviado ? 'Notificación enviada en tiempo real' : 'Usuario no conectado'
              }));
              console.log(`[SERVER] Socket emit ${enviado ? '✅ enviado' : '⚠️ usuario offline'} a ${userId}`);
            } else {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Socket.IO no disponible' }));
            }
          } catch (parseError) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: parseError.message }));
          }
        });
        return; // No pasar a Next.js
      }

      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO server
  await initializeSocketIO(httpServer);

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.IO server initialized`);
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (io) {
    io.close(() => {
      console.log('Socket.IO server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  if (io) {
    io.close(() => {
      console.log('Socket.IO server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});