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

    io = new Server(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // Middleware de autenticación simple para desarrollo
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;

        if (!token) {
          return next(new Error("Token de autenticación requerido"));
        }

        socket.userId = token;
        console.log(`[SOCKET] Usuario conectado: ${token}`);
        next();
      } catch (error) {
        console.error("[SOCKET] Error de autenticación:", error);
        next(new Error("Error de autenticación"));
      }
    });

    // Manejar conexiones
    io.on("connection", (socket) => {
      console.log(`[SOCKET] Cliente conectado: ${socket.userId}`);

      // Unir al usuario a su sala personal
      socket.join(`user:${socket.userId}`);

      // Manejar solicitud de notificaciones
      socket.on("get:notifications", async (options = {}) => {
        try {
          socket.emit("notifications:history", {
            notifications: [],
            hasMore: false
          });
        } catch (error) {
          console.error("[SOCKET] Error obteniendo notificaciones:", error);
          socket.emit("error", { message: "Error obteniendo notificaciones" });
        }
      });

      // Marcar notificación como leída
      socket.on("notification:mark-read", async (notificationId) => {
        try {
          socket.emit("notification:marked-read", { notificationId });
        } catch (error) {
          console.error("[SOCKET] Error marcando como leída:", error);
        }
      });

      // Manejar desconexión
      socket.on("disconnect", (reason) => {
        console.log(`[SOCKET] Cliente desconectado: ${socket.userId} - Razón: ${reason}`);
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

    // Exponer globalmente
    global.socketServer = socketServerInstance;

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