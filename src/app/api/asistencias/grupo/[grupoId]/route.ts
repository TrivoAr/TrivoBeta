/**
 * GET /api/asistencias/grupo/[grupoId]
 * Obtiene las asistencias de un grupo para una fecha específica (default: hoy)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import Asistencia from "@/models/Asistencia";
import Grupo from "@/models/grupo";
import Academia from "@/models/academia";
import UsuarioAcademia from "@/models/users_academia";
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
    const fechaParam = searchParams.get("fecha");
    const fecha = fechaParam ? new Date(fechaParam) : new Date();

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
        { error: "No tienes permiso para ver las asistencias de este grupo" },
        { status: 403 }
      );
    }

    // Obtener asistencias del día
    const inicioDia = new Date(fecha);
    inicioDia.setHours(0, 0, 0, 0);
    const finDia = new Date(fecha);
    finDia.setHours(23, 59, 59, 999);

    const asistencias = await Asistencia.find({
      grupoId: params.grupoId,
      fecha: {
        $gte: inicioDia,
        $lte: finDia,
      },
    })
      .populate("userId", "firstname lastname imagen")
      .populate("suscripcionId", "estado trial");

    // Obtener TODOS los miembros de la academia (estado aceptado)
    let todosLosMiembros = [];
    const miembrosAcademia = await UsuarioAcademia.find({
      academia_id: academiaId,
      estado: "aceptado", // Solo miembros aceptados
    }).populate({
      path: "user_id",
      select: "firstname lastname email imagen",
    });

    todosLosMiembros = miembrosAcademia
      .filter((m) => m.user_id) // Filtrar usuarios válidos
      .map((m) => ({
        userId: m.user_id._id,
        nombre: `${m.user_id.firstname} ${m.user_id.lastname}`,
        email: m.user_id.email,
        imagen: m.user_id.imagen,
        fechaIngreso: m.createdAt || new Date(),
      }));

    return NextResponse.json({
      grupo: {
        _id: grupo._id,
        nombre: grupo.nombre_grupo,
        nivel: grupo.nivel,
        horario: grupo.horario,
        dias: grupo.dias,
      },
      fecha,
      asistencias,
      miembros: todosLosMiembros,
      permisos: {
        puedeRegistrarAsistencias: esProfesor || esDuenio,
      },
    });
  } catch (error: any) {
    console.error("Error en GET /api/asistencias/grupo/[grupoId]:", error);
    console.error("Stack trace:", error.stack);
    return NextResponse.json(
      {
        error: error.message || "Error al obtener asistencias",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
