import { connectDB } from "@/libs/mongodb";
import UsuarioAcademia from "@/models/users_academia";
import Academia from "@/models/academia";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { academia_id, user_id, pago_id } = await req.json();

    // Validar si los datos requeridos están presentes
    if (!academia_id || !user_id) {
      return NextResponse.json(
        { message: "ID de academia y usuario son requeridos" },
        { status: 400 }
      );
    }

    // Validar si los IDs tienen un formato válido
    if (
      !mongoose.Types.ObjectId.isValid(academia_id) ||
      !mongoose.Types.ObjectId.isValid(user_id)
    ) {
      return NextResponse.json({ message: "IDs inválidos" }, { status: 400 });
    }

    const academiaObjectId = new mongoose.Types.ObjectId(academia_id);
    const userObjectId = new mongoose.Types.ObjectId(user_id);

    // Verificar si la academia existe
    const academia = await Academia.findById(academiaObjectId);
    if (!academia) {
      return NextResponse.json(
        { message: "Academia no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si ya existe una solicitud activa para este usuario y academia
    const solicitudExistente = await UsuarioAcademia.findOne({
      user_id: userObjectId,
      academia_id: academiaObjectId,
      estado: { $ne: "cancelado" }, // Excluir solicitudes canceladas
    });

    if (solicitudExistente) {
      return NextResponse.json(
        { message: "Ya tienes una solicitud activa para esta academia" },
        { status: 400 }
      );
    }

    // Crear una nueva solicitud si no existe una activa
    const nuevaSolicitud = new UsuarioAcademia({
      user_id: userObjectId,
      academia_id: academiaObjectId,
      estado: "pendiente",
      pago_id: pago_id ? new mongoose.Types.ObjectId(pago_id) : undefined,
    });

    await nuevaSolicitud.save();

    return NextResponse.json(
      { message: "Solicitud creada exitosamente" },
      { status: 201 }
    );
  } catch (error) {

    return NextResponse.json(
      { message: `Error interno: ${error}` },
      { status: 500 }
    );
  }
}
