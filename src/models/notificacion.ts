// models/Notificacion.js
import mongoose from "mongoose";

const NotificacionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // quien recibe la notificación
    required: true,
  },
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // quien generó la acción
    required: true,
  },
  salidaId: { type: mongoose.Schema.Types.ObjectId, ref: "SalidaSocial" },
  academiaId: { type: mongoose.Schema.Types.ObjectId, ref: "Academia" },
  teamSocialId: { type: mongoose.Schema.Types.ObjectId, ref: "TeamSocial" },
  type: {
    type: String,
    enum: [
      "joined_event",
      "like",
      "comment",
      "solicitud_respuesta",
      "solicitud_recibida",
      "pago_aprobado",
      "miembro_aprobado",
      "miembro_rechazado",
      "nueva_salida",
      "nueva_academia",
      "nuevo_team",
      "solicitud_academia",
      "solicitud_team",
    ],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  // Campos para navegación dinámica
  actionUrl: {
    type: String, // URL a donde navegar cuando se toque la notificación
    required: false,
  },
  actionType: {
    type: String,
    enum: ["navigate", "modal", "action"], // tipo de acción al tocar
    default: "navigate",
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed, // datos adicionales para la notificación
    default: {},
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Notificacion ||
  mongoose.model("Notificacion", NotificacionSchema);
