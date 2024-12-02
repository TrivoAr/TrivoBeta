// src/app/api/grupos/[id]/route.ts
import { NextResponse } from "next/server";
import Grupo from "@/models/grupo";
import Academia from "@/models/academia";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import UsuarioGrupo from "@/models/users_grupo";

// Obtener un grupo por ID
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    // Conecta a la base de datos
    await connectDB();

    // Buscar el grupo por ID
    const grupo = await Grupo.findById(params.id);

    if (!grupo) {
      return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 });
    }

    // Obtener los usuarios que pertenecen a este grupo
    const alumnos = await UsuarioGrupo.find({ grupo_id: params.id }).populate("user_id");

    return NextResponse.json({ grupo, alumnos }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener el grupo y sus alumnos:", error);
    return NextResponse.json(
      { error: "Error al obtener el grupo y sus alumnos" },
      { status: 500 }
    );
  }
}
// Actualizar un grupo por ID
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const grupo = await Grupo.findById(params.id);

    if (!grupo) {
      return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 });
    }

    // Validar permisos: dueño de la academia o profesor asignado
    const academia = await Academia.findById(grupo.academia_id);
    if (
      academia.dueño_id.toString() !== session.user.id &&
      grupo.profesor_id?.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: "No tienes permisos para editar este grupo" }, { status: 403 });
    }

    const grupoActualizado = await Grupo.findByIdAndUpdate(params.id, body, { new: true });
    return NextResponse.json(grupoActualizado, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar el grupo:", error);
    return NextResponse.json({ error: "Error al actualizar el grupo" }, { status: 500 });
  }
}

// Eliminar un grupo por ID
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const grupo = await Grupo.findById(params.id);

    if (!grupo) {
      return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 });
    }

    // Validar permisos: dueño de la academia o profesor asignado
    const academia = await Academia.findById(grupo.academia_id);
    if (
      academia.dueño_id.toString() !== session.user.id &&
      grupo.profesor_id?.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: "No tienes permisos para eliminar este grupo" }, { status: 403 });
    }

    await Grupo.findByIdAndDelete(params.id);
    return NextResponse.json({ message: "Grupo eliminado con éxito" }, { status: 200 });
  } catch (error) {
    console.error("Error al eliminar el grupo:", error);
    return NextResponse.json({ error: "Error al eliminar el grupo" }, { status: 500 });
  }
}
