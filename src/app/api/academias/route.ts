// src/app/api/academias/route.ts
import { connectDB } from "@/libs/mongodb";
import Academia from "@/models/academia";
import { getServerSession } from "next-auth/next"; // Usamos getServerSession para NextAuth
import { authOptions } from "../../../libs/authOptions"; // Importa las opciones de autenticación
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function POST(request: Request) {
  try {
    // Conectar a la base de datos
    await connectDB();

    // Obtener la sesión del usuario
    const session = await getServerSession(authOptions); // Incluye las opciones de autenticación
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

    // Crear una nueva instancia de Academia
    const nuevaAcademia = new Academia({
      dueño_id: session.user.id, // ID del usuario autenticado
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

    return NextResponse.json(
      {
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
    return NextResponse.error();
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