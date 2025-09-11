import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next"; 
import { authOptions } from "../../../libs/authOptions"; 
import { connectDB } from "@/libs/mongodb";
import mongoose from "mongoose";

// Modelo para tokens FCM
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
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verificar si existe un token FCM para este usuario
    const existingToken = await FCMToken.findOne({
      user_id: session.user.id,
    });

    return NextResponse.json({ 
      subscribed: !!existingToken,
      tokenCount: existingToken ? 1 : 0
    }, { status: 200 });

  } catch (error) {
    console.error("Error verificando suscripción FCM:", error);
    return NextResponse.json({ 
      error: "Error verificando suscripción FCM",
      subscribed: false 
    }, { status: 500 });
  }
}