import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import FCMToken from "@/models/FCMToken";

export async function POST(req: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { userId } = await req.json();

    // Verificar que el userId coincida con la sesión
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Buscar tokens FCM activos del usuario
    const activeTokens = await FCMToken.find({
      userId: session.user.id,
      isActive: true,
    }).lean();

    return NextResponse.json({
      subscribed: activeTokens.length > 0,
      tokenCount: activeTokens.length,
    });
  } catch (error: any) {
    console.error("[Check FCM Subscription] Error:", error);
    return NextResponse.json(
      {
        error: "Error checking subscription",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
