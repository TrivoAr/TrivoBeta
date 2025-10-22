import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import UsuarioAcademia from "@/models/users_academia";
import Suscripcion from "@/models/Suscripcion";
import { SUBSCRIPTION_CONFIG } from "@/config/subscription.config";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const academiaId = searchParams.get("academia_id");
  const userId = searchParams.get("user_id");

  try {
    await connectDB();

    if (!academiaId || !userId) {
      return NextResponse.json(
        { message: "IDs de academia y usuario son requeridos" },
        { status: 400 }
      );
    }

    // Verificar en el sistema viejo (solicitud pendiente)
    const solicitud = await UsuarioAcademia.findOne({
      academia_id: academiaId,
      user_id: userId,
      estado: "pendiente",
    });

    if (solicitud) {
      return NextResponse.json({ hasActiveRequest: true }, { status: 200 });
    }

    // Verificar en el sistema nuevo (suscripción activa o en trial)
    const suscripcion = await Suscripcion.findOne({
      userId,
      academiaId,
      estado: {
        $in: [
          SUBSCRIPTION_CONFIG.ESTADOS.TRIAL,
          SUBSCRIPTION_CONFIG.ESTADOS.ACTIVA,
        ],
      },
    });

    if (suscripcion) {
      return NextResponse.json({ hasActiveRequest: true }, { status: 200 });
    }

    return NextResponse.json({ hasActiveRequest: false }, { status: 200 });
  } catch (error) {

    return NextResponse.json(
      { message: "Hubo un error al verificar la solicitud activa" },
      { status: 500 }
    );
  }
}
