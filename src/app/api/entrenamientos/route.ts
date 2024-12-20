// src/app/api/entrenamientos/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import Entrenamiento from "@/models/entrenamiento";
import Grupo from "@/models/grupo";
import Academia from "@/models/academia";
import Subscription from "@/models/subscription";
import webPush from "web-push";

webPush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { alumno_id, grupo_id, fecha, descripcion } = body;

    const grupo = await Grupo.findById(grupo_id);
    const academia = await Academia.findById(grupo?.academia_id);

    if (!academia) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 404 });
    }

    if (
      academia.dueño_id.toString() !== session.user.id &&
      grupo.profesor_id?.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: "No tienes permisos para asignar entrenamientos" }, { status: 403 });
    }

    // Crear el nuevo entrenamiento
    const entrenamiento = new Entrenamiento({
      alumno_id,
      grupo_id,
      fecha,
      descripcion,
    });

    await entrenamiento.save();

    // Obtener la suscripción del alumno
    const subscription = await Subscription.findOne({ user_id: alumno_id });

    if (subscription) {
      // Enviar la notificación
      const payload = JSON.stringify({
        title: "Nuevo entrenamiento asignado",
        message: `Se te ha asignado un entrenamiento para el día ${fecha}.`,
      });

      await webPush.sendNotification(subscription, payload);
    }

    return NextResponse.json(entrenamiento, { status: 201 });
  } catch (error) {
    console.error("Error al asignar entrenamiento:", error);
    return NextResponse.json({ error: "Hubo un problema al asignar el entrenamiento" }, { status: 500 });
  }
}
