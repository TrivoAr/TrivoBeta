import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import mongoose from "mongoose";
import * as admin from "firebase-admin";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    let credential;
    let credentialsUsed = "";

    // Try using service account JSON first (preferred method)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const serviceAccount = JSON.parse(
          process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        );
        credential = admin.credential.cert(serviceAccount);
        credentialsUsed = "JSON service account";


      } catch (parseError) {

        throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON format");
      }
    }
    // Fallback to individual environment variables
    else if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      });
      credentialsUsed = "individual environment variables";


    } else {





      throw new Error("Firebase credentials not properly configured");
    }

    admin.initializeApp({ credential });

  } catch (error) {

    throw error;
  }
}

// FCM Token Schema
const FCMTokenSchema = new mongoose.Schema(
  {
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
  },
  {
    timestamps: true,
  }
);

const FCMToken =
  mongoose.models.FCMToken || mongoose.model("FCMToken", FCMTokenSchema);

export async function POST(req: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user's FCM token from database
    const userToken = await FCMToken.findOne({
      user_id: session.user.id,
    });

    if (!userToken) {
      return NextResponse.json(
        {
          error: "No FCM token found - activate notifications first",
        },
        { status: 400 }
      );
    }

    // Send test notification
    const message = {
      notification: {
        title: "🧪 Notificación de Prueba",
        body: "¡Funciona! Las notificaciones están configuradas correctamente.",
      },
      data: {
        type: "test",
        timestamp: new Date().toISOString(),
      },
      token: userToken.token,
    };

    try {
      const response = await admin.messaging().send(message);

      return NextResponse.json({
        success: true,
        message: "Notificación de prueba enviada correctamente",
        messageId: response,
      });
    } catch (fcmError: any) {

      // Check if token is invalid
      if (
        fcmError.code === "messaging/invalid-registration-token" ||
        fcmError.code === "messaging/registration-token-not-registered"
      ) {
        // Delete invalid token from database
        await FCMToken.deleteOne({ _id: userToken._id });

        return NextResponse.json(
          {
            error: "Token FCM inválido - por favor reactiva las notificaciones",
            tokenRemoved: true,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: `Error enviando notificación: ${fcmError.message}`,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {

    return NextResponse.json(
      {
        error: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
