import { Schema, model, models } from "mongoose";

const MiembroSalidaSchema = new Schema(
  {
    usuario_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    salida_id: {
      type: Schema.Types.ObjectId,
      ref: "SalidaSocial",
      required: true,
    },
    fecha_union: {
      type: Date,
      default: Date.now,
    },
    rol: {
      type: String,
      enum: ["miembro", "organizador"],
      default: "miembro",
    },
    estado: {
      type: String,
      enum: ["pendiente", "aprobado", "rechazado"],
      default: "pendiente",
    },
    pago_id: { type: Schema.Types.ObjectId, ref: "Pago" },
  },
  { timestamps: true }
);

const MiembroSalida =
  models.MiembroSalida || model("MiembroSalida", MiembroSalidaSchema);
export default MiembroSalida;
