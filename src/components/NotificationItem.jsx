"use client";
import React from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const NotificationItem = ({ notification, onMarkAsRead, onRemove }) => {
  const isSolicitud = notification.tipo === "solicitud";
  const router = useRouter();

  // Función para manejar el click en la notificación con navegación dinámica
  const handleNotificationClick = async () => {
    try {
      // Marcar como leída
      if (!notification.read) {
        await onMarkAsRead(notification._id);
      }

      // Navegar según el tipo de notificación
      if (notification.actionUrl) {
        router.push(notification.actionUrl);
      } else {
        // Fallback a navegación basada en tipo
        const navUrl = getNavigationUrl(notification);
        if (navUrl) {
          router.push(navUrl);
        }
      }
    } catch (error) {
      // Error handling notification click
    }
  };

  // Función para determinar la URL de navegación basada en el tipo
  const getNavigationUrl = (notification) => {
    const type = notification.type || notification.tipo;

    switch (type) {
      case "miembro_aprobado":
      case "joined_event":
        return notification.salidaId
          ? `/social/${notification.salidaId}`
          : null;

      case "solicitud_academia":
      case "nueva_academia":
        return notification.academiaId
          ? `/academias/${notification.academiaId}`
          : null;

      case "nuevo_team":
      case "solicitud_team":
        return notification.teamSocialId
          ? `/team-social/${notification.teamSocialId}`
          : null;

      case "pago_aprobado":
        return `/dashboard`; // ir al dashboard para ver el estado

      case "solicitud":
        // Para solicitudes de academia
        return `/dashboard`; // o la página específica de gestión

      case "notificacion":
        // Para notificaciones generales, intentar extraer URL de metadata
        if (notification.salidaId) return `/social/${notification.salidaId}`;
        if (notification.academiaId)
          return `/academias/${notification.academiaId}`;
        if (notification.teamSocialId)
          return `/team-social/${notification.teamSocialId}`;
        break;

      default:
        // Para tipos legacy o desconocidos, navegar al dashboard como fallback seguro
        return `/dashboard`;
    }

    return null;
  };

  // Función para obtener el icono según el tipo de notificación
  const getNotificationIcon = (type) => {
    switch (type) {
      case "miembro_aprobado":
        return "";
      case "miembro_rechazado":
        return "";
      case "joined_event":
        return "";
      case "nueva_salida":
        return "";
      case "nueva_academia":
        return "";
      case "nuevo_team":
        return "";
      case "pago_aprobado":
        return "";
      case "solicitud_recibida":
      case "solicitud_academia":
      case "solicitud_team":
        return "";
      default:
        return "";
    }
  };

  const handleAceptar = async () => {
    try {
      await fetch("/api/academias/solicitudes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          solicitud_id: notification._id,
          estado: "aceptado",
        }),
      });
      onMarkAsRead(notification._id);
      onRemove(notification._id);
      toast.success("Solicitud aceptada");
    } catch (err) {
      // Silently handle accept request error
    }
  };

  const handleRechazar = async () => {
    try {
      await fetch("/api/academias/solicitudes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          solicitud_id: notification._id,
          estado: "rechazado",
        }),
      });
      onMarkAsRead(notification._id);
      onRemove(notification._id);
      toast.error("Solicitud rechazada");
    } catch (err) {
      // Silently handle reject request error
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleNotificationClick();
    }
  };

  return (
    <div
      className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 focus:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-colors cursor-pointer border-l-4 ${
        notification.read
          ? "border-border bg-card"
          : "border-orange-600 bg-orange-50 dark:bg-orange-950/20"
      }`}
      onClick={handleNotificationClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="listitem"
      aria-label={`Notificación de ${notification.nombre}: ${notification.mensaje || notification.message}${
        notification.read ? " (leída)" : " (no leída)"
      }`}
    >
      {/* Avatar del usuario */}
      <div
        style={{
          backgroundImage: `url(${notification.imagen})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
        className="rounded-full object-cover w-16 h-16 flex-shrink-0 border-2 border-border"
        role="img"
        aria-label={`Foto de perfil de ${notification.nombre}`}
      />

      {/* Icono de tipo de notificación */}
      <div className="text-lg">{getNotificationIcon(notification.type)}</div>

      {/* Contenido de la notificación */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p
            className={`text-sm ${notification.read ? "text-muted-foreground" : "text-foreground font-medium"}`}
          >
            <span className="font-semibold">{notification.nombre}</span>{" "}
            {notification.mensaje || notification.message}
          </p>
          {!notification.read && (
            <div
              className="w-2 h-2 bg-orange-600 rounded-full flex-shrink-0"
              role="status"
              aria-label="No leída"
            ></div>
          )}
        </div>

        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">
            {dayjs(notification.createdAt).fromNow()}
          </p>

          {/* Mostrar hacia dónde llevará la notificación */}
          {(notification.actionUrl || getNavigationUrl(notification)) && (
            <p className="text-xs text-orange-600 font-medium">
              Presiona para ver →
            </p>
          )}
        </div>
      </div>

      {/* Botones de acción para solicitudes */}
      {isSolicitud && (
        <div
          className="flex gap-2 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleAceptar}
            className="bg-green-500 text-white text-xs px-3 py-1 rounded-full hover:bg-green-600 focus:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors"
            aria-label={`Aceptar solicitud de ${notification.nombre}`}
          >
            Aceptar
          </button>
          <button
            onClick={handleRechazar}
            className="bg-red-500 text-white text-xs px-3 py-1 rounded-full hover:bg-red-600 focus:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors"
            aria-label={`Rechazar solicitud de ${notification.nombre}`}
          >
            Rechazar
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationItem;
