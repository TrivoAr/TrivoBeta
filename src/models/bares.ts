import { Schema, model, models } from "mongoose";

const BaresSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Bar name is required"],
      minLength: [3, "Bar name must be at least 3 characters"],
      maxLength: [50, "Bar name must be at most 50 characters"],
    },

    locationCoords: {
      lat: {
        type: Number,
        required: [true, "Latitude is required"]
      },
      lng: {
        type: Number,
        required: [true, "Longitude is required"]
      },
    },

    // Logo del bar (imagen de perfil/identificación)
    logo: {
      type: String,
      required: [true, "Logo del bar es requerido"],
    },

    // Array de imágenes para el carrusel (fotos del interior, ambiente, etc.)
    imagenesCarrusel: [{
      type: String,
      required: true
    }],

    // Información adicional del bar
    direccion: {
      type: String,
      maxLength: [200, "Address must be at most 200 characters"],
    },

    // Estado del bar (activo/inactivo)
    activo: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
  }
);

const Bares = models.Bares || model("Bares", BaresSchema);
export default Bares;