import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import connectDB from "@/libs/mongodb";
import ClubTrekkingMembership from "@/models/ClubTrekkingMembership";
import { trackClubTrekkingEvent } from "@/utils/mixpanelEvents";

/**
 * POST /api/club-trekking/confirmar-asistencia
 *
 * Confirma si el usuario asistió o no a una salida después de que pasó el evento
 *
 * Body:
 * {
 *   salidaId: string;
 *   asistio: boolean;
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { salidaId, asistio } = await req.json();

    if (!salidaId || typeof asistio !== "boolean") {
      return NextResponse.json(
        { error: "Faltan datos requeridos (salidaId, asistio)" },
        { status: 400 }
      );
    }

    await connectDB();

    // Buscar membresía activa del usuario
    const membership = await ClubTrekkingMembership.findOne({
      userId: session.user.id,
      estado: { $in: ["activa", "pausada"] },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No tienes una membresía activa" },
        { status: 404 }
      );
    }

    // Confirmar asistencia (esto actualiza el contador de inasistencias)
    try {
      membership.confirmarAsistencia(salidaId, asistio);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    await membership.save();

    // Verificar si se aplicó penalización
    const penalizacionAplicada = membership.penalizacion.activa;
    const diasPenalizacion = membership.penalizacion.diasRestantes;

    // Track en Mixpanel
    trackClubTrekkingEvent("asistencia_confirmada", {
      userId: session.user.id,
      salidaId,
      asistio,
      penalizacionAplicada,
      diasPenalizacion: penalizacionAplicada ? diasPenalizacion : 0,
      inasistenciasConsecutivas: membership.penalizacion.inasistenciasConsecutivas,
    });

    return NextResponse.json({
      success: true,
      asistio,
      penalizacionAplicada,
      diasPenalizacion: penalizacionAplicada ? diasPenalizacion : 0,
      inasistenciasConsecutivas: membership.penalizacion.inasistenciasConsecutivas,
      mensaje: asistio
        ? "¡Gracias por confirmar tu asistencia!"
        : penalizacionAplicada
        ? `Has acumulado 2 inasistencias consecutivas. No podrás reservar salidas por ${diasPenalizacion} días.`
        : "Entendido. Recuerda que 2 inasistencias consecutivas resultan en una penalización de 3 días.",
    });
  } catch (error) {
    console.error("❌ Error al confirmar asistencia:", error);
    return NextResponse.json(
      { error: "Error al confirmar asistencia" },
      { status: 500 }
    );
  }
}
