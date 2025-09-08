import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import MiembroSalida from "@/models/MiembroSalida";
import User from "@/models/user";
import SalidaSocial from "@/models/salidaSocial";
import Notificacion from "@/models/notificacion";
import { getProfileImage } from "@/app/api/profile/getProfileImage";

export async function GET(req: NextRequest) {
  await connectDB();

  const session = await getServerSession(authOptions);
  if (!session) return new Response("No autorizado", { status: 401 });

  const salidaId = req.nextUrl.searchParams.get("salidaId");
  if (!salidaId) return new Response("Falta salidaId", { status: 400 });

  const miembros = await MiembroSalida.find({ salida_id: salidaId })
    .populate("usuario_id", "firstname lastname email telnumber dni")
    .populate("pago_id");

  const miembrosConImagen = await Promise.all(
    miembros.map(async (m) => {
      const usuario = m.usuario_id;
      const pago = m.pago_id;
      let imagenUrl;

      try {
        imagenUrl = await getProfileImage(
          "profile-image.jpg",
          usuario._id.toString()
        );
      } catch {
        imagenUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          usuario.firstname
        )}&length=1&background=random&color=fff&size=128`;
      }

      return {
        _id: m._id,
        usuarioId: usuario._id,
        nombre:
          `${usuario.firstname} ${usuario.lastname}`.trim() || usuario.email,
        email: usuario.email,
        telnumber: usuario.telnumber,
        imagen: imagenUrl,
        dni: usuario.dni || "",
        pago_id: pago
          ? {
              _id: pago._id,
              comprobanteUrl: pago.comprobanteUrl || "",
              estado: pago.estado || "",
              salidaId: pago.salidaId || "",
              userId: pago.userId || "",
            }
          : null,
      };
    })
  );

  return new Response(JSON.stringify(miembrosConImagen), { status: 200 });
}

export async function POST(req) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session) return new Response("No autorizado", { status: 401 });

  const { salida_id } = await req.json();
  const usuario_id = session.user.id;

  // Validar que no esté ya solicitado
  const yaEsMiembro = await MiembroSalida.findOne({ salida_id, usuario_id });
  if (yaEsMiembro) {
    return new Response("Ya tienes una solicitud para esta salida", {
      status: 400,
    });
  }

  // Crear solicitud pendiente
  const nuevoMiembro = await MiembroSalida.create({
    salida_id,
    usuario_id,
    rol: "miembro",
    estado: "pendiente", // 👈
  });

  // Notificar al organizador
  const salida = await SalidaSocial.findById(salida_id);
  if (!salida) return new Response("Salida no encontrada", { status: 404 });

  const creadorId = salida.creador_id || salida.usuario_id;

  if (String(creadorId) !== String(usuario_id)) {
    await Notificacion.create({
      userId: creadorId,
      fromUserId: usuario_id,
      type: "join_request",
      message: `${(session.user.firstname, session.user.lastname || "Alguien")} pidió unirse a tu salida.`,
    });
  }

  return new Response(JSON.stringify(nuevoMiembro), { status: 201 });
}
