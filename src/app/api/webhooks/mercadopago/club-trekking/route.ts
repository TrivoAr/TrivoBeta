import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/libs/mongodb";
import ClubTrekkingMembership from "@/models/ClubTrekkingMembership";
import User from "@/models/user";
import Pago from "@/models/pagos";
import { MercadoPagoConfig, Payment } from "mercadopago";

// Inicializar MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || "",
});

const payment = new Payment(client);

/**
 * POST /api/webhooks/mercadopago/club-trekking
 * Webhook para notificaciones de MercadoPago sobre pagos del Club del Trekking
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("Webhook Club Trekking recibido:", JSON.stringify(body, null, 2));

    const { type, data, action } = body;

    // Solo procesar eventos de pagos
    if (type !== "payment" && action !== "payment.created" && action !== "payment.updated") {
      return NextResponse.json(
        { message: "Evento no procesado" },
        { status: 200 }
      );
    }

    if (!data?.id) {
      return NextResponse.json(
        { error: "ID de pago no encontrado" },
        { status: 400 }
      );
    }

    await connectDB();

    // Obtener información del pago desde MercadoPago
    const paymentInfo: any = await payment.get({ id: data.id });

    console.log("Información del pago:", JSON.stringify(paymentInfo, null, 2));

    if (!paymentInfo.preapproval_id) {
      console.log("Pago no asociado a suscripción, ignorando");
      return NextResponse.json(
        { message: "Pago no asociado a suscripción" },
        { status: 200 }
      );
    }

    // Buscar la membresía por preapprovalId
    const membership = await ClubTrekkingMembership.findOne({
      "mercadoPago.preapprovalId": paymentInfo.preapproval_id,
    });

    if (!membership) {
      console.error("Membresía no encontrada para preapprovalId:", paymentInfo.preapproval_id);
      return NextResponse.json(
        { error: "Membresía no encontrada" },
        { status: 404 }
      );
    }

    // Procesar según el estado del pago
    switch (paymentInfo.status) {
      case "approved":
        await procesarPagoAprobado(membership, paymentInfo);
        break;

      case "rejected":
      case "cancelled":
        await procesarPagoRechazado(membership, paymentInfo);
        break;

      case "pending":
      case "in_process":
        await procesarPagoPendiente(membership, paymentInfo);
        break;

      default:
        console.log("Estado de pago no manejado:", paymentInfo.status);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error en webhook de Club Trekking:", error);
    return NextResponse.json(
      { error: "Error procesando webhook" },
      { status: 500 }
    );
  }
}

async function procesarPagoAprobado(membership: any, paymentInfo: any) {
  console.log("Procesando pago aprobado para membership:", membership._id);

  membership.estado = "activa";
  membership.mercadoPago.status = "approved";

  // Actualizar fechas
  const ahora = new Date();
  const proximaFechaPago = new Date(ahora);
  proximaFechaPago.setMonth(ahora.getMonth() + 1);

  membership.proximaFechaPago = proximaFechaPago;

  await membership.save();

  // Actualizar usuario
  const user = await User.findById(membership.userId);
  if (user) {
    user.clubTrekking.esMiembro = true;
    user.clubTrekking.badge.activo = true;
    await user.save();
  }

  // REGISTRAR PAGO EN HISTORIAL
  try {
    // Verificar si ya existe este pago para evitar duplicados
    const pagoExistente = await Pago.findOne({
      mercadopagoId: paymentInfo.id.toString(),
    });

    if (!pagoExistente) {
      const nuevoPago = new Pago({
        userId: membership.userId,
        estado: "aprobado",
        mercadopagoId: paymentInfo.id.toString(),
        amount: paymentInfo.transaction_amount,
        currency: paymentInfo.currency_id,
        paymentMethod: paymentInfo.payment_method_id,
        status: paymentInfo.status,
        statusDetail: paymentInfo.status_detail,
        externalReference: paymentInfo.external_reference,
        mercadoPagoData: paymentInfo,
        tipoPago: "mercadopago_automatico", // Usamos este tipo o podríamos crear uno nuevo "suscripcion"
        webhookProcessedAt: new Date(),
      });

      await nuevoPago.save();
      console.log("✅ Pago histórico registrado:", nuevoPago._id);
    } else {
      console.log("ℹ️ El pago ya estaba registrado en el historial");
    }
  } catch (error) {
    console.error("❌ Error al registrar pago en historial:", error);
    // No lanzamos error para no interrumpir el flujo principal de activación
  }

  // TODO: Enviar notificación de renovación exitosa
  console.log("Pago aprobado exitosamente para membership:", membership._id);
}

async function procesarPagoRechazado(membership: any, paymentInfo: any) {
  console.log("Procesando pago rechazado para membership:", membership._id);

  membership.estado = "vencida";
  membership.mercadoPago.status = paymentInfo.status;

  await membership.save();

  // Actualizar usuario
  const user = await User.findById(membership.userId);
  if (user) {
    user.clubTrekking.esMiembro = false;
    user.clubTrekking.badge.activo = false;
    await user.save();
  }

  // TODO: Enviar notificación de renovación fallida
  console.log("Pago rechazado para membership:", membership._id);
}

async function procesarPagoPendiente(membership: any, paymentInfo: any) {
  console.log("Procesando pago pendiente para membership:", membership._id);

  membership.mercadoPago.status = paymentInfo.status;
  await membership.save();

  console.log("Pago pendiente actualizado para membership:", membership._id);
}
