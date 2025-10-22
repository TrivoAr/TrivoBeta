"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, XCircle, Users, DollarSign } from "lucide-react";

interface NotificationToastProps {
  type: string;
  message: string;
  actionUrl?: string;
  onClose?: () => void;
}

/**
 * Componente de toast personalizado para notificaciones
 * Variantes: salidas sociales y academias
 */
export function NotificationToast({
  type,
  message,
  actionUrl,
  onClose,
}: NotificationToastProps) {
  const router = useRouter();

  const handleClick = () => {
    if (actionUrl) {
      router.push(actionUrl);
      onClose?.();
    }
  };

  const getIcon = () => {
    switch (type) {
      case "joined_event":
        return <Users className="w-5 h-5 text-blue-600" />;
      case "payment_pending":
        return <DollarSign className="w-5 h-5 text-yellow-600" />;
      case "pago_aprobado":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "pago_rechazado":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "solicitud_academia":
        return <Users className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case "joined_event":
        return "bg-blue-50 border-blue-200 hover:bg-blue-100";
      case "payment_pending":
        return "bg-yellow-50 border-yellow-200 hover:bg-yellow-100";
      case "pago_aprobado":
        return "bg-green-50 border-green-200 hover:bg-green-100";
      case "pago_rechazado":
        return "bg-red-50 border-red-200 hover:bg-red-100";
      case "solicitud_academia":
        return "bg-purple-50 border-purple-200 hover:bg-purple-100";
      default:
        return "bg-white border-gray-200 hover:bg-gray-50";
    }
  };

  return (
    <div
      className={`
        flex items-center gap-3 p-4 rounded-lg border
        transition-all duration-200 cursor-pointer
        shadow-sm min-w-[320px] max-w-[420px]
        ${getStyles()}
        ${actionUrl ? "cursor-pointer" : "cursor-default"}
      `}
      onClick={handleClick}
    >
      {/* Icono */}
      <div className="flex-shrink-0">{getIcon()}</div>

      {/* Mensaje */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 leading-tight">
          {message}
        </p>
      </div>

      {/* Botón de acción (opcional) */}
      {actionUrl && (
        <div className="flex-shrink-0">
          <button
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            Ver detalles →
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Variante simplificada para salidas sociales
 */
export function SalidaSocialToast({
  userName,
  salidaNombre,
  actionUrl,
  type = "joined_event",
}: {
  userName: string;
  salidaNombre: string;
  actionUrl?: string;
  type?: string;
}) {
  return (
    <NotificationToast
      type={type}
      message={`${userName} se unió a tu salida "${salidaNombre}"`}
      actionUrl={actionUrl}
    />
  );
}

/**
 * Variante simplificada para academias
 */
export function AcademiaToast({
  userName,
  academiaNombre,
  actionUrl,
}: {
  userName: string;
  academiaNombre: string;
  actionUrl?: string;
}) {
  return (
    <NotificationToast
      type="solicitud_academia"
      message={`${userName} quiere unirse a tu academia "${academiaNombre}"`}
      actionUrl={actionUrl}
    />
  );
}

/**
 * Variante para pagos
 */
export function PaymentToast({
  userName,
  salidaNombre,
  actionUrl,
  isPending = true,
}: {
  userName: string;
  salidaNombre: string;
  actionUrl?: string;
  isPending?: boolean;
}) {
  return (
    <NotificationToast
      type={isPending ? "payment_pending" : "pago_aprobado"}
      message={
        isPending
          ? `${userName} ha enviado el comprobante de pago para "${salidaNombre}"`
          : `Tu pago para "${salidaNombre}" fue aprobado ✅`
      }
      actionUrl={actionUrl}
    />
  );
}
