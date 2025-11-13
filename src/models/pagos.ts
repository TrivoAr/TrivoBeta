import { Schema, model, models } from "mongoose";

const PagoSchema = new Schema(
  {
    salidaId: {
      type: Schema.Types.ObjectId,
      ref: "SalidaSocial", // tu colección de eventos
      required: false,
    },
    academiaId: {
      type: Schema.Types.ObjectId,
      ref: "Academia", // Referencia a academias
      required: false,
    },
    miembro_id: {
      type: Schema.Types.ObjectId,
      ref: "MiembroSalida", // Referencia al miembro de la salida
      required: false,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    comprobanteUrl: {
      type: String,
      required: false,
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
    mercadopagoId: {
      type: String, // Alias para compatibilidad con webhook
      sparse: true,
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
      enum: ["transferencia", "mercadopago", "mercadopago_automatico"],
      default: "transferencia",
    },
    // Webhook tracking
    webhookProcessedAt: {
      type: Date, // Cuándo se procesó el webhook
    },
    // Revenue tracking
    revenueTracked: {
      type: Boolean,
      default: false, // Para evitar trackear revenue duplicado
    },
    revenueTrackedAt: {
      type: Date, // Cuándo se trackeó el revenue
    },
  },
  { timestamps: true }
);

const Pago = models.Pago || model("Pago", PagoSchema);
export default Pago;
