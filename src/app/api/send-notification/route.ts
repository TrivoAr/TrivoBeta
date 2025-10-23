import { NextResponse } from "next/server";
import Subscription from "@/models/subscription";
import webPush from "web-push";
import { connectDB } from "@/libs/mongodb";

// Configuración de VAPID
if (
  !process.env.VAPID_EMAIL ||
  !process.env.VAPID_PUBLIC_KEY ||
  !process.env.VAPID_PRIVATE_KEY
) {
  throw new Error("Faltan claves VAPID en variables de entorno");
}

webPush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function POST(req: Request) {
  try {
    await connectDB();
    const { title, body, url } = await req.json();

    // Traer todas las suscripciones guardadas
    const subscriptions = await Subscription.find();

    const payload = JSON.stringify({
      title: title || "Nueva notificación",
      body: body || "Tienes novedades en Trivo 🚀",
      url: url || "/",
    });

    // Enviar en paralelo a todos
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(sub, payload);
      } catch (err: any) {
        // Si la suscripción expiró, eliminarla
        if (err.statusCode === 410 || err.statusCode === 404) {

          await Subscription.deleteOne({ endpoint: sub.endpoint });
        } else {

        }
      }
    });

    await Promise.all(sendPromises);

    return NextResponse.json(
      { message: "Notificaciones enviadas" },
      { status: 200 }
    );
  } catch (error) {

    return NextResponse.json(
      { error: "Error al enviar notificaciones" },
      { status: 500 }
    );
  }
}
