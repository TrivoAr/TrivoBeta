/**
 * GET /api/subscriptions/user
 * Obtiene todas las suscripciones del usuario autenticado
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { subscriptionService } from "@/services/subscriptionService";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const suscripciones = await subscriptionService.obtenerSuscripcionesUsuario(
      session.user.id
    );

    return NextResponse.json({ suscripciones });
  } catch (error: any) {

    return NextResponse.json(
      { error: error.message || "Error al obtener suscripciones" },
      { status: 500 }
    );
  }
}
