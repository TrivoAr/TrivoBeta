import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import MiembroSalida from "@/models/MiembroSalida";
import SalidaSocial from "@/models/salidaSocial";
import User from "@/models/user";
import Pago from "@/models/pagos";
import { notifyJoinedEvent } from "@/libs/notificationHelpers";

export async function POST(req: Request) {
  await connectDB();

  const session = await getServerSession(authOptions);
  if (!session) return new Response("No autorizado", { status: 401 });

  const { salidaId, pago_id } = await req.json();

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

  // Verificar el estado del pago para determinar el estado del miembro
  const pago = await Pago.findById(pago_id);
  const esClubDelTrekking = pago?.comprobanteUrl === "CLUB_DEL_TREKKING";

  const nuevoMiembro = new MiembroSalida({
    usuario_id: user._id,
    salida_id: salidaId,
    pago_id: pago_id,
    usaMembresiaClub: esClubDelTrekking,
  });

  await nuevoMiembro.save();

  // ✅ Notificar al creador en tiempo real (BD + Socket.IO)
  if (String(salida.creador_id) !== String(user._id)) {
    try {
      await notifyJoinedEvent(
        String(salida.creador_id),
        String(user._id),
        String(salida._id),
        `${user.firstname} ${user.lastname}`,
        salida.nombre
      );
    } catch (error) {
    }
  }

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
