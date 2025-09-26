// src/models/entrenamiento.ts
import { Schema, model, models } from "mongoose";

const EntrenamientoSchema = new Schema(
  {
    alumno_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    grupo_id: {
      type: Schema.Types.ObjectId,
      ref: "Grupo",
      required: true,
    },
    fecha: {
      type: Date,
      required: true,
    },
    descripcion: {
      type: String,
      required: true,
    },
    objetivo: {
      type: String,
      required: true,
    },
    estado: {
      type: String,
      required: true,
      default: "gris",
    },
  },
  {
    timestamps: true,
  }
);

const Entrenamiento =
  models.Entrenamiento || model("Entrenamiento", EntrenamientoSchema);
export default Entrenamiento;
