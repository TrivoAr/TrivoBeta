"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import NotificationItem from "@/components/NotificationItem";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const NotificacionesPage = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estimatedCount, setEstimatedCount] = useState(3); // Estimado inicial

  useEffect(() => {
    const fetchNotificaciones = async () => {
      try {
        // Primero hacer una llamada rápida para obtener conteos aproximados
        const quickCount = async () => {
          try {
            const [notiRes, solRes] = await Promise.all([
              axios.get("/api/notificaciones"),
              axios.get("/api/academias/solicitudes"),
            ]);

            const notificaciones = notiRes.data || [];
            const solicitudes =
              solRes.data?.filter((s) => s.estado === "pendiente") || [];

            // Filtrar por los últimos 3 días para estimado
            const tresDiasAtras = new Date();
            tresDiasAtras.setDate(tresDiasAtras.getDate() - 3);

            const recentNotifications = notificaciones.filter((n) => {
              const fecha = new Date(n.createdAt);
              return fecha >= tresDiasAtras;
            });

            const totalEstimated =
              recentNotifications.length + solicitudes.length;
            setEstimatedCount(Math.max(totalEstimated, 2)); // Mínimo 2 skeletons

            return { notificaciones, solicitudes: solRes.data || [] };
          } catch (error) {
            setEstimatedCount(3); // Fallback
            throw error;
          }
        };

        const { notificaciones, solicitudes: solicitudesData } =
          await quickCount();

        const [notiRes, solRes] = await Promise.all([
          Promise.resolve({ data: notificaciones }),
          Promise.resolve({ data: solicitudesData }),
        ]);

        const notificacionesNormales = notiRes.data.map((n) => ({
          ...n,
          tipo: "notificacion",
        }));

        const solicitudes = solRes.data
          .filter((s) => s.estado === "pendiente")
          .map((s) => ({
            _id: s._id,
            userId: s.user_id, // Asegúrate de que esto sea correcto
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

        // Filtrar notificaciones de los últimos 3 días
        const tresDiasAtras = new Date();
        tresDiasAtras.setDate(tresDiasAtras.getDate() - 3);

        const notificacionesRecientes = [];
        const notificacionesAntiguas = [];

        todas.forEach((notificacion) => {
          const fechaNotificacion = new Date(notificacion.createdAt);
          if (fechaNotificacion >= tresDiasAtras) {
            notificacionesRecientes.push(notificacion);
          } else if (
            !notificacion.read &&
            notificacion.tipo === "notificacion"
          ) {
            // Solo marcar como leídas las notificaciones normales, no las solicitudes
            notificacionesAntiguas.push(notificacion._id);
          }
        });

        // Marcar como leídas las notificaciones antiguas en segundo plano
        if (notificacionesAntiguas.length > 0) {
          markMultipleAsRead(notificacionesAntiguas);
        }

        setNotificaciones(notificacionesRecientes);
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

      // Emitir evento para que otros componentes se actualicen
      window.dispatchEvent(
        new CustomEvent("notificationMarkedAsRead", { detail: { id } })
      );
    } catch (error) {
      console.error("Error marcando como leída", error);
    }
  };

  const markMultipleAsRead = async (ids) => {
    try {
      // Marcar múltiples notificaciones como leídas en paralelo
      await Promise.all(
        ids.map((id) => axios.post(`/api/notificaciones/${id}/markAsRead`))
      );
      console.log(`${ids.length} notificaciones antiguas marcadas como leídas`);
    } catch (error) {
      console.error(
        "Error marcando notificaciones antiguas como leídas",
        error
      );
    }
  };

  const removeNotification = (id) => {
    setNotificaciones((prev) => prev.filter((n) => n._id !== id));
  };

  // Componente skeleton para notificaciones
  const NotificationSkeleton = () => (
    <div
      className="flex items-center space-x-3 p-3 rounded-lg border-l-4 border-border bg-card w-full max-w-none"
      aria-hidden="true"
    >
      {/* Avatar skeleton */}
      <Skeleton circle height={64} width={64} className="flex-shrink-0" />

      {/* Contenido skeleton */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <Skeleton height={16} width={200} />
          <Skeleton circle height={8} width={8} />
        </div>
        <Skeleton height={12} width={250} className="mb-2" />
        <div className="flex items-center justify-between mt-2">
          <Skeleton height={10} width={100} />
          <Skeleton height={10} width={120} />
        </div>
      </div>
    </div>
  );

  console.log("Notificaciones:", notificaciones);

  return (
    <div className="bg-background min-h-screen text-foreground px-4 py-6 w-[390px] mx-auto">
      <h1
        className="text-xl font-semibold mb-5 mt-2 text-foreground"
        id="notifications-title"
      >
        Notificaciones
      </h1>

      {loading ? (
        <div
          className="flex flex-col space-y-3 w-full"
          role="status"
          aria-live="polite"
          aria-label="Cargando notificaciones"
        >
          {[...Array(Math.min(estimatedCount, 8))].map((_, index) => (
            <NotificationSkeleton key={index} />
          ))}
        </div>
      ) : notificaciones.length === 0 ? (
        <div
          className="text-center py-12 text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <div className="mb-4">
            <svg
              className="mx-auto h-16 w-16 text-muted-foreground/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 11-15 0v5h5l-5-5 5-5h-5v5a7.5 7.5 0 1115 0v-5z"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-foreground">
            No tenés notificaciones recientes
          </p>
          <p className="text-sm mt-2 text-muted-foreground">
            Solo mostramos notificaciones de los últimos 3 días
          </p>
        </div>
      ) : (
        <div
          className="flex flex-col space-y-3"
          role="list"
          aria-labelledby="notifications-title"
          aria-live="polite"
        >
          {notificaciones.map((n) => (
            <NotificationItem
              key={n._id}
              notification={n}
              onMarkAsRead={markAsRead}
              onRemove={removeNotification}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificacionesPage;
