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
  await connectDB();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();

  try {
    const shortId = await generateUniqueShortId();
    const nuevaSalida = await SalidaSocial.create({
      ...body,
      creador_id: session.user.id,
      shortId,
    });

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
    console.error("Error al crear la salida social:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
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
