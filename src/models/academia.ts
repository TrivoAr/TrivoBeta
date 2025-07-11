import { Schema, model, models } from "mongoose";

const AcademiaSchema = new Schema(
  {
    dueño_id: {
      type: Schema.Types.ObjectId,
      ref: "User",  // Asumiendo que el dueño es un usuario registrado
      required: true,
    },
    nombre_academia: {
      type: String,
      required: true,
    },
    pais: {
      type: String,
      required: true,
    },
    provincia: {
      type: String,
      required: true,
    },
    localidad: {
      type: String,
      required: true,
    },
    descripcion: {
      type: String,
    },
    tipo_disciplina: {
      type: String,
      enum: ["Running", "Trekking", "Ciclismo", "Otros"],
      required: true,
    },
    telefono: {
      type: String,
    },
    imagen: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Academia = models.Academia || model("Academia", AcademiaSchema);
export default Academia;
