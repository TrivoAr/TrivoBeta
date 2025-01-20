import { Schema, model, models } from "mongoose";

const MercadoPagoCredentialsSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true, // Cada usuario tiene un único registro de credenciales
    },
    publicKey: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default models.MercadoPagoCredentials ||
  model("MercadoPagoCredentials", MercadoPagoCredentialsSchema);
