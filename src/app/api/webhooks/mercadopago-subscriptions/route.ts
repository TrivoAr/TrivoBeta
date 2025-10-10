/**
 * POST /api/webhooks/mercadopago-subscriptions
 * Webhook para recibir notificaciones de Mercado Pago sobre suscripciones
 * https://www.mercadopago.com.ar/developers/es/docs/subscriptions/additional-content/notifications
 */

import { NextRequest, NextResponse } from "next/server";
import Suscripcion from "@/models/Suscripcion";
import Pago from "@/models/pagos";
import { SUBSCRIPTION_CONFIG } from "@/config/subscription.config";
import connectDB from "@/libs/mongodb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log(
      "Webhook Mercado Pago recibido:",
      JSON.stringify(body, null, 2)
    );

    // Validar que sea una notificación de preapproval
    if (body.type !== "subscription_preapproval") {
      console.log("Tipo de notificación ignorada:", body.type);
      return NextResponse.json({ received: true });
    }

    const { data } = body;
    if (!data?.id) {
      console.error("Notificación sin ID:", body);
      return NextResponse.json({ error: "Missing data.id" }, { status: 400 });
    }

    await connectDB();

    // Buscar la suscripción por preapprovalId
    const suscripcion = await Suscripcion.findOne({
      "mercadoPago.preapprovalId": data.id,
    });

    if (!suscripcion) {
      console.error("Suscripción no encontrada para preapprovalId:", data.id);
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Procesar según el action
    switch (body.action) {
      case "created":
        // Suscripción creada y autorizada por el usuario
        suscripcion.mercadoPago.status = "authorized";

        // Si la suscripción estaba en trial_expirado, activarla
        if (suscripcion.estado === SUBSCRIPTION_CONFIG.ESTADOS.TRIAL_EXPIRADO) {
          suscripcion.estado = SUBSCRIPTION_CONFIG.ESTADOS.ACTIVA;
          suscripcion.fechaActivacion = new Date();
          suscripcion.trial.estaEnTrial = false;
          suscripcion.trial.fueUsado = true;
          console.log("Suscripción activada post-trial:", suscripcion._id);
        }

        await suscripcion.save();
        console.log("Suscripción autorizada:", suscripcion._id);
        break;

      case "payment.created":
      case "payment.updated":
        // Nuevo pago de la suscripción
        await procesarPago(suscripcion, data);
        break;

      case "updated":
        // Actualización del preapproval (puede ser cambio de estado)
        if (data.status) {
          suscripcion.mercadoPago.status = data.status;

          // Actualizar estado local según estado de Mercado Pago
          if (data.status === "cancelled") {
            suscripcion.estado = SUBSCRIPTION_CONFIG.ESTADOS.CANCELADA;
            suscripcion.fechaCancelacion = new Date();
          } else if (data.status === "paused") {
            suscripcion.estado = SUBSCRIPTION_CONFIG.ESTADOS.PAUSADA;
            suscripcion.fechaPausa = new Date();
          } else if (data.status === "authorized") {
            // Si estaba pausada y ahora está autorizada, reactivar
            if (suscripcion.estado === SUBSCRIPTION_CONFIG.ESTADOS.PAUSADA) {
              suscripcion.estado = SUBSCRIPTION_CONFIG.ESTADOS.ACTIVA;
            }
          }

          await suscripcion.save();
          console.log("Suscripción actualizada:", suscripcion._id, data.status);
        }
        break;

      default:
        console.log("Acción no manejada:", body.action);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error procesando webhook de Mercado Pago:", error);
    return NextResponse.json(
      { error: error.message || "Error processing webhook" },
      { status: 500 }
    );
  }
}

/**
 * Procesa un pago de suscripción
 */
async function procesarPago(suscripcion: any, paymentData: any) {
  try {
    // Verificar si ya existe el pago registrado
    const pagoExistente = await Pago.findOne({
      mercadoPagoPaymentId: paymentData.payment_id,
    });

    if (pagoExistente) {
      console.log("Pago ya registrado:", paymentData.payment_id);
      return;
    }

    // Crear registro de pago
    const pago = await Pago.create({
      academiaId: suscripcion.academiaId,
      userId: suscripcion.userId,
      mercadoPagoPaymentId: paymentData.payment_id,
      amount: suscripcion.pagos.monto,
      currency: suscripcion.pagos.moneda,
      status: paymentData.status,
      statusDetail: paymentData.status_detail,
      externalReference: `sub_${suscripcion._id}`,
      tipoPago: "mercadopago",
      estado: paymentData.status === "approved" ? "aprobado" : "pendiente",
    });

    // Actualizar estado de suscripción según el pago
    if (paymentData.status === "approved") {
      suscripcion.estado = SUBSCRIPTION_CONFIG.ESTADOS.ACTIVA;
      suscripcion.pagos.ultimaFechaPago = new Date();

      // Calcular próxima fecha de pago
      const proximaFecha = new Date();
      if (suscripcion.pagos.tipoFrecuencia === "months") {
        proximaFecha.setMonth(
          proximaFecha.getMonth() + suscripcion.pagos.frecuencia
        );
      } else if (suscripcion.pagos.tipoFrecuencia === "days") {
        proximaFecha.setDate(
          proximaFecha.getDate() + suscripcion.pagos.frecuencia
        );
      }
      suscripcion.pagos.proximaFechaPago = proximaFecha;

      await suscripcion.save();
      console.log("Pago aprobado y suscripción actualizada:", pago._id);
    } else if (paymentData.status === "rejected") {
      suscripcion.estado = SUBSCRIPTION_CONFIG.ESTADOS.VENCIDA;
      await suscripcion.save();
      console.log("Pago rechazado, suscripción vencida:", pago._id);
    }
  } catch (error) {
    console.error("Error procesando pago:", error);
    throw error;
  }
}

// Permitir GET para verificación de Mercado Pago
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Webhook endpoint for Mercado Pago subscriptions",
    status: "active",
  });
}
