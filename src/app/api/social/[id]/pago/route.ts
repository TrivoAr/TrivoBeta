import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import MiembroSalida from "@/models/MiembroSalida";
import SalidaSocial from "@/models/salidaSocial";
import User from "@/models/user";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();

  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

  const { comprobanteUrl, pagoId } = await req.json();
  const salidaId = params.id;

  const user = await User.findOne({ email: session.user?.email });
  if (!user) return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });

  const salida = await SalidaSocial.findById(salidaId);
  if (!salida) return NextResponse.json({ message: "Evento no encontrado" }, { status: 404 });

  const yaRegistrado = await MiembroSalida.findOne({
    usuario_id: user._id,
    salida_id: salidaId,
  });
  if (yaRegistrado) return NextResponse.json({ message: "Ya estás registrado en este evento" }, { status: 400 });

  const miembro = await MiembroSalida.create({
    usuario_id: user._id,
    salida_id: salidaId,
    estado: "pendiente",
    pago_id: pagoId,
    fecha_union: new Date(),
  });

  return NextResponse.json(miembro, { status: 200 });
}
