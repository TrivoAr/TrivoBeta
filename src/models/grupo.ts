import { Schema, model, models } from "mongoose";
const GrupoSchema = new Schema(
  {
    academia_id: {
      type: Schema.Types.ObjectId,
      ref: "Academia",
      required: true,
    },
    profesor_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    nombre_grupo: {
      type: String,
      required: true,
    },
    nivel: {
      type: String,
    },
    ubicacion: {
      type: String,
    },
    horario: {
      type: String,
    },
    aviso: {
      type: String,
    },

    dias: {
      type: [String],
      Enum: ["Lun", "Mar", "Mie", "jue", "Vie", "Sab", "Dom"],
      required: true,
    },

    descripcion: {
      type: String,
    },
    cuota_mensual: {
      type: String,
    },
    imagen: {
      type: String,
    },

    tipo_grupo: {
      type: String,
    },

    tiempo_promedio: {
      type: String,
    },
    locationCoords: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  {
    timestamps: true,
  }
);

const Grupo = models.Grupo || model("Grupo", GrupoSchema);
export default Grupo;
