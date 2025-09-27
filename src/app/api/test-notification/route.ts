import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, message } = body;

    if (!userId || !message) {
      return NextResponse.json(
        { error: "userId y message son requeridos" },
        { status: 400 }
      );
    }

    // Acceder al servidor Socket.IO global
    const socketServer = (global as any).socketServer;

    if (!socketServer || !socketServer.emitToUser) {
      console.error("[TEST_API] Socket.IO server no disponible");
      return NextResponse.json(
        { error: "Socket.IO server no disponible" },
        { status: 503 }
      );
    }

    // Crear una notificación de prueba
    const testNotification = {
      _id: `test-${Date.now()}`,
      userId: userId,
      fromUserId: {
        _id: "system",
        firstname: "Sistema",
        lastname: "Prueba"
      },
      type: "test",
      message: message,
      read: false,
      createdAt: new Date().toISOString(),
      data: {
        test: true,
        timestamp: Date.now()
      }
    };

    // Emitir notificación en tiempo real al usuario específico
    const success = await socketServer.emitToUser(userId, "notification:new", testNotification);

    console.log(`[TEST_API] Notificación de prueba enviada a usuario ${userId}: ${message} - Éxito: ${success}`);

    return NextResponse.json({
      success: true,
      message: "Notificación de prueba enviada",
      notification: testNotification,
      clientsReached: success
    });

  } catch (error) {
    console.error("[TEST_API] Error enviando notificación de prueba:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}