import Pago from '@/models/pago';
import { connectDB } from "@/libs/mongodb";

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
      usuarioId: external_reference, // Por ejemplo, puedes usar el `external_reference` para identificar al usuario
      grupoId: "grupoId_placeholder", // Actualiza según tus necesidades
      monto: 25000, // Este valor puede venir desde un estado previo o cálculo
      estado: status,
      transaccionId: payment_id,
    });

    await nuevoPago.save();
    res.status(201).json({ message: "Pago registrado exitosamente" });
  } catch (error) {
    console.error("Error al registrar el pago:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}
