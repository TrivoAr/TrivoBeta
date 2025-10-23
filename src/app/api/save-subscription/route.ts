import { NextResponse } from "next/server";
import Subscription from "@/models/subscription";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../libs/authOptions";
import webPush from "web-push";
import { connectDB } from "@/libs/mongodb";

// Configura las claves VAPID para usar con web-push
webPush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: Request) {
  try {
    // Conectar a la base de datos
    await connectDB();

    // Obtener la sesión del usuario
    const session = await getServerSession(authOptions); // Usar getServerSession con las opciones de autenticación

    // Verificar si la sesión existe y si el user_id está presente
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "User ID is missing or not authenticated" },
        { status: 400 }
      );
    }

    // Obtener la suscripción desde el request
    const subscription = await req.json();

    // Añadir `user_id` a la suscripción
    const newSubscription = {
      ...subscription,
      user_id: session.user.id, // Usamos el user_id de la sesión
    };

    // Verificar si ya existe una suscripción para este usuario y endpoint
    const existingSubscription = await Subscription.findOne({
      user_id: session.user.id,
      endpoint: subscription.endpoint,
    });

    if (!existingSubscription) {
      // Guardar la suscripción en la base de datos
      await Subscription.create(newSubscription);

    } else {

    }

    // Enviar una notificación push de bienvenida
    const payload = JSON.stringify({
      title: "¡Notificaciones activadas!",
      body: "Ahora recibirás notificaciones de Trivo en tu dispositivo.",
    });

    // Enviar la notificación push de confirmación
    await webPush.sendNotification(subscription, payload);

    return NextResponse.json(
      {
        message: "Suscripción guardada y notificación de confirmación enviada",
      },
      { status: 200 }
    );
  } catch (error) {

    return NextResponse.json(
      { error: "Error al guardar la suscripción o enviar la notificación" },
      { status: 500 }
    );
  }
}
