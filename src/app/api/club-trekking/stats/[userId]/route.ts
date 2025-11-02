import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/libs/mongodb";
import ClubTrekkingMembership from "@/models/ClubTrekkingMembership";
import SalidaSocial from "@/models/salidaSocial";
import User from "@/models/user";
import { authOptions } from "@/libs/authOptions";
import { clubTrekkingHelpers } from "@/config/clubTrekking.config";

/**
 * GET /api/club-trekking/stats/[userId]
 * Obtener estadísticas del usuario en el Club del Trekking
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await connectDB();

    const { userId } = params;

    const user = await User.findOne({ email: session.user.email });
    if (user._id.toString() !== userId && user.rol !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const membership = await ClubTrekkingMembership.findOne({
      userId,
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!membership) {
      return NextResponse.json(
        { error: "No se encontró membresía" },
        { status: 404 }
      );
    }

    // Estadísticas generales
    const totalSalidas = membership.historialSalidas.length;
    const totalSalidasConCheckIn = membership.historialSalidas.filter(
      (h: any) => h.checkInRealizado
    ).length;

    // Salidas este mes
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const salidasEsteMes = membership.historialSalidas.filter((h: any) => {
      const fecha = new Date(h.fecha);
      return fecha >= inicioMes;
    }).length;

    // Calcular días consecutivos (racha)
    let diasConsecutivos = 0;
    const fechasOrdenadas = membership.historialSalidas
      .map((h: any) => new Date(h.fecha))
      .sort((a: Date, b: Date) => b.getTime() - a.getTime());

    if (fechasOrdenadas.length > 0) {
      let ultimaFecha = new Date();
      ultimaFecha.setHours(0, 0, 0, 0);

      for (const fecha of fechasOrdenadas) {
        const fechaSalida = new Date(fecha);
        fechaSalida.setHours(0, 0, 0, 0);

        const diferenciaMs = ultimaFecha.getTime() - fechaSalida.getTime();
        const diferenciaDias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));

        if (diferenciaDias <= 7) {
          // Dentro de la misma semana
          diasConsecutivos++;
          ultimaFecha = fechaSalida;
        } else {
          break;
        }
      }
    }

    // Lugares visitados (únicos)
    const salidasRealizadas = await SalidaSocial.find({
      _id: {
        $in: membership.historialSalidas.map((h: any) => h.salidaId),
      },
    }).lean();

    const lugaresUnicos = new Set(
      salidasRealizadas.map((s) => s.localidad || s.ubicacion)
    );

    // Calcular km recorridos (aproximado, si hay datos de Strava)
    // Por ahora dejar en 0, se puede integrar con Strava después
    const kmRecorridos = 0;

    // Tipo de badge actual
    const tipoBadge = clubTrekkingHelpers.obtenerTipoBadge(totalSalidas);

    const stats = {
      totalSalidas,
      totalSalidasConCheckIn,
      salidasEsteMes,
      diasConsecutivos,
      lugaresVisitados: lugaresUnicos.size,
      kmRecorridos,
      badge: {
        tipo: tipoBadge,
        color:
          tipoBadge === "oro"
            ? "#FFD700"
            : tipoBadge === "plata"
            ? "#C0C0C0"
            : "#CD7F32",
      },
      membership: {
        estado: membership.estado,
        fechaInicio: membership.fechaInicio,
        salidasRestantes:
          membership.usoMensual.limiteSemanal -
          membership.usoMensual.salidasRealizadas,
      },
    };

    return NextResponse.json({ stats }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return NextResponse.json(
      { error: "Error al obtener las estadísticas" },
      { status: 500 }
    );
  }
}
