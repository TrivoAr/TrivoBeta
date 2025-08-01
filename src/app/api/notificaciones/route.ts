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
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const notificaciones = await Notificacion.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .populate("fromUserId", "firstname lastname _id")
      .populate("salidaId", "nombre");

    const enriched = await Promise.all(
      notificaciones.map(async (n) => {
        const user = n.fromUserId;
        const salida = n.salidaId;

        let imagen = "";

        try {
          imagen = await getProfileImage("profile-image.jpg", user._id.toString());
        } catch (error) {
          console.warn("Error al obtener imagen, usando avatar fallback:", error);
          imagen = `https://ui-avatars.com/api/?name=${encodeURIComponent(
            `${user.firstname || "User"}`
          )}&background=random&color=fff&size=128`;
        }

        return {
          _id: n._id,
          mensaje: n.message || `${user.firstname} se unió a ${salida?.nombre || "una salida"}`,
          read: n.read,
          createdAt: n.createdAt,
          nombre: `${user.firstname} ${user.lastname}`,
          salidaNombre: salida?.nombre || null,
          imagen,
          fromUserId: user._id.toString(),
        };
      })
    );

    return NextResponse.json(enriched, { status: 200 });
  } catch (error) {
    console.error("❌ Error al obtener notificaciones:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
