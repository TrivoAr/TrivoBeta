import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { connectDB } from "@/libs/mongodb";
import Pagos from "@/models/pagos";
import MiembroSalida from "@/models/MiembroSalida";
import SalidaSocial from "@/models/salidaSocial";
import User from "@/models/user";
import Notificacion from "@/models/notificacion";

// Configurar cliente de MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
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
      // Crear nuevo miembro con auto-aprobación para pagos de MercadoPago
      miembro = new MiembroSalida({
        salida_id: salidaId,
        usuario_id: userId,
        pago_id: pagoId,
        estado: "aprobado" // Auto-aprobación para MercadoPago
      });
    } else {
      // Actualizar miembro existente y auto-aprobar para MercadoPago
      miembro.pago_id = pagoId;
      miembro.estado = "aprobado"; // Auto-aprobación para MercadoPago
    }

    await miembro.save();
    console.log(`Pago de MercadoPago aprobado automáticamente para salida ${salidaId}, usuario ${userId}`);

    // Notificar al creador de la salida
    await notificarCreadorPagoAprobado(salidaId, userId, "mercadopago");

  } catch (error) {
    console.error("Error procesando pago aprobado:", error);
  }
}

// Función para notificar al creador sobre el pago aprobado
async function notificarCreadorPagoAprobado(salidaId: string, userId: string, metodoPago: string) {
  try {
    // Obtener información de la salida y el usuario
    const salida = await SalidaSocial.findById(salidaId);
    const usuario = await User.findById(userId);

    if (!salida || !usuario) {
      console.error("No se encontró la salida o el usuario para notificar");
      return;
    }

    // No notificar si el creador es el mismo usuario (no debería pasar, pero por las dudas)
    if (String(salida.creador_id) === String(userId)) {
      return;
    }

    // Crear notificación para el creador
    const mensaje = metodoPago === "mercadopago"
      ? `${usuario.firstname} ha pagado y se unió automáticamente a tu salida "${salida.nombre}".`
      : `${usuario.firstname} ha enviado el comprobante de pago para tu salida "${salida.nombre}". Revisa y aprueba su participación.`;

    await Notificacion.create({
      userId: salida.creador_id,
      fromUserId: userId,
      salidaId: salida._id,
      type: metodoPago === "mercadopago" ? "payment_approved" : "payment_pending",
      message: mensaje,
    });

    console.log(`Notificación enviada al creador (${salida.creador_id}) sobre ${metodoPago === "mercadopago" ? "pago aprobado" : "comprobante recibido"}`);

  } catch (error) {
    console.error("Error enviando notificación al creador:", error);
  }
}