// models/subscription.ts
import mongoose, { Schema, Document } from "mongoose";

// Interfaz para TypeScript
interface ISubscription extends Document {
  user_id: string; // ID del usuario al que pertenece la suscripción
  endpoint: string; // Endpoint de la suscripción
  keys: {
    p256dh: string; // Clave pública
    auth: string;   // Token de autenticación
  };
}

// Esquema de la suscripción
const SubscriptionSchema: Schema = new Schema({
  user_id: {
    type: String,
    required: true,
    ref: "User", // Referencia al modelo de usuario
  },
  endpoint: {
    type: String,
    required: true,
  },
  keys: {
    p256dh: { type: String, required: true }, // Clave pública del cliente
    auth: { type: String, required: true },   // Token de autenticación del cliente
  },
});

// Exportar el modelo
export default mongoose.models.Subscription || mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
