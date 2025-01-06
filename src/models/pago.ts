import mongoose from 'mongoose';

const PagoSchema = new mongoose.Schema({
  usuario_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  },
  grupo_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grupo',
    required: true,
  },
  mes_pagado: {
    type: String,
    required: true,
  },
  monto: {
    type: Number,
    required: true,
  },
  estado: {
    type: String,
    enum: ['aprobado', 'pendiente', 'rechazado'],
    default: 'pendiente',
  },
  fecha_pago: {
    type: Date,
    default: Date.now,
  },
  detalle_transaccion: {
    id_transaccion: { type: String, required: true },
    metodo_pago: { type: String, required: true },
    numero_tarjeta: { type: String },
  },
});

const Pago = mongoose.model('Pago', PagoSchema);

export default Pago;
