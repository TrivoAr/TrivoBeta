// src/app/api/social/unirse/estado/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import MiembroSalida from "@/models/MiembroSalida";
import User from "@/models/user";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session) return new Response("No autorizado", { status: 401 });

  const { salidaId } = await req.json();
  const user = await User.findOne({ email: session.user?.email });
  if (!user) return new Response("Usuario no encontrado", { status: 404 });

  const miembro = await MiembroSalida.findOne({
    usuario_id: user._id,
    salida_id: salidaId,
  });

  return Response.json({ unido: !!miembro });
}
