import { NextResponse } from "next/server";
import MercadoPagoCredentials from "@/models/mercadoPagoCredentials";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "No autorizado" },
        { status: 401 }
      );
    }

    const credentials = await MercadoPagoCredentials.findOne({
      userId: session.user.id,
    });

    if (!credentials) {
      return NextResponse.json(
        {
          success: false,
          message: "Token no encontrado",
          hasCredentials: false, // 🔹 Devolvemos false si no hay credenciales
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        token: credentials.accessToken,
        hasCredentials: credentials.hasCredentials, // 🔹 Incluir en la respuesta
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al obtener las credenciales de Mercado Pago:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "No autorizado" },
        { status: 401 }
      );
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
      { publicKey, accessToken, hasCredentials: true }, // 🔹 Asegura que `hasCredentials` se guarde como true
      { upsert: true, new: true }
    );

    return NextResponse.json(
      {
        success: true,
        data: credentials,
        hasCredentials: true, // 🔹 Confirmamos en la respuesta
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al guardar las credenciales de Mercado Pago:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
