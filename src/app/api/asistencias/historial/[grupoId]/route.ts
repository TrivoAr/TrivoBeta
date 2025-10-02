/**
 * GET /api/asistencias/historial/[grupoId]
 * Obtiene el historial de asistencias de un grupo por mes
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import Asistencia from "@/models/Asistencia";
import Grupo from "@/models/grupo";
import Academia from "@/models/academia";
import connectDB from "@/libs/mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { grupoId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mes = parseInt(
      searchParams.get("mes") || new Date().getMonth().toString()
    );
    const anio = parseInt(
      searchParams.get("anio") || new Date().getFullYear().toString()
    );
    const userId = searchParams.get("userId");

    await connectDB();

    // Verificar que el grupo existe
    const grupo = await Grupo.findById(params.grupoId).populate("academia_id");
    if (!grupo) {
      return NextResponse.json(
        { error: "Grupo no encontrado" },
        { status: 404 }
      );
    }

    const academiaId = grupo.academia_id._id || grupo.academia_id;
    const academia = await Academia.findById(academiaId);

    if (!academia) {
      return NextResponse.json(
        { error: "Academia no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el usuario tiene acceso (profesor o dueño)
    const esProfesor = grupo.profesor_id?.toString() === session.user.id;
    const esDuenio = academia.dueño_id.toString() === session.user.id;

    if (!esProfesor && !esDuenio) {
      return NextResponse.json(
        { error: "No tienes permiso para ver el historial de este grupo" },
        { status: 403 }
      );
    }

    // Calcular rango de fechas del mes
    const inicioMes = new Date(anio, mes, 1);
    const finMes = new Date(anio, mes + 1, 0, 23, 59, 59, 999);

    // Query base
    const query: any = {
      grupoId: params.grupoId,
      asistio: true,
      fecha: {
        $gte: inicioMes,
        $lte: finMes,
      },
    };

    // Filtrar por usuario si se especifica
    if (userId) {
      query.userId = userId;
    }

    // Obtener asistencias del mes
    const asistencias = await Asistencia.find(query)
      .populate("userId", "firstname lastname email imagen")
      .populate("suscripcionId", "estado trial")
      .sort({ fecha: -1 });

    // Estadísticas
    const totalAsistencias = asistencias.length;
    const asistenciasTrial = asistencias.filter((a: any) => a.esTrial).length;
    const asistenciasPagas = totalAsistencias - asistenciasTrial;

    return NextResponse.json({
      grupo: {
        _id: grupo._id,
        nombre: grupo.nombre_grupo,
        nivel: grupo.nivel,
      },
      mes: {
        numero: mes,
        anio: anio,
        nombre: inicioMes.toLocaleDateString("es-AR", {
          month: "long",
          year: "numeric",
        }),
      },
      asistencias,
      estadisticas: {
        total: totalAsistencias,
        trial: asistenciasTrial,
        pagas: asistenciasPagas,
      },
    });
  } catch (error: any) {
    console.error("Error en GET /api/asistencias/historial/[grupoId]:", error);
    console.error("Stack trace:", error.stack);
    return NextResponse.json(
      {
        error: error.message || "Error al obtener historial",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
