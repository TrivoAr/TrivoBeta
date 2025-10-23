import { NextRequest, NextResponse } from "next/server";
import Notificacion from "@/models/notificacion";
import connectDB from "@/libs/mongodb";

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

    await connectDB();

    // Crear una notificación de prueba en la base de datos
    // Será recuperada automáticamente por el sistema de polling
    const testNotification = await Notificacion.create({
      userId: userId,
      fromUserId: userId, // Auto-notificación de prueba
      type: "test",
      message: message,
      read: false,
      metadata: {
        test: true,
        timestamp: Date.now(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Notificación de prueba creada (será detectada por polling)",
      notification: testNotification,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
