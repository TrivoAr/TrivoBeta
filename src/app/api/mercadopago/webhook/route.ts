import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { connectDB } from "@/libs/mongodb";
import Pagos from "@/models/Pagos";
import MiembroSalida from "@/models/MiembroSalida";

// Configurar cliente de MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

const payment = new Payment(client);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("Webhook MercadoPago recibido:", body);

    // Verificar que es una notificación de pago
    if (body.type !== "payment") {
      return NextResponse.json({ message: "Tipo de notificación no procesada" });
    }

    const paymentId = body.data.id;

    if (!paymentId) {
      return NextResponse.json({ error: "ID de pago no encontrado" }, { status: 400 });
    }

    // Obtener información del pago desde MercadoPago
    const paymentData = await payment.get({ id: paymentId });

    console.log("Datos del pago:", paymentData);

    if (!paymentData.external_reference) {
      console.log("No hay external_reference en el pago");
      return NextResponse.json({ message: "Sin external_reference" });
    }

    // Parsear external_reference (formato: salidaId-userId)
    const [salidaId, userId] = paymentData.external_reference.split("-");

    await connectDB();

    // Buscar o crear el registro de pago
    let pagoRecord = await Pagos.findOne({
      salidaId,
      userId,
      mercadoPagoPaymentId: paymentId
    });

    if (!pagoRecord) {
      // Crear nuevo registro de pago
      pagoRecord = new Pagos({
        salidaId,
        userId,
        mercadoPagoPaymentId: paymentId,
        amount: paymentData.transaction_amount,
        currency: paymentData.currency_id,
        paymentMethod: paymentData.payment_method_id,
        status: paymentData.status,
        statusDetail: paymentData.status_detail,
        externalReference: paymentData.external_reference,
        mercadoPagoData: paymentData,
        estado: mapMercadoPagoStatus(paymentData.status)
      });
    } else {
      // Actualizar registro existente
      pagoRecord.status = paymentData.status;
      pagoRecord.statusDetail = paymentData.status_detail;
      pagoRecord.estado = mapMercadoPagoStatus(paymentData.status);
      pagoRecord.mercadoPagoData = paymentData;
    }

    await pagoRecord.save();

    // Si el pago fue aprobado, actualizar el estado del miembro
    if (paymentData.status === "approved") {
      await procesarPagoAprobado(salidaId, userId, pagoRecord._id);
    }

    return NextResponse.json({ message: "Webhook procesado correctamente" });

  } catch (error) {
    console.error("Error procesando webhook MercadoPago:", error);
    return NextResponse.json({
      error: "Error interno del servidor"
    }, { status: 500 });
  }
}

// Mapear estado de MercadoPago a nuestro sistema
function mapMercadoPagoStatus(mpStatus: string): string {
  switch (mpStatus) {
    case "approved":
      return "aprobado";
    case "pending":
    case "in_process":
      return "pendiente";
    case "rejected":
    case "cancelled":
      return "rechazado";
    default:
      return "pendiente";
  }
}

// Procesar pago aprobado
async function procesarPagoAprobado(salidaId: string, userId: string, pagoId: string) {
  try {
    // Buscar si ya existe un miembro para esta salida y usuario
    let miembro = await MiembroSalida.findOne({
      salida_id: salidaId,
      usuario_id: userId
    });

    if (!miembro) {
      // Crear nuevo miembro
      miembro = new MiembroSalida({
        salida_id: salidaId,
        usuario_id: userId,
        pago_id: pagoId,
        estado: "aprobado"
      });
    } else {
      // Actualizar miembro existente
      miembro.pago_id = pagoId;
      miembro.estado = "aprobado";
    }

    await miembro.save();
    console.log(`Miembro aprobado para salida ${salidaId}, usuario ${userId}`);

  } catch (error) {
    console.error("Error procesando pago aprobado:", error);
  }
}