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
  type: {
    type: String,
    enum: ["joined_event", "like", "comment"], // futuro soporte
    required: true,
  },
  message: {
    type: String,
    required: true,
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
