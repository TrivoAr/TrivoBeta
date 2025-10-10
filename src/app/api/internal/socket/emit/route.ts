/**
 * POST /api/internal/socket/emit
 * Endpoint interno para emitir eventos Socket.IO desde API routes
 * Solo accesible desde el mismo servidor (localhost)
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Verificar que la petición viene del mismo servidor
    const host = request.headers.get("host");
    if (!host?.includes("localhost") && !host?.includes("127.0.0.1")) {
      return NextResponse.json(
        { error: "Acceso denegado - solo para uso interno" },
        { status: 403 }
      );
    }

    const { userId, event, data } = await request.json();

    console.log("[SOCKET_EMIT_API] 🔍 Verificando global.socketServer...");
    console.log("[SOCKET_EMIT_API] global existe?", typeof global !== "undefined");
    console.log("[SOCKET_EMIT_API] global.socketServer existe?", (global as any).socketServer !== undefined);
    console.log("[SOCKET_EMIT_API] emitToUser existe?", typeof (global as any).socketServer?.emitToUser === "function");

    if (!userId || !event) {
      return NextResponse.json(
        { error: "userId y event son requeridos" },
        { status: 400 }
      );
    }

    // Intentar emitir usando global.socketServer
    if (
      typeof global !== "undefined" &&
      (global as any).socketServer &&
      typeof (global as any).socketServer.emitToUser === "function"
    ) {
      const enviado = await (global as any).socketServer.emitToUser(
        userId,
        event,
        data
      );

      return NextResponse.json({
        success: true,
        enviado,
        message: enviado
          ? "Notificación enviada en tiempo real"
          : "Usuario no conectado, notificación guardada en DB",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Servidor Socket.IO no disponible",
      },
      { status: 503 }
    );
  } catch (error: any) {
    console.error("[SOCKET_EMIT_API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Error interno" },
      { status: 500 }
    );
  }
}
