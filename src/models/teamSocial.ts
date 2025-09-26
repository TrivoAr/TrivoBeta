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
    },
    cupo: {
      type: Number,
      require: true,
    },

    stravaActivity: {
      type: Schema.Types.ObjectId,
      ref: "StravaActivity",
      required: false,
    },

    stravaMap: {
      id: { type: String },
      summary_polyline: { type: String },
      polyline: { type: String },
      resource_state: { type: Number },
    },
    cbu: {
      type: String,
    },

    bar: {
      type: Schema.Types.ObjectId,
      ref: "Bares",
      require: false,
    },

    sponsors: [
      {
        type: Schema.Types.ObjectId,
        ref: "Sponsors",
        required: false,
      },
    ],
    provincia: {
      type: String,
    },

    dificultad: {
      type: String,
    },

    alias: {
      type: String,
    },
  },
  { timestamps: true }
);

const TeamSocial = models.TeamSocial || model("TeamSocial", TeamSocialSchema);

export default TeamSocial;
