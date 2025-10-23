// app/api/notificaciones/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import Notificacion from "@/models/notificacion";
import SalidaSocial from "@/models/salidaSocial";
import { getProfileImage } from "@/app/api/profile/getProfileImage";

export async function GET() {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const notificaciones = await Notificacion.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .populate("fromUserId", "firstname lastname _id")
      .populate("salidaId", "nombre _id")
      .populate("academiaId", "nombre_academia _id")
      .populate("teamSocialId", "nombre _id");

    const enriched = await Promise.all(
      notificaciones.map(async (n) => {
        const user = n.fromUserId;
        const salida = n.salidaId;
        const academia = n.academiaId;
        const teamSocial = n.teamSocialId;

        let imagen = "";

        try {
          imagen = await getProfileImage(
            "profile-image.jpg",
            user._id.toString()
          );
        } catch (error) {

          imagen = `https://ui-avatars.com/api/?name=${encodeURIComponent(
            `${user.firstname || "User"}`
          )}&background=random&color=fff&size=128`;
        }

        // Generar actionUrl si no existe
        let actionUrl = n.actionUrl;
        if (!actionUrl) {
          switch (n.type) {
            case "miembro_aprobado":
            case "joined_event":
              actionUrl = salida?._id ? `/social/${salida._id}` : null;
              break;
            case "solicitud_academia":
            case "nueva_academia":
              actionUrl = academia?._id ? `/academias/${academia._id}` : null;
              break;
            case "nuevo_team":
            case "solicitud_team":
              actionUrl = teamSocial?._id
                ? `/team-social/${teamSocial._id}`
                : null;
              break;
            case "pago_aprobado":
              actionUrl = `/dashboard`;
              break;
            default:
              actionUrl = `/profile/${user._id}`;
              break;
          }
        }

        return {
          _id: n._id,
          type: n.type,
          message: n.message,
          mensaje:
            n.message ||
            `${user.firstname} se unió a ${salida?.nombre || "una salida"}`,
          read: n.read,
          createdAt: n.createdAt,
          nombre: `${user.firstname} ${user.lastname}`,
          imagen,
          fromUserId: user._id.toString(),
          // Datos de entidades relacionadas
          salidaId: salida?._id || null,
          salidaNombre: salida?.nombre || null,
          academiaId: academia?._id || null,
          academiaNombre: academia?.nombre_academia || null,
          teamSocialId: teamSocial?._id || null,
          teamSocialNombre: teamSocial?.nombre || null,
          // Campos de navegación
          actionUrl,
          actionType: n.actionType || "navigate",
          metadata: n.metadata || {},
        };
      })
    );

    return NextResponse.json(enriched, { status: 200 });
  } catch (error) {

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
