import { NextResponse } from "next/server";
import Subscription from "@/models/subscription";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../libs/authOptions";
import { connectDB } from "@/libs/mongodb";

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

    // Verificar si existe una suscripción para este usuario
    const existingSubscription = await Subscription.findOne({
      user_id: session.user.id,
    });

    return NextResponse.json(
      {
        subscribed: !!existingSubscription,
        count: existingSubscription ? 1 : 0,
      },
      { status: 200 }
    );
  } catch (error) {

    return NextResponse.json(
      {
        error: "Error verificando suscripción",
        subscribed: false,
      },
      { status: 500 }
    );
  }
}
