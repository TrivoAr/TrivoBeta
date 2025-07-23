// import { NextResponse } from "next/server";
// import { connectDB } from "@/libs/mongodb";
// import Academia from "@/models/academia";
// import Grupo from "@/models/grupo";

// export async function GET(req: Request, { params }: { params: { id: string } }) {
//   try {
//     await connectDB(); // Conecta a la base de datos
//     const { id } = params;

//     if (!id) {
//       return NextResponse.json({ message: "ID de academia no proporcionado" }, { status: 400 });
//     }

//     // Buscar la academia por ID
//     const academia = await Academia.findById(id).populate("dueño_id");
//     if (!academia) {
//       return NextResponse.json({ message: "Academia no encontrada" }, { status: 404 });
//     }

//     // Buscar los grupos relacionados con esta academia
//     const grupos = await Grupo.find({ academia_id: id });

//     // Devolver la academia y sus grupos en un solo objeto
//     return NextResponse.json({ academia, grupos }, { status: 200 });
//   } catch (error) {
//     console.error("Error al obtener la academia y sus grupos:", error);
//     return NextResponse.json(
//       { message: "Hubo un error al obtener los datos", error: error},
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import Academia from "@/models/academia";
import Grupo from "@/models/grupo";
import { getProfileImage } from "@/app/api/profile/getProfileImage";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    if (!id) {
      return NextResponse.json({ message: "ID de academia no proporcionado" }, { status: 400 });
    }

    // Buscar la academia con populate
    const academia = await Academia.findById(id).populate("dueño_id");

    if (!academia) {
      return NextResponse.json({ message: "Academia no encontrada" }, { status: 404 });
    }

    // Buscar los grupos
    const grupos = await Grupo.find({ academia_id: id });

    // Obtener imagen del dueño desde Firebase
    let imagenUrl;
    try {
      imagenUrl = await getProfileImage("profile-image.jpg", academia.dueño_id._id.toString());
    } catch (error) {
      imagenUrl = "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg";
    }

    // Reemplazar el dueño con un objeto personalizado
    const dueñoInfo = {
      _id: academia.dueño_id._id,
      firstname: academia.dueño_id.firstname,
      lastname: academia.dueño_id.lastname,
      telnumber: academia.dueño_id.telnumber,
      instagram: academia.dueño_id.instagram,
      imagen: imagenUrl,
    };

    // Crear copia de academia sin el campo mongoose completo
    const responseAcademia = {
      // _id: academia._id,
      // nombre_academia: academia.nombre_academia,
      // descripcion: academia.descripcion,
      // tipo_disciplina: academia.tipo_disciplina,
      // telefono: academia.telefono,
      // precio: academia.precio,
      // clase_gratis: academia.clase_gratis,
      // localidad: academia.localidad,
      ...academia.toObject(),
      dueño_id: dueñoInfo,
    };

    return NextResponse.json({ academia: responseAcademia, grupos }, { status: 200 });

  } catch (error) {
    console.error("Error al obtener la academia y sus grupos:", error);
    return NextResponse.json(
      { message: "Hubo un error al obtener los datos", error },
      { status: 500 }
    );
  }
}

