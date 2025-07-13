import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import MiembroSalida from "@/models/MiembroSalida";
import User from "@/models/user";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  await connectDB();

  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

  const { salidaId } = await req.json();

  const user = await User.findOne({ email: session.user?.email });
  if (!user) return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });

  const miembroSalidas = await MiembroSalida.find({ usuario_id: user._id })
    .populate('salida_id');

  const salidas = miembroSalidas.map((miembro) => ({
    salida: miembro.salida_id,  // contiene el objeto de la salida
    rol: miembro.rol,
    fecha_union: miembro.fecha_union,
  }));

  const miembro = await MiembroSalida.findOne({
    usuario_id: user._id,
    salida_id: salidaId,
  });

  return NextResponse.json({ unido: !!miembro });
}

export async function GET() {
  await connectDB();

  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

  try {
    // Traemos TODAS las salidas a las que está unido el user
    const user = await User.findOne({ email: session.user?.email });
    if (!user) return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });

    const miembros = await MiembroSalida.find({ usuario_id: user._id }).populate("salida_id");

    const salidas = miembros
      .map((miembro) => miembro.salida_id)
      .filter(Boolean); // filtra null

    return NextResponse.json({ salidas });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error al obtener salidas" }, { status: 500 });
  }
}