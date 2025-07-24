import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import UsuarioAcademia from "@/models/users_academia";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const academiaId = searchParams.get("academia_id");
  const userId = searchParams.get("user_id");

  try {
    await connectDB();

    if (!academiaId || !userId) {
      return NextResponse.json(
        { message: "IDs de academia y usuario son requeridos" },
        { status: 400 }
      );
    }

    const solicitud = await UsuarioAcademia.findOne({
      academia_id: academiaId,
      user_id: userId,
      estado: "pendiente",
    });

    if (!solicitud) {
      return NextResponse.json(
        { hasActiveRequest: false },
        { status: 200 } // Cambiar a 200 si quieres que un "no encontrado" sea un resultado válido
      );
    }

    return NextResponse.json({ hasActiveRequest: true }, { status: 200 });
  } catch (error) {
    console.error("Error al verificar solicitud activa:", error);
    return NextResponse.json(
      { message: "Hubo un error al verificar la solicitud activa" },
      { status: 500 }
    );
  }
}
