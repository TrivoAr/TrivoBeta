// src/app/api/academias/route.ts
import { connectDB } from "@/libs/mongodb";
import Academia from "@/models/academia";
import { getSession } from "next-auth/react";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function POST(request: Request) {
  try {
    // Conectar a la base de datos
    await connectDB();

    // Obtener la sesión del usuario
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { message: "No autenticado" },
        { status: 401 }
      );
    }

    // Asegurarse de que el usuario tenga permisos
    if (session.user.role !== "dueño") {
      return NextResponse.json(
        { message: "No tienes permisos para crear una academia" },
        { status: 403 }
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
      dueño_id: session.user.id,
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
