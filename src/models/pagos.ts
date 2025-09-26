import { Schema, model, models } from "mongoose";

const PagoSchema = new Schema(
  {
    salidaId: {
      type: Schema.Types.ObjectId,
      ref: "SalidaSocial", // tu colección de eventos
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    comprobanteUrl: {
      type: String,
      required: true,
    },
    estado: {
      type: String,
      enum: ["pendiente", "aprobado", "rechazado"],
      default: "pendiente",
    },
  },
  { timestamps: true }
);

export default models.Pago || model("Pago", PagoSchema);
