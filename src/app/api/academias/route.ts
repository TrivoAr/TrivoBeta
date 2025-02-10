import { connectDB } from "@/libs/mongodb";
import Academia from "@/models/academia";
import UsuarioAcademia from "@/models/users_academia"; // Importa el modelo de UsuarioAcademia
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../libs/authOptions";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function POST(request: Request) {
  try {
    // Conectar a la base de datos
    await connectDB();

    // Obtener la sesión del usuario autenticado
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: "No autenticado" },
        { status: 401 }
      );
    }

    // Extraer datos del request
    const {
      nombre_academia,
      pais,
      provincia,
      localidad,
      descripcion,
      tipo_disciplina,
      telefono,
      imagen,
    } = await request.json();

    // Crear la nueva academia
    const nuevaAcademia = new Academia({
      dueño_id: session.user.id, // El usuario autenticado será el dueño
      nombre_academia,
      pais,
      provincia,
      localidad,
      descripcion,
      tipo_disciplina,
      telefono,
      imagen,
    });

    // Guardar la academia en la base de datos
    const savedAcademia = await nuevaAcademia.save();

    // Agregar al usuario creador como miembro de la academia
    await UsuarioAcademia.create({
      user_id: session.user.id,
      academia_id: savedAcademia._id,
      estado: "aceptado", // El usuario es automáticamente aceptado como miembro
    });

    return NextResponse.json(
      {
        message: "Academia creada y usuario agregado como miembro",
        nombre_academia: savedAcademia.nombre_academia,
        pais: savedAcademia.pais,
        provincia: savedAcademia.provincia,
        localidad: savedAcademia.localidad,
        createdAt: savedAcademia.createdAt,
        updatedAt: savedAcademia.updatedAt,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }
    console.error("Error al crear la academia:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Obtener todas las academias o las academias de un usuario específico
export async function GET(request: Request) {
  try {
    await connectDB(); // Conectar a la base de datos

    // Obtener la sesión del usuario
    const session = await getServerSession(authOptions);

    // Verificar si se pasa un parámetro para filtrar por dueño
    const url = new URL(request.url);
    const filterByOwner = url.searchParams.get("owner") === "true"; // Si se pasa el parámetro "owner=true", obtenemos las academias del dueño

    let academias;
    if (filterByOwner && session) {
      // Filtrar academias según el dueño (session.user.id)
      academias = await Academia.find({ dueño_id: session.user.id });
    } else {
      // Obtener todas las academias si no hay filtro o si el usuario no está autenticado
      academias = await Academia.find();
    }

    return NextResponse.json(academias, { status: 200 });
  } catch (error) {
    console.error("Error al obtener academias:", error);
    return NextResponse.json({ message: "Error al obtener las academias" }, { status: 500 });
  }
}