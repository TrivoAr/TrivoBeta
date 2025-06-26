import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import MiembroSalida from "@/models/MiembroSalida";
import SalidaSocial from "@/models/salidaSocial";
import User from "@/models/user";

export async function POST(req: Request) {
  await connectDB();

  const session = await getServerSession(authOptions);
  if (!session) return new Response("No autorizado", { status: 401 });

  const { salidaId } = await req.json();
  const user = await User.findOne({ email: session.user?.email });
  if (!user) return new Response("Usuario no encontrado", { status: 404 });

  const salida = await SalidaSocial.findById(salidaId);
  if (!salida) return new Response("Salida no encontrada", { status: 404 });

  const yaEsMiembro = await MiembroSalida.findOne({
    usuario_id: user._id,
    salida_id: salidaId,
  });

  if (yaEsMiembro) {
    return new Response("Ya eres miembro de esta salida", { status: 400 });
  }

  const nuevoMiembro = new MiembroSalida({
    usuario_id: user._id,
    salida_id: salidaId,
  });

  await nuevoMiembro.save();

  return new Response(JSON.stringify(nuevoMiembro), { status: 200 });
}

export async function DELETE(req: Request) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session) return new Response("No autorizado", { status: 401 });

  // Leer salidaId desde query param
  const { searchParams } = new URL(req.url);
  const salidaId = searchParams.get("salidaId");
  if (!salidaId) return new Response("Falta salidaId", { status: 400 });

  const user = await User.findOne({ email: session.user?.email });
  if (!user) return new Response("Usuario no encontrado", { status: 404 });

  const eliminado = await MiembroSalida.findOneAndDelete({
    usuario_id: user._id,
    salida_id: salidaId,
  });

  if (!eliminado) {
    return new Response("No estabas unido a esta salida", { status: 400 });
  }

  return new Response("Saliste de la salida", { status: 200 });
}
