import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import SalidaSocial from "@/models/salidaSocial";
import { nanoid } from "nanoid";
import { notifyNewSalidaToAll } from "@/libs/notificationHelpers";

async function generateUniqueShortId() {
  // Intentos para evitar colisiones
  for (let i = 0; i < 6; i++) {
    const candidate = nanoid(8); // 8 chars, ej: 'V1StGXR8'
    const exists = await SalidaSocial.exists({ shortId: candidate });
    if (!exists) return candidate;
  }
  // fallback muy poco probable
  return nanoid(12);
}

export async function POST(req: Request) {

  await connectDB();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {

    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();

  // Basic validation
  if (!body.nombre) {

    return NextResponse.json(
      { error: "El nombre es requerido" },
      { status: 400 }
    );
  }

  try {
    const shortId = await generateUniqueShortId();

    // Convert string numbers to actual numbers for schema validation
    const processedData = {
      ...body,
      cupo: body.cupo ? parseInt(body.cupo) : 0,
      sponsors: body.sponsors || [], // Ensure sponsors array exists
      // Filter out empty string profesorId to prevent ObjectId cast error
      profesorId:
        body.profesorId && body.profesorId.trim() !== ""
          ? body.profesorId
          : undefined,
    };

    const nuevaSalida = await SalidaSocial.create({
      ...processedData,
      creador_id: session.user.id,
      shortId,
    });

    // Notificar a todos los usuarios sobre la nueva salida (Firebase FCM)
    try {
      console.log("[Create Salida] Enviando notificaciones a todos los usuarios...");
      const result = await notifyNewSalidaToAll(
        nuevaSalida._id.toString(),
        nuevaSalida.nombre,
        session.user.id,
        nuevaSalida.localidad,
        nuevaSalida.fecha
      );
      console.log("[Create Salida] Notificaciones enviadas:", result);
    } catch (notifError) {
      console.error("[Create Salida] Error enviando notificaciones:", notifError);
      // No fallar la creación de la salida si las notificaciones fallan
    }

    return NextResponse.json(nuevaSalida, { status: 201 });
  } catch (error) {

    // Return more specific error information for debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Error al crear la salida social",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const salidas = await SalidaSocial.find().populate(
      "creador_id",
      "firstname"
    );

    return NextResponse.json(salidas, { status: 200 });
  } catch (error) {

    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
