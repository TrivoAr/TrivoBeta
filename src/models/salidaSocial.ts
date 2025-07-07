import { Schema, model, models } from "mongoose";

const SalidaSocialSchema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
    },
    ubicacion: {
      type: String,
    },
    deporte: {
      type: String,
    },
    fecha: {
      type: String,
    },
    hora: {
      type: String,
    },
    duracion: {
      type: String,
    },
    descripcion: {
      type: String,
    },
    whatsappLink: {
      type: String,
    },
    telefonoOrganizador: {
      type: String,
    },
    imagen: {
      type: String,
    },
    locationCoords: {
      lat: { type: Number },
      lng: { type: Number },
    },
    creador_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const SalidaSocial = models.SalidaSocial || model("SalidaSocial", SalidaSocialSchema);
export default SalidaSocial;
