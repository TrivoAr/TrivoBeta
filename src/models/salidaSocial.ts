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
    localidad: {
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
    dificultad: {
      type: String,
    },
    precio: { type: String },
    
    creador_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

    cupo:{
      type: Number,
      require: true,
    },

    detalles:{
      type: String,
    },

    profesorId:{
       type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    }



  },
  { timestamps: true }
);

const SalidaSocial =
  models.SalidaSocial || model("SalidaSocial", SalidaSocialSchema);
export default SalidaSocial;
