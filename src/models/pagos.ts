import { Schema, model, models } from "mongoose";

const PagoSchema = new Schema(
  {
    salidaId: {
      type: Schema.Types.ObjectId,
      ref: "SalidaSocial", // tu colección de eventos
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    comprobanteUrl: {
      type: String,
      required: function () {
        // Solo requerido si no es pago de MercadoPago
        return !this.mercadoPagoPaymentId;
      },
    },
    estado: {
      type: String,
      enum: ["pendiente", "aprobado", "rechazado"],
      default: "pendiente",
    },
    // Campos específicos de MercadoPago
    mercadoPagoPaymentId: {
      type: String,
      unique: true,
      sparse: true, // Permite nulls pero únicos
    },
    amount: {
      type: Number,
    },
    currency: {
      type: String,
      default: "ARS",
    },
    paymentMethod: {
      type: String,
    },
    status: {
      type: String, // Estado de MercadoPago
    },
    statusDetail: {
      type: String, // Detalle del estado de MercadoPago
    },
    externalReference: {
      type: String,
    },
    mercadoPagoData: {
      type: Schema.Types.Mixed, // Almacenar toda la respuesta de MP
    },
    // Tipo de pago
    tipoPago: {
      type: String,
      enum: ["transferencia", "mercadopago"],
      default: "transferencia",
    },
  },
  { timestamps: true }
);

export default models.Pago || model("Pago", PagoSchema);
