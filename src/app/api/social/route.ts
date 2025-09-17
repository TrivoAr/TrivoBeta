import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import SalidaSocial from "@/models/salidaSocial";
import { nanoid } from "nanoid";



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
  console.log("[CREATE_SALIDA] Starting request");
  await connectDB();
  console.log("[CREATE_SALIDA] DB connected");

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.log("[CREATE_SALIDA] No session/user");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  console.log("[CREATE_SALIDA] Received body:", JSON.stringify(body, null, 2));

  // Basic validation
  if (!body.nombre) {
    console.log("[CREATE_SALIDA] Missing required field: nombre");
    return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
  }

  try {
    const shortId = await generateUniqueShortId();
    console.log("[CREATE_SALIDA] Generated shortId:", shortId);

    // Convert string numbers to actual numbers for schema validation
    const processedData = {
      ...body,
      cupo: body.cupo ? parseInt(body.cupo) : 0,
      sponsors: body.sponsors || [], // Ensure sponsors array exists
      // Filter out empty string profesorId to prevent ObjectId cast error
      profesorId: body.profesorId && body.profesorId.trim() !== "" ? body.profesorId : undefined,
    };
    console.log("[CREATE_SALIDA] Processed data:", JSON.stringify(processedData, null, 2));

    const nuevaSalida = await SalidaSocial.create({
      ...processedData,
      creador_id: session.user.id,
      shortId,
    });
    console.log("[CREATE_SALIDA] Created salida:", nuevaSalida._id);

     try {
      const payload = {
        title: "Nueva salida publicada 🚀",
        body: `${nuevaSalida.nombre} en ${nuevaSalida.localidad} el ${nuevaSalida.fecha}`,
        url: `/salida/${nuevaSalida._id}`, // o `/s/${shortId}` si usas shortId
      };

      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-notification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("⚠️ Error al enviar la notificación push:", err);
    }

    return NextResponse.json(nuevaSalida, { status: 201 });
  } catch (error) {
    console.error("[CREATE_SALIDA_ERROR]", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      userId: session.user.id
    });

    // Return more specific error information for debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      error: "Error al crear la salida social",
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const salidas = await SalidaSocial.find().populate('creador_id', 'firstname');

    return NextResponse.json(salidas, { status: 200 });
  } catch (error) {
    console.error("[GET_SALIDAS]", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
