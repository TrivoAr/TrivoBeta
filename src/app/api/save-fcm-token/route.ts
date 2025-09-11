import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next"; 
import { authOptions } from "../../../libs/authOptions"; 
import { connectDB } from "@/libs/mongodb";
import mongoose from "mongoose";

// Modelo para tokens FCM - usar el mismo esquema
const FCMTokenSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  device_info: {
    userAgent: String,
    platform: String,
  },
}, {
  timestamps: true
});

const FCMToken = mongoose.models.FCMToken || mongoose.model("FCMToken", FCMTokenSchema);

export async function POST(req: Request) {
  try {
    // Conectar a la base de datos
    await connectDB();
    
    // Obtener la sesión del usuario
    const session = await getServerSession(authOptions);

    // Verificar si la sesión existe y si el user_id está presente
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "User ID is missing or not authenticated" }, { status: 400 });
    }

    // Obtener el token y userId desde el request
    const { token, userId } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token FCM es requerido" }, { status: 400 });
    }

    // Información del dispositivo (opcional)
    const userAgent = req.headers.get('user-agent') || '';
    const device_info = {
      userAgent: userAgent.substring(0, 200), // Limitar longitud
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown'
    };

    // Verificar si ya existe un token para este usuario
    const existingToken = await FCMToken.findOne({
      user_id: session.user.id,
    });

    if (existingToken) {
      // Actualizar token existente
      existingToken.token = token;
      existingToken.device_info = device_info;
      await existingToken.save();
      console.log("🔄 Token FCM actualizado para usuario:", session.user.id);
    } else {
      // Crear nuevo token
      await FCMToken.create({
        user_id: session.user.id,
        token: token,
        device_info: device_info,
      });
      console.log("✅ Nuevo token FCM guardado para usuario:", session.user.id);
    }

    // Enviar notificación de confirmación usando Firebase Admin
    try {
      // TODO: Implementar envío de notificación de bienvenida
      console.log("📱 Token FCM guardado correctamente, listo para recibir notificaciones");
    } catch (notificationError) {
      console.warn("⚠️ Error enviando notificación de confirmación:", notificationError);
      // No fallar si no se puede enviar la notificación de confirmación
    }

    return NextResponse.json({ 
      message: "Token FCM guardado exitosamente",
      success: true 
    }, { status: 200 });

  } catch (error) {
    console.error("Error guardando token FCM:", error);
    
    if (error.code === 11000) {
      // Error de duplicado - token ya existe
      return NextResponse.json({ 
        message: "Token ya registrado",
        success: true 
      }, { status: 200 });
    }
    
    return NextResponse.json({ 
      error: "Error guardando token FCM" 
    }, { status: 500 });
  }
}