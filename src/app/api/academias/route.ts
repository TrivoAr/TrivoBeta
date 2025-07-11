import { connectDB } from "@/libs/mongodb";
import Academia from "@/models/academia";
import UsuarioAcademia from "@/models/users_academia"; // Importa el modelo de UsuarioAcademia
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../libs/authOptions";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function POST(request: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    const academiaExistente = await Academia.findOne({ dueño_id: session.user.id });
    if (academiaExistente) {
      return NextResponse.json(
        { message: "Ya tienes una academia registrada. No puedes crear más." },
        { status: 400 }
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

    const savedAcademia = await nuevaAcademia.save();

    // Agregar al usuario creador como miembro de la academia
    await UsuarioAcademia.create({
      user_id: session.user.id,
      academia_id: savedAcademia._id,
      estado: "aceptado",
    });

    return NextResponse.json(
      {
        message: "Academia creada y usuario agregado como miembro",
        _id: savedAcademia._id,
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
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("Error al crear la academia:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}


// Obtener todas las academias o las academias de un usuario específico
export async function GET(request: Request) {
  try {
    await connectDB(); 

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    const url = new URL(request.url);
    const filterByOwner = url.searchParams.get("owner") === "true";
    const userId = url.searchParams.get("userId");

    let academias = [];

    if (filterByOwner) {

      academias = await Academia.find({ dueño_id: session.user.id });
    } else if (userId) {
      // Buscar academias donde el usuario sea miembro
      const userAcademias = await UsuarioAcademia.find({ user_id: userId }).populate("academia_id");
      academias = userAcademias.map((ua) => ua.academia_id); // Extrae la info de la academia
    } else {
      // Obtener todas las academias
      academias = await Academia.find();
    }

    return NextResponse.json(academias, { status: 200 });
  } catch (error) {
    console.error("Error al obtener academias:", error);
    return NextResponse.json({ message: "Error al obtener las academias" }, { status: 500 });
  }
}