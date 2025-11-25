import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import MiembroSalida from "@/models/MiembroSalida";
import SalidaSocial from "@/models/salidaSocial";
import User from "@/models/user";
import { notifyPaymentPending } from "@/libs/notificationHelpers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await params in Next.js 15+
  const resolvedParams = await params;

  await connectDB();

  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });

  const { comprobanteUrl, pagoId } = await req.json();
  const salidaId = resolvedParams.id;

  const user = await User.findOne({ email: session.user?.email });
  if (!user)
    return NextResponse.json(
      { message: "Usuario no encontrado" },
      { status: 404 }
    );

  const salida = await SalidaSocial.findById(salidaId);
  if (!salida)
    return NextResponse.json(
      { message: "Evento no encontrado" },
      { status: 404 }
    );

  const yaRegistrado = await MiembroSalida.findOne({
    usuario_id: user._id,
    salida_id: salidaId,
  });
  if (yaRegistrado)
    return NextResponse.json(
      { message: "Ya estás registrado en este evento" },
      { status: 400 }
    );

  const miembro = await MiembroSalida.create({
    usuario_id: user._id,
    salida_id: salidaId,
    estado: "pendiente",
    pago_id: pagoId,
    fecha_union: new Date(),
  });

  // Notificar al creador del evento sobre el pago pendiente
  try {
    const userName = `${user.firstname || ""} ${user.lastname || ""}`.trim() || user.email;
    await notifyPaymentPending(
      salida.creador_id.toString(),
      user._id.toString(),
      salidaId,
      userName,
      salida.nombre
    );
  } catch (notificationError) {
    console.error("[Pago] Error enviando notificación:", notificationError);
    // No fallar la operación principal por error de notificación
  }

  return NextResponse.json(miembro, { status: 200 });
}
