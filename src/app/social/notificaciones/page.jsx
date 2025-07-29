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
        const res = await axios.get("/api/notificaciones");
        await Promise.all(
          res.data.map(async (n) => {
            if (!n.read) {
              await axios.post(`/api/notificaciones/${n._id}/markAsRead`);
              n.read = true; // marca localmente como leída
            }
            return n;
          })
        );
        setNotificaciones(res.data);
      } catch (err) {
        console.error("Error al cargar notificaciones", err);
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
        prev.map((n) =>
          n._id === id ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error("Error marcando como leída", error);
    }
  };

  console.log("Notificaciones:", notificaciones);

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-semibold mb-6 text-center">
        Centro de notificaciones
      </h1>

      {loading ? (
        <p className="text-center text-gray-500">Cargando...</p>
      ) : notificaciones.length === 0 ? (
        <p className="text-center text-gray-500">No tenés notificaciones.</p>
      ) : (
        <div className="flex flex-col space-y-3">
          {notificaciones.map((n) => (
            <NotificationItem key={n._id} notification={n} onMarkAsRead={markAsRead}/>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificacionesPage;
