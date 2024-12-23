import { NextResponse } from "next/server";
import Subscription from "@/models/subscription";
import { getServerSession } from "next-auth/next"; 
import { authOptions } from "../../../libs/authOptions"; 
import webPush from "web-push";

// Configura las claves VAPID para usar con web-push
webPush.setVapidDetails(
  process.env.VAPID_EMAIL!, 
  process.env.VAPID_PUBLIC_KEY!, 
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: Request) {
  try {
    // Obtener la sesión del usuario
    const session = await getServerSession(authOptions); // Usar getServerSession con las opciones de autenticación

    // Verificar si la sesión existe y si el user_id está presente
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "User ID is missing or not authenticated" }, { status: 400 });
    }

    // Obtener la suscripción desde el request
    const subscription = await req.json();

    // Añadir `user_id` a la suscripción
    const newSubscription = {
      ...subscription,
      user_id: session.user.id, // Usamos el user_id de la sesión
    };

    // Guardar la suscripción en la base de datos
    await Subscription.create(newSubscription);

    // Enviar una notificación push a través de Web Push
    const payload = JSON.stringify({
      title: "Nuevo Entrenamiento Asignado",
      message: "Te asignamos un entrenamiento.",
    });

    // Enviar la notificación push
    await webPush.sendNotification(subscription, payload);

    return NextResponse.json({ message: "Suscripción guardada y notificación enviada correctamente" }, { status: 200 });
  } catch (error) {
    console.error("Error al guardar la suscripción o enviar la notificación:", error);
    return NextResponse.json({ error: "Error al guardar la suscripción o enviar la notificación" }, { status: 500 });
  }
}
