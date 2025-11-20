import { Schema, model, models } from "mongoose";

const ClubTrekkingConfigSchema = new Schema(
    {
        // Precios
        precioMensual: {
            type: Number,
            required: true,
            default: 25000,
        },
        maxPrecioSalida: {
            type: Number,
            required: true,
            default: 10000,
        },

        // Reglas
        limiteSemanal: {
            type: Number,
            required: true,
            default: 2,
        },
        radioCheckIn: {
            type: Number,
            required: true,
            default: 100, // Metros
        },
        deportePermitido: {
            type: String,
            required: true,
            default: "Trekking",
        },

        // Estado del sistema
        active: {
            type: Boolean,
            default: true,
        },

        // Metadata de última actualización
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

// Singleton pattern: Solo debería haber un documento de configuración
// Pero por flexibilidad permitimos crear más si fuera necesario (ej: histórico)

const ClubTrekkingConfig =
    models.ClubTrekkingConfig ||
    model("ClubTrekkingConfig", ClubTrekkingConfigSchema);

export default ClubTrekkingConfig;
