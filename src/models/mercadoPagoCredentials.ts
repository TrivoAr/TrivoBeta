import { Schema, model, models } from "mongoose";

const MercadoPagoCredentialsSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    publicKey: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    hasCredentials: {
      type: Boolean,
      default: false, // Indica si el usuario ha agregado credenciales alguna vez
    },
  },
  { timestamps: true }
);

export default models.MercadoPagoCredentials ||
  model("MercadoPagoCredentials", MercadoPagoCredentialsSchema);
