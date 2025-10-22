// src/app/api/grupos/[id]/route.ts
import { NextResponse } from "next/server";
import Grupo from "@/models/grupo";
import Academia from "@/models/academia";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import { getProfileImage } from "@/app/api/profile/getProfileImage";
import UsuarioGrupo from "@/models/users_grupo";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const grupo = await Grupo.findById(params.id).populate("profesor_id");

    if (!grupo) {
      return NextResponse.json(
        { error: "Grupo no encontrado" },
        { status: 404 }
      );
    }

    // Obtener URL de la imagen del profesor
    let profesorImagenUrl =
      "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg"; // imagen por defecto

    if (grupo.profesor_id?._id) {
      try {
        profesorImagenUrl = await getProfileImage(
          "profile-image.jpg",
          grupo.profesor_id._id.toString()
        );
      } catch (error) {
        // Se queda la imagen por defecto si hay error
      }
    }

    // Convertir el documento a objeto plano
    const grupoObj = grupo.toObject();

    // Reemplazar el campo profesor_id para agregar la URL correcta de la imagen
    grupoObj.profesor_id = {
      ...grupoObj.profesor_id,
      imagen: profesorImagenUrl,
    };

    // Obtener los usuarios que pertenecen a este grupo
    const alumnos = await UsuarioGrupo.find({ grupo_id: params.id }).populate(
      "user_id"
    );

    return NextResponse.json({ grupo: grupoObj, alumnos }, { status: 200 });
  } catch (error) {

    return NextResponse.json(
      { error: "Error al obtener el grupo y sus alumnos" },
      { status: 500 }
    );
  }
}

// Eliminar un grupo por ID
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const grupo = await Grupo.findById(params.id);

    if (!grupo) {
      return NextResponse.json(
        { error: "Grupo no encontrado" },
        { status: 404 }
      );
    }

    // Validar permisos: dueño de la academia o profesor asignado
    const academia = await Academia.findById(grupo.academia_id);
    if (
      academia.dueño_id.toString() !== session.user.id &&
      grupo.profesor_id?.toString() !== session.user.id
    ) {
      return NextResponse.json(
        { error: "No tienes permisos para eliminar este grupo" },
        { status: 403 }
      );
    }

    await Grupo.findByIdAndDelete(params.id);
    return NextResponse.json(
      { message: "Grupo eliminado con éxito" },
      { status: 200 }
    );
  } catch (error) {

    return NextResponse.json(
      { error: "Error al eliminar el grupo" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await req.json();

    const grupo = await Grupo.findById(params.id);
    if (!grupo) {
      return NextResponse.json(
        { error: "Grupo no encontrado" },
        { status: 404 }
      );
    }

    // Validar permisos: dueño o profesor
    const academia = await Academia.findById(grupo.academia_id);
    if (
      academia.dueño_id.toString() !== session.user.id &&
      grupo.profesor_id?.toString() !== session.user.id
    ) {
      return NextResponse.json(
        { error: "No tienes permisos para editar este grupo" },
        { status: 403 }
      );
    }

    // Actualizar campos
    Object.assign(grupo, data);
    await grupo.save();

    return NextResponse.json(
      { message: "Grupo actualizado con éxito" },
      { status: 200 }
    );
  } catch (error) {

    return NextResponse.json(
      { error: "Error al actualizar grupo" },
      { status: 500 }
    );
  }
}
