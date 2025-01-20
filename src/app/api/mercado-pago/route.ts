import { NextResponse } from "next/server";
import MercadoPagoCredentials from "@/models/mercadoPagoCredentials";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "No autorizado" }, { status: 401 });
    }

    const { publicKey, accessToken } = await req.json();

    if (!publicKey || !accessToken) {
      return NextResponse.json(
        { success: false, message: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    // Guarda las credenciales en un modelo independiente
    const credentials = await MercadoPagoCredentials.findOneAndUpdate(
      { userId: session.user.id }, // Busca por ID del usuario
      { publicKey, accessToken }, // Actualiza o crea
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: credentials }, { status: 200 });
  } catch (error) {
    console.error("Error al guardar las credenciales de Mercado Pago:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
