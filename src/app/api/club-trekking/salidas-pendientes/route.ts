import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import connectDB from "@/libs/mongodb";
import ClubTrekkingMembership from "@/models/ClubTrekkingMembership";
import SalidaSocial from "@/models/salidaSocial";

/**
 * GET /api/club-trekking/salidas-pendientes
 *
 * Obtiene las salidas que están pendientes de confirmación de asistencia
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    await connectDB();

    // Buscar membresía activa del usuario
    const membership = await ClubTrekkingMembership.findOne({
      userId: session.user.id,
      estado: { $in: ["activa", "pausada"] },
    });

    if (!membership) {
      return NextResponse.json({
        salidasPendientes: [],
        tienePenalizacion: false,
      });
    }

    // Obtener salidas pendientes de confirmación
    const salidasPendientes = membership.getSalidasPendientesConfirmacion();

    // Verificar si tiene penalización activa
    const tienePenalizacion = membership.tienePenalizacionActiva();

    if (salidasPendientes.length === 0) {
      return NextResponse.json({
        salidasPendientes: [],
        tienePenalizacion,
        diasPenalizacion: tienePenalizacion ? membership.penalizacion.diasRestantes : 0,
      });
    }

    // Obtener detalles de las salidas
    const salidasConDetalles = await Promise.all(
      salidasPendientes.map(async (salida: any) => {
        const salidaDetalle = await SalidaSocial.findById(salida.salidaId).select(
          "titulo fecha locationCoords locationName imagen"
        );

        return {
          _id: salida.salidaId,
          titulo: salidaDetalle?.titulo || "Salida sin título",
          fecha: salida.fecha,
          locationName: salidaDetalle?.locationName || "Ubicación no especificada",
          imagen: salidaDetalle?.imagen || null,
        };
      })
    );

    return NextResponse.json({
      salidasPendientes: salidasConDetalles,
      tienePenalizacion,
      diasPenalizacion: tienePenalizacion ? membership.penalizacion.diasRestantes : 0,
      inasistenciasConsecutivas: membership.penalizacion.inasistenciasConsecutivas,
    });
  } catch (error) {
    console.error("❌ Error al obtener salidas pendientes:", error);
    return NextResponse.json(
      { error: "Error al obtener salidas pendientes" },
      { status: 500 }
    );
  }
}
