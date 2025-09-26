import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../libs/authOptions";
import { createNotification } from "@/libs/notificationHelpers";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { type = "test", message = "Esta es una notificación de prueba" } =
      await req.json();

    // Crear notificación usando el sistema existente (esto activará el push automáticamente)
    await createNotification({
      userId: session.user.id,
      fromUserId: session.user.id,
      type,
      message,
      actionUrl: "/notificaciones",
    });

    return NextResponse.json({
      success: true,
      message: "Notificación push enviada correctamente",
    });
  } catch (error) {
    console.error("Error enviando notificación de prueba:", error);
    return NextResponse.json(
      {
        error: "Error enviando notificación",
      },
      { status: 500 }
    );
  }
}
