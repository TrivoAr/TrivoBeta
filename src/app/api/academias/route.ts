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

// Obtener las academias filtradas por el dueño del usuario
export async function GET(req: Request) {
  try {
    // Obtener la sesión del usuario
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: "No autenticado" },
        { status: 401 }
      );
    }

    // Filtrar academias según el dueño_id (session.user.id)
    const academias = await Academia.find({ dueño_id: session.user.id });

    return NextResponse.json(academias, { status: 200 });
  } catch (error) {
    console.error("Error al obtener academias:", error);
    return NextResponse.json({ error: "Error al obtener las academias" }, { status: 500 });
  }
}