import { NextResponse } from "next/server";
import Grupo from "../../../models/grupo"; // Ajusta la ruta según la ubicación de tu modelo

// Crear un nuevo grupo
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nuevoGrupo = await Grupo.create(body); // Crea el grupo con los datos recibidos
    return NextResponse.json(nuevoGrupo, { status: 201 });
  } catch (error) {
    console.error("Error al crear grupo:", error);
    return NextResponse.json({ error: "Error al crear el grupo" }, { status: 500 });
  }
}

// Obtener todos los grupos
export async function GET() {
  try {
    const grupos = await Grupo.find().populate("academia_id"); // Obtiene todos los grupos con información de la academia
    return NextResponse.json(grupos, { status: 200 });
  } catch (error) {
    console.error("Error al obtener grupos:", error);
    return NextResponse.json({ error: "Error al obtener los grupos" }, { status: 500 });
  }
}
