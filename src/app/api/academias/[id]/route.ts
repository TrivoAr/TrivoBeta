import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import Academia from "@/models/academia";
import Grupo from "@/models/grupo";
import { getProfileImage } from "@/app/api/profile/getProfileImage";
import { getAcademyImage } from "@/app/api/academias/getAcademyImage";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { message: "ID de academia no proporcionado" },
        { status: 400 }
      );
    }

    // Buscar la academia con populate
    const academia = await Academia.findById(id).populate("dueño_id");

    if (!academia) {
      return NextResponse.json(
        { message: "Academia no encontrada" },
        { status: 404 }
      );
    }

    // Buscar los grupos
    const grupos = await Grupo.find({ academia_id: id });

    // Obtener imagen del dueño desde Firebase
    let imagenDueño;
    try {
      imagenDueño = await getProfileImage(
        "profile-image.jpg",
        academia.dueño_id._id.toString()
      );
    } catch (error) {
      imagenDueño =
        "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg";
    }

    // Obtener imagen de la academia desde Firebase
    let imagenUrl;
    try {
      imagenUrl = await getAcademyImage("foto_academia.jpg", id);
    } catch (error) {
      // Fallback a profile-image.jpg si foto_academia.jpg no existe
      try {
        imagenUrl = await getAcademyImage("profile-image.jpg", id);
      } catch (fallbackError) {
        // Placeholder si no hay imagen
        imagenUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(academia.nombre_academia)}&background=C95100&color=fff&size=310x115`;
      }
    }

    // Reemplazar el dueño con un objeto personalizado
    const dueñoInfo = {
      _id: academia.dueño_id._id,
      firstname: academia.dueño_id.firstname,
      lastname: academia.dueño_id.lastname,
      telnumber: academia.dueño_id.telnumber,
      instagram: academia.dueño_id.instagram,
      imagen: imagenDueño,
    };

    const responseAcademia = {
      ...academia.toObject(),
      dueño_id: dueñoInfo,
      imagenUrl, // Agregar la imagen de la academia
    };

    return NextResponse.json(
      { academia: responseAcademia, grupos },
      { status: 200 }
    );
  } catch (error) {

    return NextResponse.json(
      { message: "Hubo un error al obtener los datos", error },
      { status: 500 }
    );
  }
}
