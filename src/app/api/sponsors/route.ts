import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import Sponsors from "@/models/sponsors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 🔹 GET: Obtener todos los sponsors
export async function GET() {
  try {
    await connectDB();

    const sponsors = await Sponsors.find({})
      .sort({ createdAt: -1 }) // Más recientes primero
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: sponsors,
        count: sponsors.length
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error obteniendo sponsors:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Error interno del servidor" 
      },
      { status: 500 }
    );
  }
}

// 🔹 POST: Crear un nuevo sponsor
export async function POST(req: Request) {
  try {
    await connectDB();

    const { name, imagen } = await req.json();

    if (!name) {
      return NextResponse.json(
        { 
          success: false,
          error: "El nombre es requerido" 
        },
        { status: 400 }
      );
    }

    // Verificar si ya existe un sponsor con ese nombre
    const existingSponsor = await Sponsors.findOne({ name });
    if (existingSponsor) {
      return NextResponse.json(
        { 
          success: false,
          error: "Ya existe un sponsor con ese nombre" 
        },
        { status: 409 }
      );
    }

    const sponsor = await Sponsors.create({
      name,
      imagen: imagen || null
    });

    return NextResponse.json(
      {
        success: true,
        data: sponsor,
        message: "Sponsor creado exitosamente"
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creando sponsor:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Error interno del servidor" 
      },
      { status: 500 }
    );
  }
}