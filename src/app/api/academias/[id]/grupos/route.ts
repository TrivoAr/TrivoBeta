import { NextResponse } from "next/server";
import Grupo from "@/models/grupo";
import { connectDB } from "@/libs/mongodb";
import UsuarioGrupo from "@/models/users_grupo";
import { getServerSession } from "next-auth/next"; // Obtener la sesión
import { authOptions } from "@/libs/authOptions";
import Academia from "@/models/academia";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  try {
    const { id } = await params;
    const grupos = await Grupo.find({ academia_id: id });
    return NextResponse.json(grupos);
  } catch (error) {

    return NextResponse.json(
      { error: "Error al obtener grupos" },
      { status: 500 }
    );
  }
}
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Conectar a la base de datos
    await connectDB();

    const { id } = await params; // ID del miembro
    const body = await req.json();
    const { grupo_id } = body;

    if (!id || !grupo_id) {
      return NextResponse.json(
        { message: "ID del miembro o ID del grupo no proporcionado" },
        { status: 400 }
      );
    }

    // Obtener la sesión del usuario autenticado
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    const userId = session.user.id; // ID del usuario autenticado

    // Verificar si el usuario es dueño de la academia
    const grupo = await Grupo.findById(grupo_id);
    if (!grupo) {
      return NextResponse.json(
        { message: "Grupo no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el usuario sea dueño de la academia asociada al grupo
    const academiaId = grupo.academia_id.toString();

    // Obtener la academia y comprobar si el usuario es el dueño
    const academia = await Academia.findById(academiaId);
    if (!academia) {
      return NextResponse.json(
        { message: "Academia no encontrada" },
        { status: 404 }
      );
    }

    if (academia.dueño_id.toString() !== userId) {
      return NextResponse.json(
        { message: "No tienes permisos para asignar grupos en esta academia" },
        { status: 403 }
      );
    }

    // Actualizar o crear la relación en UsuarioGrupo
    const usuarioGrupo = await UsuarioGrupo.findOneAndUpdate(
      { user_id: id }, // Busca la relación por usuario
      { grupo_id, fecha_ingreso: new Date() }, // Actualiza el grupo y fecha de ingreso
      { upsert: true, new: true } // Crea la relación si no existe
    );

    return NextResponse.json(
      { message: "Grupo asignado correctamente", usuarioGrupo },
      { status: 200 }
    );
  } catch (error) {

    return NextResponse.json(
      { message: "Error al asignar grupo", error },
      { status: 500 }
    );
  }
}
