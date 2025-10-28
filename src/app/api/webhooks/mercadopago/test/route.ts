import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/libs/mongodb";
import Pago from "@/models/pagos";
import User from "@/models/user";

/**
 * ENDPOINT DE TESTING - Solo para desarrollo
 *
 * Simula la llegada de un webhook de MercadoPago sin necesidad de hacer
 * una transferencia real. Útil para probar el flujo de aprobación automática.
 *
 * ⚠️ IMPORTANTE: Este endpoint NO valida la firma del webhook (solo para testing)
 *
 * USO:
 * POST /api/webhooks/mercadopago/test
 * Body:
 * {
 *   "userEmail": "email@del-usuario-que-pago.com",
 *   "amount": 5000,
 *   "salidaId": "optional-salida-id",
 *   "academiaId": "optional-academia-id"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Solo permitir en desarrollo
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Este endpoint solo está disponible en desarrollo" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userEmail, amount, salidaId, academiaId } = body;

    if (!userEmail || !amount) {
      return NextResponse.json(
        { error: "Se requiere userEmail y amount" },
        { status: 400 }
      );
    }

    await connectDB();

    // Buscar el usuario por email
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return NextResponse.json(
        {
          error: `No se encontró usuario con email ${userEmail}`,
          hint: "Verifica que el email esté registrado en Trivo"
        },
        { status: 404 }
      );
    }

    console.log(`🧪 TEST: Buscando pago pendiente para usuario ${user._id} (${userEmail})`);

    // Buscar pago pendiente con los criterios del webhook real
    const pago = await Pago.findOne({
      userId: user._id,
      amount: amount,
      estado: "pendiente",
      tipoPago: "mercadopago_automatico",
      ...(salidaId && { salidaId }),
      ...(academiaId && { academiaId })
    }).populate("userId salidaId academiaId")
      .sort({ createdAt: -1 });

    if (!pago) {
      return NextResponse.json(
        {
          error: "No se encontró pago pendiente que coincida",
          details: {
            userEmail,
            userId: user._id,
            amount,
            salidaId: salidaId || null,
            academiaId: academiaId || null
          },
          hint: "Asegúrate de crear primero el pago pendiente desde el PaymentModal"
        },
        { status: 404 }
      );
    }

    console.log(`✅ TEST: Pago encontrado: ${pago._id}`);

    // Simular paymentDetails de MercadoPago
    const fakePaymentDetails = {
      id: `TEST_${Date.now()}`,
      status: "approved",
      transaction_amount: amount,
      payment_method_id: "bank_transfer",
      status_detail: "accredited",
      date_created: new Date().toISOString(),
      payer: {
        email: userEmail
      }
    };

    // Importar y ejecutar el procesamiento (mismo código que el webhook real)
    const { procesarPagoAprobadoTest } = await import("../test-helpers");

    await procesarPagoAprobadoTest(pago, fakePaymentDetails);

    return NextResponse.json({
      success: true,
      message: "Webhook simulado procesado correctamente",
      pago: {
        id: pago._id,
        userId: pago.userId._id,
        userEmail: userEmail,
        amount: pago.amount,
        estado: "aprobado",
        salidaId: pago.salidaId?._id,
        academiaId: pago.academiaId?._id
      }
    }, { status: 200 });

  } catch (error) {
    console.error("❌ ERROR en endpoint de testing:", error);

    return NextResponse.json(
      {
        error: "Error procesando webhook de testing",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: "MercadoPago Webhook Test Endpoint",
    status: "active",
    environment: process.env.NODE_ENV,
    usage: {
      method: "POST",
      body: {
        userEmail: "email del usuario que 'pagó'",
        amount: "monto del pago pendiente",
        salidaId: "(opcional) ID de la salida",
        academiaId: "(opcional) ID de la academia"
      },
      example: {
        userEmail: "juan@ejemplo.com",
        amount: 5000,
        salidaId: "64abc123..."
      }
    },
    notes: [
      "Este endpoint SOLO funciona en desarrollo",
      "Simula un webhook de MercadoPago sin transferencia real",
      "Busca pago pendiente por email + monto (mismo algoritmo que webhook real)",
      "Procesa aprobación automática completa (ticket, email, notificación)"
    ]
  });
}
