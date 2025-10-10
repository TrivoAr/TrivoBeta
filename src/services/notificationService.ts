/**
 * Servicio centralizado para envío de notificaciones
 * Maneja la creación de notificaciones en DB y emisión vía Socket.IO
 */

import Notificacion from "@/models/notificacion";
import { emitNotificationToUser } from "@/libs/socketServer";
import connectDB from "@/libs/mongodb";

export interface NotificacionData {
  userId: string; // Quien recibe
  fromUserId: string; // Quien genera la acción
  type: string;
  message: string;
  actionUrl?: string;
  actionType?: "navigate" | "modal" | "action";
  metadata?: Record<string, any>;
  academiaId?: string;
  salidaId?: string;
  teamSocialId?: string;
}

export const notificationService = {
  /**
   * Crea una notificación y la envía via Socket.IO
   */
  async crearYEnviar(data: NotificacionData) {
    try {
      console.log("[NOTIFICATION_SERVICE] Creando notificación:", {
        to: data.userId,
        from: data.fromUserId,
        type: data.type,
        message: data.message,
      });

      await connectDB();

      // Crear notificación en DB
      const notificacion = await Notificacion.create({
        userId: data.userId,
        fromUserId: data.fromUserId,
        type: data.type,
        message: data.message,
        actionUrl: data.actionUrl,
        actionType: data.actionType || "navigate",
        metadata: data.metadata || {},
        academiaId: data.academiaId,
        salidaId: data.salidaId,
        teamSocialId: data.teamSocialId,
        read: false,
      });

      console.log(
        `[NOTIFICATION_SERVICE] Notificación creada en DB con ID: ${notificacion._id}`
      );

      // Poblar fromUserId para enviar datos completos
      await notificacion.populate("fromUserId", "firstname lastname imagen");

      console.log(
        `[NOTIFICATION_SERVICE] Intentando enviar via Socket.IO a usuario ${data.userId}...`
      );

      // Intentar enviar via Socket.IO
      const enviado = await emitNotificationToUser(
        data.userId,
        "notification:new",
        notificacion.toObject()
      );

      console.log(
        `[NOTIFICATION_SERVICE] ${enviado ? "✅ Notificación enviada" : "⚠️ Notificación guardada (usuario offline)"}:`,
        {
          to: data.userId,
          type: data.type,
          message: data.message,
        }
      );

      return notificacion;
    } catch (error: any) {
      console.error(
        "[NOTIFICATION_SERVICE] ❌ Error creando notificación:",
        error
      );
      throw error;
    }
  },

  /**
   * Notificación: Nuevo suscriptor con trial (al dueño de academia)
   */
  async notificarNuevoSuscriptorTrial(params: {
    dueñoId: string;
    userId: string;
    userName: string;
    academiaId: string;
    academiaNombre: string;
  }) {
    return this.crearYEnviar({
      userId: params.dueñoId,
      fromUserId: params.userId,
      type: "nuevo_suscriptor_trial",
      message: `${params.userName} se unió a ${params.academiaNombre} con clase gratis`,
      actionUrl: `/academias/${params.academiaId}`,
      actionType: "navigate",
      metadata: {
        academiaId: params.academiaId,
        academiaNombre: params.academiaNombre,
        userName: params.userName,
        trial: true,
      },
      academiaId: params.academiaId,
    });
  },

  /**
   * Notificación: Asistencia registrada (al alumno)
   */
  async notificarAsistenciaRegistrada(params: {
    alumnoId: string;
    profesorId: string;
    profesorNombre: string;
    grupoNombre: string;
    academiaId: string;
    academiaNombre: string;
    esTrial: boolean;
  }) {
    const mensaje = params.esTrial
      ? `${params.profesorNombre} marcó tu asistencia en ${params.grupoNombre} (Clase gratis)`
      : `${params.profesorNombre} marcó tu asistencia en ${params.grupoNombre}`;

    return this.crearYEnviar({
      userId: params.alumnoId,
      fromUserId: params.profesorId,
      type: "asistencia_registrada",
      message: mensaje,
      actionUrl: `/academias/${params.academiaId}`,
      actionType: "navigate",
      metadata: {
        academiaId: params.academiaId,
        academiaNombre: params.academiaNombre,
        grupoNombre: params.grupoNombre,
        esTrial: params.esTrial,
      },
      academiaId: params.academiaId,
    });
  },

  /**
   * Notificación: Trial expirado (al alumno)
   */
  async notificarTrialExpirado(params: {
    alumnoId: string;
    academiaId: string;
    academiaNombre: string;
    mercadoPagoLink?: string;
  }) {
    return this.crearYEnviar({
      userId: params.alumnoId,
      fromUserId: params.alumnoId, // Auto-notificación
      type: "trial_expirado",
      message: `Tu clase gratis en ${params.academiaNombre} expiró. Activa tu suscripción para seguir asistiendo`,
      actionUrl: params.mercadoPagoLink || `/academias/${params.academiaId}`,
      actionType: "navigate",
      metadata: {
        academiaId: params.academiaId,
        academiaNombre: params.academiaNombre,
        mercadoPagoLink: params.mercadoPagoLink,
      },
      academiaId: params.academiaId,
    });
  },

  /**
   * Notificación: Suscripción vencida (al alumno)
   */
  async notificarSuscripcionVencida(params: {
    alumnoId: string;
    academiaId: string;
    academiaNombre: string;
  }) {
    return this.crearYEnviar({
      userId: params.alumnoId,
      fromUserId: params.alumnoId, // Auto-notificación
      type: "suscripcion_vencida",
      message: `Tu suscripción a ${params.academiaNombre} ha vencido. Renueva para seguir asistiendo`,
      actionUrl: `/academias/${params.academiaId}`,
      actionType: "navigate",
      metadata: {
        academiaId: params.academiaId,
        academiaNombre: params.academiaNombre,
      },
      academiaId: params.academiaId,
    });
  },
};
