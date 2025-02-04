import mongoose, { Schema, model, models } from "mongoose";

const PagoSchema = new Schema({
  usuario_id: { type: String, required: true },
  grupo_id: { type: String, required: true },
  mes_pagado: { type: String, required: true },
  monto: { type: Number, required: true },
  estado: { type: String, required: true },
  fecha_pago: { type: Date, default: Date.now },
  detalle_transaccion: {
    id_transaccion: { type: String, required: true },
    metodo_pago: { type: String, required: true },
    numero_tarjeta: { type: String, required: true },
  },
});

// Verifica si ya existe el modelo para evitar la sobreescritura
const Pago = models.Pago || model("Pago", PagoSchema);

export default Pago;
