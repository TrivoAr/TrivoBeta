import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import User from "@/models/user";

// Obtener todos los usuarios con rol "profe"
export async function GET(req: Request) {
  try {
    await connectDB();

    // Buscar todos los usuarios cuyo rol sea 'profe'
    const profesores = await User.find({ rol: "profe" });

    if (!profesores || profesores.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron profesores" },
        { status: 404 }
      );
    }

    return NextResponse.json(profesores, { status: 200 });
  } catch (error) {

    return NextResponse.json(
      { error: "Error al obtener profesores" },
      { status: 500 }
    );
  }
}
