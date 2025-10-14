/**
 * POST /api/subscriptions/activate
 * Activa una suscripción después de que el trial expiró
 * Genera el link de pago de MercadoPago para configurar la suscripción
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { mercadopagoService } from "@/services/mercadopagoService";
import Academia from "@/models/academia";
import Suscripcion from "@/models/Suscripcion";
import connectDB from "@/libs/mongodb";
import { SUBSCRIPTION_CONFIG } from "@/config/subscription.config";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { suscripcionId } = await request.json();

    if (!suscripcionId) {
      return NextResponse.json(
        { error: "suscripcionId es requerido" },
        { status: 400 }
      );
    }

    await connectDB();

    // Obtener la suscripción
    const suscripcion = await Suscripcion.findById(suscripcionId);

    if (!suscripcion) {
      return NextResponse.json(
        { error: "Suscripción no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que la suscripción pertenece al usuario
    if (suscripcion.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes permiso para activar esta suscripción" },
        { status: 403 }
      );
    }

    // Verificar que el trial haya expirado
    if (suscripcion.estado !== SUBSCRIPTION_CONFIG.ESTADOS.TRIAL_EXPIRADO) {
      return NextResponse.json(
        {
          error: "La suscripción no está en estado de trial expirado",
          estado: suscripcion.estado,
        },
        { status: 400 }
      );
    }

    // Verificar si ya tiene un initPoint generado
    if (suscripcion.mercadoPago?.initPoint) {
      return NextResponse.json({
        success: true,
        message: "Link de pago ya existe",
        mercadoPago: {
          initPoint: suscripcion.mercadoPago.initPoint,
          preapprovalId: suscripcion.mercadoPago.preapprovalId,
        },
      });
    }

    // Obtener información de la academia
    const academia = await Academia.findById(suscripcion.academiaId);

    if (!academia) {
      return NextResponse.json(
        { error: "Academia no encontrada" },
        { status: 404 }
      );
    }

    // Validar monto mínimo requerido por MercadoPago
    const montoSuscripcion = suscripcion.pagos.monto;
    const montoMinimo = SUBSCRIPTION_CONFIG.SUBSCRIPTION.MIN_AMOUNT;

    console.log(
      `[ACTIVATE_SUBSCRIPTION] Monto de la suscripción: ${montoSuscripcion} (tipo: ${typeof montoSuscripcion}), Mínimo: ${montoMinimo}`
    );

    if (montoSuscripcion < montoMinimo) {
      return NextResponse.json(
        {
          error: `El monto de la suscripción ($${montoSuscripcion}) es menor al mínimo requerido por MercadoPago ($${montoMinimo}). Por favor, contacta al organizador de la academia.`,
          monto: montoSuscripcion,
          montoMinimo: montoMinimo,
        },
        { status: 400 }
      );
    }

    // Generar external reference para el preapproval
    const externalReference = mercadopagoService.generarExternalReference(
      session.user.id,
      suscripcion.academiaId.toString()
    );

    // Crear preapproval en Mercado Pago
    let mercadoPagoData;
    try {
      mercadoPagoData = await mercadopagoService.crearPreapproval({
        userId: session.user.id,
        academiaId: suscripcion.academiaId.toString(),
        grupoId: suscripcion.grupoId?.toString(),
        userEmail: session.user.email,
        razon: `Suscripción a ${academia.nombre_academia}`,
        monto: suscripcion.pagos.monto,
        conTrial: false, // Ya no tiene trial
        externalReference,
      });
    } catch (error: any) {
      console.error("[ACTIVATE_SUBSCRIPTION] Error creando preapproval:", error);

      // Si el error es por falta de credenciales, devolver mensaje específico
      if (
        error.message.includes("no están configuradas en las variables de entorno")
      ) {
        return NextResponse.json(
          {
            error:
              "Las credenciales de MercadoPago no están configuradas. Por favor, contacta al administrador.",
          },
          { status: 500 }
        );
      }

      // Si el error es por monto mínimo
      if (error.message.includes("Cannot pay an amount lower than")) {
        return NextResponse.json(
          {
            error: `El monto de la suscripción es menor al mínimo permitido por MercadoPago ($${SUBSCRIPTION_CONFIG.SUBSCRIPTION.MIN_AMOUNT}). Por favor, contacta al organizador de la academia.`,
            monto: suscripcion.pagos.monto,
            montoMinimo: SUBSCRIPTION_CONFIG.SUBSCRIPTION.MIN_AMOUNT,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: "Error al crear link de pago: " + error.message,
        },
        { status: 500 }
      );
    }

    // Actualizar suscripción con datos de Mercado Pago
    suscripcion.mercadoPago = {
      preapprovalId: mercadoPagoData.preapprovalId,
      initPoint: mercadoPagoData.initPoint,
      status: mercadoPagoData.status || "pending",
      payerEmail: session.user.email,
    };

    // Cambiar estado a pendiente de pago
    suscripcion.estado = SUBSCRIPTION_CONFIG.ESTADOS.PENDIENTE;

    await suscripcion.save();

    console.log(
      `[ACTIVATE_SUBSCRIPTION] Preapproval creado exitosamente para suscripción ${suscripcionId}`
    );

    return NextResponse.json({
      success: true,
      message: "Link de pago generado exitosamente",
      mercadoPago: {
        initPoint: mercadoPagoData.initPoint,
        preapprovalId: mercadoPagoData.preapprovalId,
      },
      suscripcion: {
        id: suscripcion._id,
        estado: suscripcion.estado,
      },
    });
  } catch (error: any) {
    console.error("[ACTIVATE_SUBSCRIPTION] Error:", error);
    return NextResponse.json(
      { error: error.message || "Error al activar suscripción" },
      { status: 500 }
    );
  }
}
