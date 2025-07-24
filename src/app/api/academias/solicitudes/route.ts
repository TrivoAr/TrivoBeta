import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import UsuarioAcademia from "../../../../models/users_academia";
import Academia from "../../../../models/academia";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/authOptions";

export async function GET(req: Request) {
  try {
    // Conectar a la base de datos
    await connectDB();

    // Obtener la sesión del usuario autenticado
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Usuario no autenticado" }, { status: 401 });
    }

    const userId = session.user.id; // ID del usuario autenticado

    // Obtener las academias creadas por este usuario
    const academiasDelUsuario = await Academia.find({ dueño_id: userId });

    if (academiasDelUsuario.length === 0) {
      // Si el usuario no tiene academias, devolver una lista vacía
      return NextResponse.json([], { status: 200 });
    }

    // Obtener los IDs de las academias
    const academiaIds = academiasDelUsuario.map((academia) => academia._id);

    // Filtrar las solicitudes pendientes relacionadas con las academias del usuario
    const solicitudes = await UsuarioAcademia.find({
      academia_id: { $in: academiaIds },
      estado: "pendiente",
    }).populate("user_id academia_id"); // Popular los datos de usuario y academia

    return NextResponse.json(solicitudes, { status: 200 });
  } catch (error) {
    console.error("Error al obtener solicitudes:", error);
    return NextResponse.json(
      { message: "Hubo un error al obtener las solicitudes" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    // Conectar a la base de datos
    await connectDB();

    const body = await req.json();

    // Actualizar la solicitud por su ID
    const solicitud = await UsuarioAcademia.findByIdAndUpdate(
      body.solicitud_id,
      { estado: body.estado }, // Puede ser "aceptado" o "rechazado"
      { new: true } // Retornar el documento actualizado
    );

    if (!solicitud) {
      return NextResponse.json({ message: "Solicitud no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ message: "Solicitud actualizada exitosamente" }, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar solicitud:", error);
    return NextResponse.json(
      { message: "Hubo un error al actualizar la solicitud" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const { user_id, academia_id } = await req.json();

    // Verificar si ya existe una solicitud pendiente
    const solicitudExistente = await UsuarioAcademia.findOne({
      user_id,
      academia_id,
      estado: "pendiente",
    });

    if (solicitudExistente) {
      return NextResponse.json(
        { message: "Ya existe una solicitud pendiente" },
        { status: 409 } // ❗️Conflicto
      );
    }

    const nuevaSolicitud = new UsuarioAcademia({
      user_id,
      academia_id,
      estado: "pendiente",
    });

    await nuevaSolicitud.save();

    return NextResponse.json(
      { message: "Solicitud creada exitosamente" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear solicitud:", error);
    return NextResponse.json(
      { message: "Hubo un error al crear la solicitud" },
      { status: 500 }
    );
  }
}

