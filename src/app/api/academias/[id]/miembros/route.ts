// src/app/api/academias/[id]/miembros/route.ts
import UsuarioAcademia from "@/models/users_academia";
import UsuarioGrupo from "@/models/users_grupo";
import Grupo from "@/models/grupo";
import { connectDB } from "@/libs/mongodb";
import { NextResponse } from "next/server";

// Obtener los miembros de la academia y sus grupos
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return NextResponse.json({ message: "ID no proporcionado" }, { status: 400 });
    }

    // Buscar los miembros de la academia
    const miembrosAcademia = await UsuarioAcademia.find({ academia_id: id, estado: "aceptado" })
      .populate("user_id") // Incluye información del usuario
      .lean();

    // Mapear IDs de los usuarios para buscar sus grupos
    const userIds = miembrosAcademia.map((miembro) => miembro.user_id._id);

    // Buscar los grupos relacionados con estos usuarios
    const grupos = await UsuarioGrupo.find({ user_id: { $in: userIds } })
      .populate("grupo_id")
      .lean();

    // Combinar datos de los miembros con los grupos
    const miembrosConGrupos = miembrosAcademia.map((miembro) => {
      const grupo = grupos.find((g) => String(g.user_id) === String(miembro.user_id._id));
      return {
        ...miembro,
        grupo: grupo ? grupo.grupo_id : null, // Incluye el grupo asignado si existe
      };
    });

    return NextResponse.json({ miembros: miembrosConGrupos }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener los miembros y sus grupos:", error);
    return NextResponse.json(
      { message: "Hubo un error al obtener los miembros y sus grupos", error },
      { status: 500 }
    );
  }
}

// Asignar un usuario a un grupo
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params; // ID de la academia
    const body = await req.json();
    const { user_id, grupo_id } = body; // Datos del cuerpo

    if (!user_id || !grupo_id) {
      return NextResponse.json(
        { message: "ID del usuario o del grupo no proporcionado" },
        { status: 400 }
      );
    }

    // Verificar que el grupo pertenece a la academia
    const grupo = await Grupo.findById(grupo_id);
    if (!grupo || grupo.academia_id.toString() !== id) {
      return NextResponse.json(
        { message: "El grupo no pertenece a esta academia" },
        { status: 400 }
      );
    }

    // Crear o actualizar la relación en UsuarioGrupo
    const usuarioGrupo = await UsuarioGrupo.findOneAndUpdate(
      { user_id }, // Busca la relación por usuario
      { grupo_id, fecha_ingreso: new Date() }, // Actualiza o crea la relación
      { upsert: true, new: true }
    );

    return NextResponse.json(
      { message: "Grupo asignado correctamente", usuarioGrupo },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al asignar grupo:", error);
    return NextResponse.json(
      { message: "Error al asignar grupo", error },
      { status: 500 }
    );
  }
}
