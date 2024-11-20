import { connectDB } from "@/libs/mongodb";
import UsuarioAcademia from "@/models/users_academia";
import Academia from "@/models/academia";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { academia_id, user_id } = await req.json();

    if (!academia_id || !user_id) {
      return NextResponse.json({ message: "ID de academia y usuario son requeridos" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(academia_id) || !mongoose.Types.ObjectId.isValid(user_id)) {
      return NextResponse.json({ message: "IDs inválidos" }, { status: 400 });
    }

    const academiaObjectId = new mongoose.Types.ObjectId(academia_id);
    const userObjectId = new mongoose.Types.ObjectId(user_id);

    const academia = await Academia.findById(academiaObjectId);
    if (!academia) {
      return NextResponse.json({ message: "Academia no encontrada" }, { status: 404 });
    }

    const nuevaSolicitud = new UsuarioAcademia({
      user_id: userObjectId,
      academia_id: academiaObjectId,
      estado: "pendiente",
    });

    await nuevaSolicitud.save();

    return NextResponse.json({ message: "Solicitud creada exitosamente" }, { status: 201 });
  } catch (error) {
    console.error("Error al crear la solicitud:", error);
    return NextResponse.json({ message: `Error interno: ${error}` }, { status: 500 });
  }
}
