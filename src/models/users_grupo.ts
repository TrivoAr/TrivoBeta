import { Schema, model, models } from "mongoose";

const UsuarioGrupoSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    grupo_id: {
      type: Schema.Types.ObjectId,
      ref: "Grupo",
      required: true,
    },
    fecha_ingreso: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const UsuarioGrupo =
  models.UsuarioGrupo || model("UsuarioGrupo", UsuarioGrupoSchema);
export default UsuarioGrupo;
