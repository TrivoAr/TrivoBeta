import { connectDB } from "@/libs/mongodb";
import Pago from "@/models/pago";
import { NextResponse } from "next/server";

// Manejo del POST para registrar un pago
export async function POST(req: Request) {
  try {
    const body = await req.json(); // Obtén los datos del cuerpo de la solicitud
    const { payment_id, status, external_reference } = body;

    // Validación de parámetros
    if (!payment_id || !status || !external_reference) {
      return NextResponse.json({ error: "Faltan parámetros necesarios" }, { status: 400 });
    }

    await connectDB();

    // Se podría ajustar para obtener el grupoId y monto de forma dinámica
    const nuevoPago = new Pago({
      usuarioId: external_reference,
      grupoId: "grupoId_placeholder", // Actualiza según sea necesario
      monto: 25000, // Reemplaza con el valor correcto
      estado: status,
      transaccionId: payment_id,
    });

    await nuevoPago.save();

    return NextResponse.json({ message: "Pago registrado exitosamente" }, { status: 201 });
  } catch (error) {
    console.error("Error al registrar el pago:", error); // Mejora: Usar un logger en producción
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
