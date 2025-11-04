// FASE 2: Sistema de notificaciones usando SOLO Firebase Cloud Messaging
// Se eliminó Web Push API (VAPID) para simplificar y consolidar el sistema

import { connectDB } from "@/libs/mongodb";
import Notificacion from "@/models/notificacion";
import FCMToken from "@/models/FCMToken";
import User from "@/models/user";
import { getMessaging } from "@/libs/firebaseAdmin";

interface CreateNotificationParams {
  userId: string;
  fromUserId: string;
  type: string;
  message: string;
  salidaId?: string;
  academiaId?: string;
  teamSocialId?: string;
  actionUrl?: string;
  actionType?: "navigate" | "modal" | "action";
  metadata?: any;
}

/**
 * Envía notificación push usando Firebase Cloud Messaging
 * @param userId ID del usuario destinatario
 * @param title Título de la notificación
 * @param body Cuerpo del mensaje
 * @param actionUrl URL a la que redirigir cuando se clickea
 * @param notificationId ID de la notificación en DB
 * @param type Tipo de notificación
 */
async function sendFCMNotification(
  userId: string,
  title: string,
  body: string,
  actionUrl?: string,
  notificationId?: string,
  type?: string
) {
  try {
    await connectDB();

    // Buscar todos los tokens FCM activos del usuario
    const fcmTokens = await FCMToken.find({
      userId,
      isActive: true,
    }).lean();

    if (fcmTokens.length === 0) {
      console.log(`[FCM] No hay tokens activos para el usuario ${userId}`);
      return;
    }

    const messaging = getMessaging();

    // Preparar mensaje FCM
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        url: actionUrl || "/notificaciones",
        notificationId: notificationId || "",
        type: type || "general",
        timestamp: Date.now().toString(),
      },
      webpush: {
        fcmOptions: {
          link: actionUrl || "/notificaciones",
        },
        notification: {
          icon: "/icons/icon-192x192.png",
          badge: "/icons/manifest-icon-192.maskable.png",
          tag: notificationId || "trivo-notification",
          requireInteraction: false,
          vibrate: [200, 100, 200],
        },
      },
    };

    // Enviar a todos los tokens del usuario
    const sendPromises = fcmTokens.map(async (tokenDoc) => {
      try {
        await messaging.send({
          ...message,
          token: tokenDoc.token,
        });

        // Actualizar lastUsed
        await FCMToken.findByIdAndUpdate(tokenDoc._id, {
          lastUsed: new Date(),
        });

        console.log(`[FCM] Notificación enviada a token ${tokenDoc._id}`);
      } catch (error: any) {
        console.error(`[FCM] Error enviando a token ${tokenDoc._id}:`, error);

        // Si el token es inválido, marcarlo como inactivo
        if (
          error.code === "messaging/invalid-registration-token" ||
          error.code === "messaging/registration-token-not-registered"
        ) {
          await FCMToken.findByIdAndUpdate(tokenDoc._id, {
            isActive: false,
          });
          console.log(`[FCM] Token ${tokenDoc._id} marcado como inactivo`);
        }
      }
    });

    await Promise.allSettled(sendPromises);
    console.log(`[FCM] Notificaciones enviadas a ${fcmTokens.length} dispositivo(s)`);
  } catch (error) {
    console.error("[FCM] Error enviando notificaciones push:", error);
  }
}

/**
 * Crea una notificación en la base de datos y envía push
 */
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

    // Enviar notificación push FCM
    const pushTitle = getPushTitle(type);
    await sendFCMNotification(
      userId,
      pushTitle,
      message,
      actionUrl,
      notification._id.toString(),
      type
    );

    return notification;
  } catch (error) {
    console.error("[Notification] Error creando notificación:", error);
    throw error;
  }
}

/**
 * Obtiene el título apropiado para cada tipo de notificación
 */
function getPushTitle(type: string): string {
  const titles: Record<string, string> = {
    miembro_aprobado: "🎉 Solicitud aprobada",
    miembro_rechazado: "❌ Solicitud rechazada",
    joined_event: "👥 Nuevo miembro",
    nueva_salida: "🚀 Nueva salida",
    pago_aprobado: "💰 Pago aprobado",
    pago_rechazado: "❌ Pago rechazado",
    solicitud_academia: "🎓 Nueva solicitud",
    solicitud_team: "⚽ Nueva solicitud",
    payment_pending: "⏳ Pago pendiente",
    evento_cancelado: "🚫 Evento cancelado",
    evento_modificado: "📝 Evento modificado",
    recordatorio_evento: "⏰ Recordatorio de evento",
    trial_expirando: "⚠️ Trial expirando",
    nueva_clase_academia: "📚 Nueva clase",
  };

  return titles[type] || "📱 Trivo";
}

// ============================================================================
// FUNCIONES ESPECÍFICAS PARA CADA TIPO DE NOTIFICACIÓN
// ============================================================================

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
    actionUrl: `/social/miembros/${salidaId}`,
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

/**
 * Notifica a TODOS los usuarios activos sobre una nueva salida social
 * Esta función envía notificaciones masivas a todos los usuarios con tokens FCM activos
 */
export async function notifyNewSalidaToAll(
  salidaId: string,
  salidaNombre: string,
  creadorId: string,
  localidad?: string,
  fecha?: Date
) {
  try {
    await connectDB();

    // Obtener TODOS los tokens FCM activos (excluyendo al creador)
    const allTokens = await FCMToken.find({
      isActive: true,
      userId: { $ne: creadorId }, // Excluir al creador
    })
      .populate("userId", "firstname lastname")
      .lean();

    if (allTokens.length === 0) {
      console.log("[Notify All] No hay tokens FCM activos");
      return;
    }

    console.log(`[Notify All] Enviando a ${allTokens.length} dispositivos`);

    const messaging = getMessaging();

    // Preparar mensaje FCM
    const fechaFormateada = fecha
      ? new Date(fecha).toLocaleDateString("es-AR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : "";

    const bodyText = localidad && fecha
      ? `${salidaNombre} en ${localidad} - ${fechaFormateada}`
      : salidaNombre;

    const message = {
      notification: {
        title: "🚀 Nueva salida disponible",
        body: bodyText,
      },
      data: {
        url: `/social/${salidaId}`,
        type: "nueva_salida",
        salidaId: salidaId,
        timestamp: Date.now().toString(),
      },
      webpush: {
        fcmOptions: {
          link: `/social/${salidaId}`,
        },
        notification: {
          icon: "/icons/icon-192x192.png",
          badge: "/icons/manifest-icon-192.maskable.png",
          tag: `salida-${salidaId}`,
          requireInteraction: false,
          vibrate: [200, 100, 200],
        },
      },
    };

    // Enviar a todos los tokens en paralelo
    let successCount = 0;
    let failCount = 0;

    const sendPromises = allTokens.map(async (tokenDoc: any) => {
      try {
        await messaging.send({
          ...message,
          token: tokenDoc.token,
        });

        // Actualizar lastUsed
        await FCMToken.findByIdAndUpdate(tokenDoc._id, {
          lastUsed: new Date(),
        });

        successCount++;
      } catch (error: any) {
        failCount++;
        console.error(`[Notify All] Error enviando a token ${tokenDoc._id}:`, error.code);

        // Si el token es inválido, marcarlo como inactivo
        if (
          error.code === "messaging/invalid-registration-token" ||
          error.code === "messaging/registration-token-not-registered"
        ) {
          await FCMToken.findByIdAndUpdate(tokenDoc._id, {
            isActive: false,
          });
        }
      }
    });

    await Promise.allSettled(sendPromises);

    console.log(
      `[Notify All] Notificaciones enviadas: ${successCount} exitosas, ${failCount} fallidas`
    );

    // Crear notificaciones en DB para cada usuario
    const notificationPromises = allTokens.map(async (tokenDoc: any) => {
      try {
        await createNotification({
          userId: tokenDoc.userId._id.toString(),
          fromUserId: creadorId,
          type: "nueva_salida",
          message: `Nueva salida disponible: "${salidaNombre}"`,
          salidaId,
          actionUrl: `/social/${salidaId}`,
        });
      } catch (err) {
        // No fallar si no se puede crear la notificación en DB
      }
    });

    await Promise.allSettled(notificationPromises);

    return { successCount, failCount, totalSent: allTokens.length };
  } catch (error) {
    console.error("[Notify All] Error enviando notificaciones masivas:", error);
    throw error;
  }
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
    actionUrl: `/social/miembros/${salidaId}`,
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

// ============================================================================
// FASE 4: NUEVAS FUNCIONES DE NOTIFICACIÓN
// ============================================================================

export async function notifyEventCancelled(
  userId: string,
  fromUserId: string,
  salidaId: string,
  salidaNombre: string,
  razon?: string
) {
  const message = razon
    ? `El evento "${salidaNombre}" ha sido cancelado. Razón: ${razon}`
    : `El evento "${salidaNombre}" ha sido cancelado`;

  return createNotification({
    userId,
    fromUserId,
    type: "evento_cancelado",
    message,
    salidaId,
    actionUrl: `/social/${salidaId}`,
    metadata: { razon },
  });
}

export async function notifyEventModified(
  userId: string,
  fromUserId: string,
  salidaId: string,
  salidaNombre: string,
  cambios: string[]
) {
  const cambiosTexto = cambios.join(", ");

  return createNotification({
    userId,
    fromUserId,
    type: "evento_modificado",
    message: `El evento "${salidaNombre}" fue modificado: ${cambiosTexto}`,
    salidaId,
    actionUrl: `/social/${salidaId}`,
    metadata: { cambios },
  });
}

export async function notifyEventReminder(
  userId: string,
  salidaId: string,
  salidaNombre: string,
  fechaEvento: Date
) {
  const fechaFormateada = fechaEvento.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return createNotification({
    userId,
    fromUserId: userId, // El sistema genera el recordatorio
    type: "recordatorio_evento",
    message: `Recordatorio: "${salidaNombre}" es mañana a las ${fechaFormateada}`,
    salidaId,
    actionUrl: `/social/${salidaId}`,
    metadata: { fechaEvento: fechaEvento.toISOString() },
  });
}

export async function notifyAcademiaTrialExpiring(
  userId: string,
  academiaId: string,
  academiaNombre: string,
  diasRestantes: number
) {
  return createNotification({
    userId,
    fromUserId: userId,
    type: "trial_expirando",
    message: `Tu periodo de prueba en "${academiaNombre}" expira en ${diasRestantes} días`,
    academiaId,
    actionUrl: `/academias/${academiaId}`,
    metadata: { diasRestantes },
  });
}

export async function notifyAcademiaNewClass(
  userId: string,
  academiaId: string,
  academiaNombre: string,
  fecha: Date
) {
  const fechaFormateada = fecha.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return createNotification({
    userId,
    fromUserId: userId,
    type: "nueva_clase_academia",
    message: `Nueva clase en "${academiaNombre}": ${fechaFormateada}`,
    academiaId,
    actionUrl: `/academias/${academiaId}`,
    metadata: { fecha: fecha.toISOString() },
  });
}
