"use client";
import React from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const NotificationItem = ({ notification, onMarkAsRead }) => {
  const isSolicitud = notification.tipo === "solicitud";
  const router = useRouter();

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
      console.error("Error al aceptar solicitud", err);
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
      console.error("Error al rechazar solicitud", err);
    }
  };

  console.log("NotificationItem", notification);

  return (
    <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 transition">
      <div
        style={{
          backgroundImage: `url(${notification.imagen})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
        className="rounded-full object-cover p-8 w-12 h-12  cursor-pointer"
        // onClick={() => {
        //   console.log("notification:", notification);
        //   const profileId = notification.fromUserId || notification.userId;
        //   if (profileId) {
        //     router.push(`/profile/${profileId}`);
        //   }
        // }}
        onClick={() => {
          const profileId = notification.fromUserId || notification.userId;
          if (notification.tipo === "notificacion") {
            onMarkAsRead(notification._id); // ✅ marca como leída
          }
          if (profileId) {
            router.push(`/profile/${profileId}`);
          }
        }}
      />
      <div className="flex-1">
        <p className="text-sm">
          <span className="font-semibold">{notification.nombre}</span>{" "}
          {notification.mensaje}
        </p>
        <p className="text-xs text-gray-500">
          {dayjs(notification.createdAt).fromNow()}
        </p>
      </div>
      {isSolicitud && (
        <div className="flex gap-2">
          <button
            onClick={handleAceptar}
            className="bg-green-500 text-white text-xs px-2 py-1 rounded-full hover:bg-green-600"
          >
            ✓
          </button>
          <button
            onClick={handleRechazar}
            className="bg-red-500 text-white text-xs px-2 py-1 rounded-full hover:bg-red-600"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationItem;
