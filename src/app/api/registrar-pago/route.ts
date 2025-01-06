import { connectDB } from "@/libs/mongodb";
import Pago from "@/models/pago";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { payment_id, status, external_reference } = req.body;

  if (!payment_id || !status || !external_reference) {
    return res.status(400).json({ error: "Faltan parámetros necesarios" });
  }

  try {
    await connectDB();

    const nuevoPago = new Pago({
      usuarioId: external_reference,
      grupoId: "grupoId_placeholder", // Puedes adaptarlo si tienes más datos
      monto: 25000, // Este valor debería ser dinámico
      estado: status,
      transaccionId: payment_id,
    });

    await nuevoPago.save();

    return res.status(201).json({ message: "Pago registrado exitosamente" });
  } catch (error) {
    console.error("Error al registrar el pago:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
