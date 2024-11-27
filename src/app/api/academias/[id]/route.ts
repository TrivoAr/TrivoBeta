import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import Academia from "@/models/academia";
import Grupo from "@/models/grupo";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB(); // Conecta a la base de datos
    const { id } = params;

    if (!id) {
      return NextResponse.json({ message: "ID de academia no proporcionado" }, { status: 400 });
    }

    // Buscar la academia por ID
    const academia = await Academia.findById(id);
    if (!academia) {
      return NextResponse.json({ message: "Academia no encontrada" }, { status: 404 });
    }

    // Buscar los grupos relacionados con esta academia
    const grupos = await Grupo.find({ academia_id: id });

    // Devolver la academia y sus grupos en un solo objeto
    return NextResponse.json({ academia, grupos }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener la academia y sus grupos:", error);
    return NextResponse.json(
      { message: "Hubo un error al obtener los datos", error: error},
      { status: 500 }
    );
  }
}
