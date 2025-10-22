import { connectDB } from "@/libs/mongodb";
import Notificacion from "@/models/notificacion";
import Subscription from "@/models/subscription";
import User from "@/models/user";
import webPush from "web-push";

// Configurar VAPID para web-push
webPush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface CreateNotificationParams {
  userId: string; // quien recibe la notificación
  fromUserId: string; // quien generó la acción
  type: string;
  message: string;
  salidaId?: string;
  academiaId?: string;
  teamSocialId?: string;
  actionUrl?: string;
  actionType?: "navigate" | "modal" | "action";
  metadata?: any;
}

// Función para enviar notificación push al usuario
async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  actionUrl?: string
) {
  try {
    // Buscar todas las suscripciones del usuario
    const subscriptions = await Subscription.find({ user_id: userId });

    if (subscriptions.length === 0) {
      return;
    }

    const payload = JSON.stringify({
      title,
      body,
      url: actionUrl || "/notificaciones",
      icon: "/icon.png",
      badge: "/badge.png",
    });

    // Enviar a todas las suscripciones del usuario
    const sendPromises = subscriptions.map(async (subscription) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys,
          },
          payload
        );
      } catch (error: any) {
        // Si la suscripción es inválida, eliminarla
        if (error.statusCode === 410 || error.statusCode === 404) {
          await Subscription.findByIdAndDelete(subscription._id);
        }
      }
    });

    await Promise.allSettled(sendPromises);
  } catch (error) {
    // Error sending push notification
  }
}

export async function createNotification({
  userId,
  fromUserId,
  type,
  message,
  salidaId,
  academiaId,
  teamSocialId,
  actionUrl,
  actionType = "navigate",
  metadata = {},
}: CreateNotificationParams) {
  try {
    await connectDB();

    const notification = await Notificacion.create({
      userId,
      fromUserId,
      type,
      message,
      salidaId: salidaId || undefined,
      academiaId: academiaId || undefined,
      teamSocialId: teamSocialId || undefined,
      actionUrl,
      actionType,
      metadata,
      read: false,
    });

    // Enviar notificación push al dispositivo del usuario
    const pushTitle = getPushTitle(type);
    await sendPushNotification(userId, pushTitle, message, actionUrl);

    return notification;
  } catch (error) {
    throw error;
  }
}

// Función para generar títulos específicos según el tipo de notificación
function getPushTitle(type: string): string {
  switch (type) {
    case "miembro_aprobado":
      return "🎉 Solicitud aprobada";
    case "miembro_rechazado":
      return "❌ Solicitud rechazada";
    case "joined_event":
      return "👥 Nuevo miembro";
    case "nueva_salida":
      return "🚀 Nueva salida";
    case "pago_aprobado":
      return "💰 Pago aprobado";
    case "solicitud_academia":
      return "🎓 Nueva solicitud";
    case "solicitud_team":
      return "⚽ Nueva solicitud";
    default:
      return "📱 Trivo";
  }
}

// Funciones específicas para tipos comunes de notificaciones

export async function notifyMemberApproved(
  userId: string,
  fromUserId: string,
  salidaId: string,
  salidaNombre: string
) {
  return createNotification({
    userId,
    fromUserId,
    type: "miembro_aprobado",
    message: `¡Tu solicitud para unirte a "${salidaNombre}" ha sido aprobada!`,
    salidaId,
    actionUrl: `/social/${salidaId}`,
  });
}

export async function notifyMemberRejected(
  userId: string,
  fromUserId: string,
  salidaId: string,
  salidaNombre: string
) {
  return createNotification({
    userId,
    fromUserId,
    type: "miembro_rechazado",
    message: `Tu solicitud para unirte a "${salidaNombre}" ha sido rechazada.`,
    salidaId,
    actionUrl: `/social/${salidaId}`,
  });
}

export async function notifyJoinedEvent(
  userId: string,
  fromUserId: string,
  salidaId: string,
  userName: string,
  salidaNombre: string
) {
  return createNotification({
    userId,
    fromUserId,
    type: "joined_event",
    message: `${userName} se unió a tu salida "${salidaNombre}"`,
    salidaId,
    actionUrl: `/social/miembros/${salidaId}`, // Redirigir a gestión de miembros
  });
}

export async function notifyNewSalida(
  userId: string,
  fromUserId: string,
  salidaId: string,
  salidaNombre: string
) {
  return createNotification({
    userId,
    fromUserId,
    type: "nueva_salida",
    message: `Nueva salida disponible: "${salidaNombre}"`,
    salidaId,
    actionUrl: `/social/${salidaId}`,
  });
}

export async function notifyPaymentPending(
  userId: string,
  fromUserId: string,
  salidaId: string,
  userName: string,
  salidaNombre: string
) {
  return createNotification({
    userId,
    fromUserId,
    type: "payment_pending",
    message: `${userName} ha enviado el comprobante de pago para tu salida "${salidaNombre}"`,
    salidaId,
    actionUrl: `/social/miembros/${salidaId}`, // Redirigir a gestión de miembros
  });
}

export async function notifyPaymentApproved(
  userId: string,
  fromUserId: string,
  salidaId: string,
  salidaNombre: string
) {
  return createNotification({
    userId,
    fromUserId,
    type: "pago_aprobado",
    message: `Tu pago para la salida "${salidaNombre}" fue aprobado ✅`,
    salidaId,
    actionUrl: `/social/${salidaId}`,
  });
}

export async function notifyPaymentRejected(
  userId: string,
  fromUserId: string,
  salidaId: string,
  salidaNombre: string
) {
  return createNotification({
    userId,
    fromUserId,
    type: "pago_rechazado",
    message: `Tu pago para la salida "${salidaNombre}" fue rechazado ❌`,
    salidaId,
    actionUrl: `/social/${salidaId}`,
  });
}

export async function notifyAcademiaRequest(
  userId: string,
  fromUserId: string,
  academiaId: string,
  academiaNombre: string,
  userName: string
) {
  return createNotification({
    userId,
    fromUserId,
    type: "solicitud_academia",
    message: `${userName} quiere unirse a tu academia "${academiaNombre}"`,
    academiaId,
    actionUrl: `/academias/${academiaId}/solicitudes`,
  });
}

export async function notifyTeamRequest(
  userId: string,
  fromUserId: string,
  teamSocialId: string,
  teamNombre: string,
  userName: string
) {
  return createNotification({
    userId,
    fromUserId,
    type: "solicitud_team",
    message: `${userName} quiere unirse a tu team "${teamNombre}"`,
    teamSocialId,
    actionUrl: `/team-social/${teamSocialId}/solicitudes`,
  });
}
