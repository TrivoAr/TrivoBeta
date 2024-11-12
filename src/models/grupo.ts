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
      direccion: {
        type: String,
      },
      horario: {
        type: String,
      },
      clas: {
        type: String,
      },
      descripcion: {
        type: String,
      },
      objetivos: {
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
        enum: ["nivel", "distancia", "otros"],
      },
    },
    {
      timestamps: true,
    }
  );
  
  const Grupo = models.Grupo || model("Grupo", GrupoSchema);
  export default Grupo;
  