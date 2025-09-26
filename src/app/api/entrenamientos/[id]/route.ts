import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import Entrenamiento from "@/models/entrenamiento";
import Academia from "@/models/academia";
import { ObjectId } from "mongodb";

// PATCH: Actualizar el estado de un entrenamiento
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();
    const { estado } = body;

    if (!estado || !["verde", "rojo", "gris"].includes(estado)) {
      return NextResponse.json(
        { error: "Estado inválido o faltante" },
        { status: 400 }
      );
    }

    const entrenamiento = await Entrenamiento.findById(id);

    if (!entrenamiento) {
      return NextResponse.json(
        { error: "Entrenamiento no encontrado" },
        { status: 404 }
      );
    }

    const grupo = await entrenamiento.populate("grupo_id");
    const academia = await Academia.findById(grupo?.academia_id);

    entrenamiento.estado = estado;
    await entrenamiento.save();

    return NextResponse.json(
      { message: "Estado actualizado correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al actualizar el estado del entrenamiento:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// GET: Obtener un entrenamiento específico por ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const entrenamiento = await Entrenamiento.findById(id);

    if (!entrenamiento) {
      return NextResponse.json(
        { error: "Entrenamiento no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(entrenamiento, { status: 200 });
  } catch (error) {
    console.error("Error al obtener el entrenamiento:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
