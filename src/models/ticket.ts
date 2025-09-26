// import mongoose, { Schema, InferSchemaType, models, model } from "mongoose";

// const TicketSchema = new Schema({
//   userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
//   salidaId: { type: Schema.Types.ObjectId, ref: "SalidaSocial", required: true, index: true },
//   paymentRef: { type: String, index: true }, // opcional (id interno de tu “pago aprobado”)
//   code: { type: String, required: true, unique: true, index: true }, // QR token opaco
//   status: { type: String, enum: ["issued", "redeemed", "invalid"], default: "issued", index: true },
//   issuedAt: { type: Date, default: Date.now },
//   redeemedAt: { type: Date },
//   redeemedBy: { type: Schema.Types.ObjectId, ref: "User" }, // staff
//   emailSentAt: { type: Date },
//   expiresAt: { type: Date } // si querés que venza al comenzar la salida
// }, { timestamps: true });

// TicketSchema.index({ userId: 1, salidaId: 1 }, { unique: true });

// export type TicketDoc = InferSchemaType<typeof TicketSchema>;
// export default models.Ticket || model("Ticket", TicketSchema);
import { Schema, InferSchemaType, models, model } from "mongoose";

const TicketSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    salidaId: {
      type: Schema.Types.ObjectId,
      ref: "SalidaSocial",
      required: true,
      index: true,
    }, // 🔑
    paymentRef: { type: String, index: true },
    code: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["issued", "redeemed", "invalid"],
      default: "issued",
      index: true,
    },
    issuedAt: { type: Date, default: Date.now },
    redeemedAt: { type: Date },
    redeemedBy: { type: Schema.Types.ObjectId, ref: "User" },
    emailSentAt: { type: Date },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

TicketSchema.index({ userId: 1, salidaId: 1 }, { unique: true });

export type TicketDoc = InferSchemaType<typeof TicketSchema>;
export default models.Ticket || model("Ticket", TicketSchema);
