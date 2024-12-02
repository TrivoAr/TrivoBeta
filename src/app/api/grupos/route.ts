import { NextResponse } from "next/server";
import Grupo from "@/models/grupo";
import Academia from "@/models/academia";
import { getServerSession } from "next-auth"; // Cambia esto si usas otra configuración de sesión
import { authOptions } from "../../../libs/authOptions"; // Ajusta la ruta si tienes configuración personalizada de autenticación

// Crear un nuevo grupo
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nuevoGrupo = await Grupo.create(body); // Crea el grupo con los datos recibidos
    return NextResponse.json(nuevoGrupo, { status: 201 });
  } catch (error) {
    console.error("Error al crear grupo:", error);
    return NextResponse.json({ error: "Error al crear el grupo" }, { status: 500 });
  }
}

// Obtener todos los grupos
// src/app/api/grupos/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const academiaId = searchParams.get('academiaId'); // Obtener el ID de la academia

  if (!academiaId) {
    return NextResponse.json({ error: "Academia ID no proporcionado" }, { status: 400 });
  }

  try {
    // Filtrar los grupos por el ID de la academia
    const grupos = await Grupo.find({ academia_id: academiaId });
    return NextResponse.json({ grupos }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener los grupos:", error);
    return NextResponse.json({ error: "Error al obtener los grupos" }, { status: 500 });
  }
}

// Editar un grupo
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions); // Obtén la sesión del usuario
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.pathname.split("/").pop(); // Extraer el ID del grupo de la URL
    const body = await req.json();

    const grupo = await Grupo.findById(id);
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

    // Actualizar el grupo
    const grupoActualizado = await Grupo.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json(grupoActualizado, { status: 200 });
  } catch (error) {
    console.error("Error al editar grupo:", error);
    return NextResponse.json({ error: "Error al editar el grupo" }, { status: 500 });
  }
}

// Eliminar un grupo
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions); // Obtén la sesión del usuario
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.pathname.split("/").pop(); // Extraer el ID del grupo de la URL

    const grupo = await Grupo.findById(id);
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

    // Eliminar el grupo
    await Grupo.findByIdAndDelete(id);
    return NextResponse.json({ message: "Grupo eliminado con éxito" }, { status: 200 });
  } catch (error) {
    console.error("Error al eliminar grupo:", error);
    return NextResponse.json({ error: "Error al eliminar el grupo" }, { status: 500 });
  }
}
