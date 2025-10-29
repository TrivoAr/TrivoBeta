import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import FCMToken from "@/models/FCMToken";
import { getMessaging } from "@/libs/firebaseAdmin";

export async function POST(req: Request) {
  try {
    // ⚠️ Solo disponible en desarrollo
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Endpoint solo disponible en desarrollo" },
        { status: 403 }
      );
    }

    console.log("[Test Notification] Iniciando...");
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      console.log("[Test Notification] No hay sesión");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log("[Test Notification] Usuario:", session.user.id);

    // Get user's FCM token from database
    const userToken = await FCMToken.findOne({
      userId: session.user.id,
      isActive: true,
    });

    if (!userToken) {
      console.log("[Test Notification] No se encontró token FCM");
      return NextResponse.json(
        {
          error: "No FCM token found - activate notifications first",
        },
        { status: 400 }
      );
    }

    console.log("[Test Notification] Token encontrado:", userToken.token.substring(0, 20) + "...");

    // Send test notification using Firebase Admin
    console.log("[Test Notification] Inicializando Firebase Admin...");
    const messaging = getMessaging();
    console.log("[Test Notification] Messaging obtenido correctamente");

    const message = {
      notification: {
        title: "🧪 Notificación de Prueba",
        body: "¡Funciona! Las notificaciones están configuradas correctamente.",
      },
      data: {
        type: "test",
        url: "/notificaciones",
        timestamp: new Date().toISOString(),
      },
      webpush: {
        fcmOptions: {
          link: "/notificaciones",
        },
        notification: {
          icon: "/icons/icon-192x192.png",
          badge: "/icons/manifest-icon-192.maskable.png",
        },
      },
      token: userToken.token,
    };

    try {
      console.log("[Test Notification] Enviando mensaje...");
      const response = await messaging.send(message);

      console.log("[Test Notification] Respuesta de FCM:", response);

      // Update lastUsed
      await FCMToken.findByIdAndUpdate(userToken._id, {
        lastUsed: new Date(),
      });

      console.log("[Test Notification] Sent successfully:", response);

      return NextResponse.json({
        success: true,
        message: "Notificación de prueba enviada correctamente",
        messageId: response,
      });
    } catch (fcmError: any) {
      console.error("[Test Notification] FCM Error:", fcmError);

      // Check if token is invalid
      if (
        fcmError.code === "messaging/invalid-registration-token" ||
        fcmError.code === "messaging/registration-token-not-registered"
      ) {
        // Mark token as inactive
        await FCMToken.findByIdAndUpdate(userToken._id, {
          isActive: false,
        });

        return NextResponse.json(
          {
            error: "Token FCM inválido - por favor reactiva las notificaciones",
            tokenRemoved: true,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: `Error enviando notificación: ${fcmError.message}`,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[Test Notification] Error:", error);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
