import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import FCMToken from "@/models/FCMToken";

export async function POST(req: Request) {
  try {
    // Conectar a la base de datos
    await connectDB();

    // Obtener la sesión del usuario
    const session = await getServerSession(authOptions);

    // Verificar si la sesión existe y si el user_id está presente
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "User ID is missing or not authenticated" },
        { status: 400 }
      );
    }

    // Obtener el token y deviceInfo desde el request
    const { token, deviceInfo } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token FCM es requerido" },
        { status: 400 }
      );
    }

    // Información del dispositivo
    const userAgent = req.headers.get("user-agent") || "";
    const device_info = {
      userAgent: userAgent.substring(0, 200), // Limitar longitud
      platform: deviceInfo?.platform || "unknown",
    };

    // Verificar si ya existe el token
    const existingToken = await FCMToken.findOne({ token });

    if (existingToken) {
      // Actualizar token existente
      existingToken.userId = session.user.id;
      existingToken.isActive = true;
      existingToken.lastUsed = new Date();
      if (deviceInfo) {
        existingToken.deviceInfo = device_info;
      }
      await existingToken.save();

      console.log("[FCM Token] Updated existing token:", existingToken._id);

      return NextResponse.json(
        {
          message: "Token FCM actualizado exitosamente",
          success: true,
          tokenId: existingToken._id,
        },
        { status: 200 }
      );
    } else {
      // Crear nuevo token
      const newToken = await FCMToken.create({
        userId: session.user.id,
        token: token,
        deviceInfo: device_info,
        isActive: true,
        lastUsed: new Date(),
      });

      console.log("[FCM Token] Created new token:", newToken._id);

      return NextResponse.json(
        {
          message: "Token FCM guardado exitosamente",
          success: true,
          tokenId: newToken._id,
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error("[FCM Token] Error:", error);

    if (error.code === 11000) {
      // Error de duplicado - token ya existe
      return NextResponse.json(
        {
          message: "Token ya registrado",
          success: true,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        error: "Error guardando token FCM",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
