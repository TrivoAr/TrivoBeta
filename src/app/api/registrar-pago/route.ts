import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Pago from "@/models/pago";
import { connectDB } from "@/libs/mongodb";

export async function POST(req) {
  try {
    await connectDB();
    
    const { payment_id, status, external_reference, monto, metodo_pago, usuario_id, grupo_id, mes_pagado } = await req.json();

    if (!payment_id || !status || !external_reference || !monto || !metodo_pago || !usuario_id || !grupo_id || !mes_pagado) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const nuevoPago = new Pago({
      usuario_id,
      grupo_id,
      mes_pagado,
      monto,
      estado: status === "approved" ? "aprobado" : status,
      fecha_pago: new Date(),
      detalle_transaccion: {
        id_transaccion: payment_id,
        metodo_pago,
        numero_tarjeta: "**** **** **** 1234", // Esto debería venir de la API de MercadoPago
      },
    });

    await nuevoPago.save();

    return NextResponse.json({ message: "Pago registrado correctamente" }, { status: 200 });
  } catch (error) {
    console.error("Error al registrar el pago:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
