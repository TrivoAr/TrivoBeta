"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import NotificationItem from "@/components/NotificationItem";

const NotificacionesPage = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchNotificaciones = async () => {
    try {
      const [notiRes, solRes] = await Promise.all([
        axios.get("/api/notificaciones"),
        axios.get("/api/academias/solicitudes"),
      ]);

      const notificacionesNormales = notiRes.data.map((n) => ({
        ...n,
        tipo: "notificacion",
      }));

      const solicitudes = solRes.data
        .filter((s) => s.estado === "pendiente")
        .map((s) => ({
          _id: s._id,
          tipo: "solicitud",
          nombre: s.nombre,
          mensaje: "quiere unirse a tu academia",
          imagen: s.imagen,
          createdAt: s.createdAt, // ✅ Usá la real si ya viene del backend
          read: false,
          solicitud: s,
        }));

      // ✅ Combinar y ordenar por fecha descendente
      const todas = [...notificacionesNormales, ...solicitudes].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setNotificaciones(todas);
    } catch (err) {
      console.error("Error al cargar notificaciones o solicitudes", err);
    } finally {
      setLoading(false);
    }
  };

  fetchNotificaciones();
}, []);




  const markAsRead = async (id) => {
    try {
      await axios.post(`/api/notificaciones/${id}/markAsRead`);
      setNotificaciones((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Error marcando como leída", error);
    }
  };

  console.log("Notificaciones:", notificaciones);

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-semibold mb-5 mt-2">
        Notificaciones
      </h1>

      {loading ? (
        <p className="text-center text-gray-500">Cargando...</p>
      ) : notificaciones.length === 0 ? (
        <p className="text-center text-gray-500">No tenés notificaciones.</p>
      ) : (
        <div className="flex flex-col space-y-3">
          {notificaciones.map((n) => (
            <NotificationItem
              key={n._id}
              notification={n}
              onMarkAsRead={markAsRead}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificacionesPage;
