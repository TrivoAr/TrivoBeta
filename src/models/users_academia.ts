import { Schema, model, models } from "mongoose";

const UsuarioAcademiaSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    academia_id: {
      type: Schema.Types.ObjectId,
      ref: "Academia",
      required: true,
    },
    fecha_ingreso: {
      type: Date,
      default: Date.now,
    },
    estado: {
      type: String,
      enum: ["pendiente", "aceptado", "rechazado"],
      required: true,
    },
    pago_id: {
      type: Schema.Types.ObjectId,
      ref: "Pago",
    },
  },
  {
    timestamps: true,
  }
);

const UsuarioAcademia =
  models.UsuarioAcademia || model("UsuarioAcademia", UsuarioAcademiaSchema);
export default UsuarioAcademia;
