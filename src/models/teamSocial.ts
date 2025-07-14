import { Schema, model, models } from "mongoose";

const TeamSocialSchema = new Schema(
  {
    nombre: { type: String, required: true },
    ubicacion: { type: String, required: true },
    precio: { type: String, required: true },
    deporte: { type: String, required: true },
    fecha: { type: String, required: true },
    hora: { type: String, required: true },
    duracion: { type: String, required: true },
        whatsappLink: {
      type: String,
    },
    telefonoOrganizador: {
      type: String,
    },
      localidad: {
      type: String,
    },
    descripcion: { type: String },
    imagen: { type: String },
    locationCoords: {
      lat: { type: Number },
      lng: { type: Number },
    },
   creadorId: {
  type: Schema.Types.ObjectId,
  ref: "User",
  required: true,
}

  },
  { timestamps: true }
);

const TeamSocial = models.TeamSocial || model("TeamSocial", TeamSocialSchema);

export default TeamSocial;
