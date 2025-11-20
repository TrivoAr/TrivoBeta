import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/libs/mongodb";
import ClubTrekkingMembership from "@/models/ClubTrekkingMembership";
import User from "@/models/user";
import { authOptions } from "@/libs/authOptions";
import {
  CLUB_TREKKING_CONFIG,
  clubTrekkingHelpers,
} from "@/config/clubTrekking.config";
import { getClubConfig } from "@/services/clubTrekkingConfigService";
import { MercadoPagoConfig, PreApproval } from "mercadopago";

// Inicializar MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || "",
});

const preapproval = new PreApproval(client);

/**
 * POST /api/club-trekking/subscribe
 * Crear nueva suscripción al Club del Trekking
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    await connectDB();

    // Buscar el usuario
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si ya tiene una membresía activa
    const membershipExistente = await ClubTrekkingMembership.findOne({
      userId: user._id,
      estado: { $in: ["activa", "pausada"] },
    });

    if (membershipExistente) {
      return NextResponse.json(
        {
          error: "Ya tienes una membresía activa",
          membership: membershipExistente,
        },
        { status: 400 }
      );
    }

    // Crear preferencia de suscripción en MercadoPago
    const fechaInicio = new Date();
    const fechaFin = clubTrekkingHelpers.calcularFechaFinPeriodo(fechaInicio);
    const proximaFechaPago = clubTrekkingHelpers.calcularProximaFechaPago(fechaInicio);

    // Obtener la URL base de forma más robusta
    const baseUrl = process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      `http://localhost:${process.env.PORT || 3000}`;

    const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');

    // MercadoPago REQUIERE back_url pero no acepta localhost
    // En desarrollo, usar una URL placeholder válida
    const backUrl = isLocalhost
      ? "https://example.com/club-del-trekking/success"  // Placeholder para desarrollo
      : `${baseUrl}/club-del-trekking/success`;

    console.log("🔗 Back URL generada:", backUrl, "(localhost:", isLocalhost, ")");

    const config = await getClubConfig();

    const preapprovalData = {
      reason: config.MERCADO_PAGO.MOTIVO,
      auto_recurring: {
        frequency: config.MERCADO_PAGO.FRECUENCIA,
        frequency_type: config.MERCADO_PAGO.TIPO_FRECUENCIA,
        transaction_amount: config.PRECIO_MENSUAL,
        currency_id: config.MERCADO_PAGO.MONEDA,
      },
      payer_email: user.email,
      external_reference: user._id.toString(),
      back_url: backUrl,  // Siempre incluir back_url (requerido por MercadoPago)
    };

    console.log("📦 PreapprovalData:", JSON.stringify(preapprovalData, null, 2));

    // Verificar que el token esté configurado
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) {
      throw new Error("MP_ACCESS_TOKEN no está configurado");
    }

    const isTestToken = token.startsWith("TEST-");
    console.log("🔑 Usando token de:", isTestToken ? "PRUEBA (TEST)" : "PRODUCCIÓN");

    // BYPASS para desarrollo: si estamos en localhost con token de producción,
    // crear membresía directamente sin pasar por MercadoPago
    if (!isTestToken && isLocalhost) {
      console.warn("⚠️  MODO DESARROLLO: Creando membresía sin MercadoPago");
      console.warn("⚠️  Para producción, usa credenciales de PRUEBA desde:");
      console.warn("⚠️  https://www.mercadopago.com.ar/developers/panel/credentials");

      // Crear membresía directamente (solo para desarrollo)
      const membership = new ClubTrekkingMembership({
        userId: user._id,
        estado: "activa",
        fechaInicio,
        fechaFin,
        proximaFechaPago,
        precioMensual: config.PRECIO_MENSUAL,
        metodoPago: "dev-bypass",
        mercadoPagoSubscriptionId: `dev-${Date.now()}`,
        historialSalidas: [],
        penalizacion: {
          activa: false,
          inasistenciasConsecutivas: 0,
          historialPenalizaciones: [],
        },
      });

      await membership.save();

      // Actualizar el usuario
      user.clubTrekking = {
        esMiembro: true,
        membershipId: membership._id,
        badge: {
          activo: true,
          tipoMiembro: "bronce",
        },
      };
      await user.save();

      console.log("✅ Membresía de desarrollo creada:", membership._id);

      return NextResponse.json({
        success: true,
        devMode: true,
        membership: {
          _id: membership._id,
          estado: membership.estado,
          fechaInicio: membership.fechaInicio,
          fechaFin: membership.fechaFin,
        },
        message: "Membresía creada en modo desarrollo (sin MercadoPago)",
      });
    }

    const response = await preapproval.create({ body: preapprovalData });

    // Crear la membresía en estado PENDIENTE hasta que se confirme el pago
    const membership = new ClubTrekkingMembership({
      userId: user._id,
      estado: "pendiente", // Se activará cuando el webhook confirme el pago
      fechaInicio,
      fechaFin,
      proximaFechaPago,
      mercadoPago: {
        preapprovalId: response.id,
        payerId: response.payer_id,
        payerEmail: user.email,
        status: response.status,
      },
      usoMensual: {
        salidasRealizadas: 0,
        limiteSemanal: config.LIMITES.SALIDAS_POR_SEMANA,
        ultimaResetFecha: fechaInicio,
      },
    });

    await membership.save();

    // NO actualizar el usuario aún - se hará cuando el webhook confirme el pago
    // El webhook activará la membresía y actualizará el usuario

    return NextResponse.json(
      {
        success: true,
        membership: {
          _id: membership._id,
          estado: membership.estado,
          fechaInicio: membership.fechaInicio,
          fechaFin: membership.fechaFin,
        },
        initPoint: response.init_point,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear suscripción al Club del Trekking:", error);

    // Proporcionar más detalles del error en producción para debugging
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    const errorDetails = error instanceof Error && 'cause' in error ? error.cause : null;

    console.error("Detalles del error:", {
      message: errorMessage,
      details: errorDetails,
      stack: error instanceof Error ? error.stack : null,
      tokenConfigured: !!process.env.MP_ACCESS_TOKEN,
      tokenType: process.env.MP_ACCESS_TOKEN?.startsWith('TEST-') ? 'TEST' : process.env.MP_ACCESS_TOKEN?.startsWith('APP_USR-') ? 'PRODUCTION' : 'INVALID',
    });

    return NextResponse.json(
      {
        error: "Error al crear la suscripción",
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
