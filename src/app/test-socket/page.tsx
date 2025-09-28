"use client";

import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

export default function TestSocketPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [userId, setUserId] = useState("test-user-123");

  useEffect(() => {
    // Inicializar Socket.IO
    const socketIO = io("/", {
      auth: {
        token: userId,
      },
      transports: ["websocket", "polling"],
    });

    socketIO.on("connect", () => {
      console.log("✅ Conectado a Socket.IO");
      setConnected(true);
      setMessages((prev) => [...prev, "✅ Conectado al servidor"]);
    });

    socketIO.on("disconnect", (reason) => {
      console.log("❌ Desconectado:", reason);
      setConnected(false);
      setMessages((prev) => [...prev, `❌ Desconectado: ${reason}`]);
    });

    socketIO.on("notifications:history", (data) => {
      setMessages((prev) => [
        ...prev,
        `📋 Historial recibido: ${data.notifications.length} notificaciones`,
      ]);
    });

    socketIO.on("notification:new", (notification) => {
      setMessages((prev) => [
        ...prev,
        `🔔 Nueva notificación: ${notification.message}`,
      ]);
    });

    socketIO.on("notification:marked-read", (data) => {
      setMessages((prev) => [
        ...prev,
        `✅ Marcada como leída: ${data.notificationId}`,
      ]);
    });

    socketIO.on("error", (error) => {
      setMessages((prev) => [...prev, `❌ Error: ${error.message}`]);
    });

    setSocket(socketIO);

    return () => {
      socketIO.disconnect();
    };
  }, [userId]);

  const requestNotifications = () => {
    if (socket && connected) {
      socket.emit("get:notifications", { limit: 10 });
      setMessages((prev) => [...prev, "📤 Solicitando notificaciones..."]);
    }
  };

  const markAsRead = () => {
    if (socket && connected) {
      const testId = "test-notification-" + Date.now();
      socket.emit("notification:mark-read", testId);
      setMessages((prev) => [...prev, `📤 Marcando como leída: ${testId}`]);
    }
  };

  const simulateNotification = async () => {
    try {
      // Simular una nueva notificación via Socket.IO server
      const response = await fetch("/api/test-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          message: "Notificación de prueba desde API",
        }),
      });

      if (response.ok) {
        setMessages((prev) => [...prev, "📤 Notificación simulada enviada"]);
      } else {
        setMessages((prev) => [
          ...prev,
          "❌ Error enviando notificación simulada",
        ]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, `❌ Error: ${error}`]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Test Socket.IO Notifications
        </h1>

        {/* Estado de conexión */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Estado de Conexión</h2>
          <div className="flex items-center space-x-4">
            <div
              className={`w-4 h-4 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}
            ></div>
            <span
              className={`font-medium ${connected ? "text-green-700" : "text-red-700"}`}
            >
              {connected ? "Conectado" : "Desconectado"}
            </span>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User ID (simular usuario):
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="test-user-123"
            />
          </div>
        </div>

        {/* Controles */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Controles de Prueba</h2>
          <div className="space-y-4">
            <button
              onClick={requestNotifications}
              disabled={!connected}
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 mr-4"
            >
              📋 Solicitar Notificaciones
            </button>

            <button
              onClick={markAsRead}
              disabled={!connected}
              className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50 mr-4"
            >
              ✅ Marcar como Leída
            </button>

            <button
              onClick={simulateNotification}
              disabled={!connected}
              className="bg-purple-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              🔔 Simular Notificación
            </button>
          </div>
        </div>

        {/* Log de mensajes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Log de Eventos</h2>
          <div className="bg-gray-100 rounded p-4 h-64 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500">No hay eventos aún...</p>
            ) : (
              <div className="space-y-1">
                {messages.map((message, index) => (
                  <div key={index} className="text-sm font-mono">
                    <span className="text-gray-500">
                      [{new Date().toLocaleTimeString()}]
                    </span>{" "}
                    {message}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setMessages([])}
            className="mt-2 text-sm text-gray-500 hover:text-gray-700"
          >
            🗑️ Limpiar log
          </button>
        </div>

        {/* Información técnica */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            ℹ️ Información
          </h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Socket.IO se conecta al servidor en puerto 3000</p>
            <p>
              • Los usuarios se unen automáticamente a su sala:{" "}
              <code>user:{userId}</code>
            </p>
            <p>• Las notificaciones se envían en tiempo real sin polling</p>
            <p>
              • Estado de conexión: {connected ? "🟢 Activo" : "🔴 Inactivo"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
