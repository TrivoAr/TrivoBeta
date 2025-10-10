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
import Suscripcion from "@/models/Suscripcion";
import { SUBSCRIPTION_CONFIG } from "@/config/subscription.config";
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

    console.log(`[ASISTENCIAS_API] Buscando asistencias para grupo ${params.grupoId} entre ${inicioDia.toISOString()} y ${finDia.toISOString()}`);

    const asistencias = await Asistencia.find({
      grupoId: params.grupoId,
      fecha: {
        $gte: inicioDia,
        $lte: finDia,
      },
    })
      .populate("userId", "firstname lastname imagen")
      .populate("suscripcionId", "estado trial");

    console.log(`[ASISTENCIAS_API] Asistencias encontradas: ${asistencias.length}`, asistencias.map(a => ({
      _id: a._id,
      userId: a.userId?._id,
      asistio: a.asistio,
      fecha: a.fecha,
      esTrial: a.esTrial
    })));

    // Obtener TODOS los miembros de la academia
    // Combinar sistema viejo (UsuarioAcademia) y nuevo (Suscripcion)
    let todosLosMiembros = [];

    // 1. Miembros del sistema viejo (tabla users_academia)
    const miembrosAcademia = await UsuarioAcademia.find({
      academia_id: academiaId,
      estado: "aceptado",
    }).populate({
      path: "user_id",
      select: "firstname lastname email imagen",
    });

    const miembrosViejos = miembrosAcademia
      .filter((m) => m.user_id)
      .map((m) => ({
        userId: m.user_id._id.toString(),
        nombre: `${m.user_id.firstname} ${m.user_id.lastname}`,
        email: m.user_id.email,
        imagen: m.user_id.imagen,
        fechaIngreso: m.createdAt || new Date(),
        origen: "viejo",
      }));

    // 2. Miembros del sistema nuevo (tabla suscripciones)
    // Incluir trial, activa Y trial_expirado (para poder marcar asistencia aunque expire)
    const suscripcionesActivas = await Suscripcion.find({
      academiaId: academiaId,
      estado: {
        $in: [
          SUBSCRIPTION_CONFIG.ESTADOS.TRIAL,
          SUBSCRIPTION_CONFIG.ESTADOS.ACTIVA,
          SUBSCRIPTION_CONFIG.ESTADOS.TRIAL_EXPIRADO, // ✅ INCLUIR TRIAL EXPIRADO
        ],
      },
    }).populate({
      path: "userId",
      select: "firstname lastname email imagen",
    });

    const miembrosNuevos = suscripcionesActivas
      .filter((s) => s.userId)
      .map((s) => ({
        userId: s.userId._id.toString(),
        nombre: `${s.userId.firstname} ${s.userId.lastname}`,
        email: s.userId.email,
        imagen: s.userId.imagen,
        fechaIngreso: s.createdAt || new Date(),
        origen: "nuevo",
        suscripcionId: s._id,
        estado: s.estado,
        trial: s.trial,
      }));

    // 3. Combinar ambos sistemas, evitando duplicados
    const usuariosUnicos = new Map();

    // Primero agregar miembros viejos
    miembrosViejos.forEach((m) => {
      usuariosUnicos.set(m.userId, m);
    });

    // Luego sobrescribir/agregar miembros nuevos (tienen prioridad)
    miembrosNuevos.forEach((m) => {
      usuariosUnicos.set(m.userId, m);
    });

    todosLosMiembros = Array.from(usuariosUnicos.values());

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
