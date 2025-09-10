import { connectDB } from "@/libs/mongodb";
import Notificacion from "@/models/notificacion";

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
  metadata = {}
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

    console.log(`✅ Notificación creada: ${type} para usuario ${userId}`);
    return notification;
  } catch (error) {
    console.error("❌ Error al crear notificación:", error);
    throw error;
  }
}

// Funciones específicas para tipos comunes de notificaciones

export async function notifyMemberApproved(userId: string, fromUserId: string, salidaId: string, salidaNombre: string) {
  return createNotification({
    userId,
    fromUserId,
    type: "miembro_aprobado",
    message: `¡Tu solicitud para unirte a "${salidaNombre}" ha sido aprobada!`,
    salidaId,
    actionUrl: `/social/${salidaId}`,
  });
}

export async function notifyMemberRejected(userId: string, fromUserId: string, salidaId: string, salidaNombre: string) {
  return createNotification({
    userId,
    fromUserId,
    type: "miembro_rechazado",
    message: `Tu solicitud para unirte a "${salidaNombre}" ha sido rechazada.`,
    salidaId,
    actionUrl: `/social/${salidaId}`,
  });
}

export async function notifyJoinedEvent(userId: string, fromUserId: string, salidaId: string, userName: string, salidaNombre: string) {
  return createNotification({
    userId,
    fromUserId,
    type: "joined_event",
    message: `${userName} se unió a tu salida "${salidaNombre}"`,
    salidaId,
    actionUrl: `/social/${salidaId}`,
  });
}

export async function notifyNewSalida(userId: string, fromUserId: string, salidaId: string, salidaNombre: string) {
  return createNotification({
    userId,
    fromUserId,
    type: "nueva_salida",
    message: `Nueva salida disponible: "${salidaNombre}"`,
    salidaId,
    actionUrl: `/social/${salidaId}`,
  });
}

export async function notifyPaymentApproved(userId: string, fromUserId: string, paymentInfo: any) {
  return createNotification({
    userId,
    fromUserId,
    type: "pago_aprobado",
    message: `Tu pago ha sido aprobado y procesado correctamente.`,
    actionUrl: `/dashboard`,
    metadata: { paymentInfo },
  });
}

export async function notifyAcademiaRequest(userId: string, fromUserId: string, academiaId: string, academiaNombre: string, userName: string) {
  return createNotification({
    userId,
    fromUserId,
    type: "solicitud_academia",
    message: `${userName} quiere unirse a tu academia "${academiaNombre}"`,
    academiaId,
    actionUrl: `/academias/${academiaId}/solicitudes`,
  });
}

export async function notifyTeamRequest(userId: string, fromUserId: string, teamSocialId: string, teamNombre: string, userName: string) {
  return createNotification({
    userId,
    fromUserId,
    type: "solicitud_team",
    message: `${userName} quiere unirse a tu team "${teamNombre}"`,
    teamSocialId,
    actionUrl: `/team-social/${teamSocialId}/solicitudes`,
  });
}