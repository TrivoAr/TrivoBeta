/**
 * GET /api/subscriptions/[id] - Obtiene información de una suscripción
 * PUT /api/subscriptions/[id] - Actualiza una suscripción (pausar/cancelar)
 * DELETE /api/subscriptions/[id] - Cancela una suscripción
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { subscriptionService } from "@/services/subscriptionService";
import { mercadopagoService } from "@/services/mercadopagoService";
import Suscripcion from "@/models/Suscripcion";
import Academia from "@/models/academia";
import connectDB from "@/libs/mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await connectDB();

    const suscripcion = await Suscripcion.findById(params.id)
      .populate("academiaId", "nombre_academia imagen tipo_disciplina")
      .populate("grupoId", "nombre_grupo nivel horario dias");

    if (!suscripcion) {
      return NextResponse.json(
        { error: "Suscripción no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que la suscripción pertenece al usuario
    if (suscripcion.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Obtener estadísticas de asistencia
    const estadisticas =
      await subscriptionService.obtenerEstadisticasAsistencia(
        session.user.id,
        params.id
      );

    return NextResponse.json({ suscripcion, estadisticas });
  } catch (error: any) {
    console.error("Error en GET /api/subscriptions/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener suscripción" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { action } = await request.json();

    if (!action || !["pause", "cancel"].includes(action)) {
      return NextResponse.json(
        { error: "Acción inválida. Use 'pause' o 'cancel'" },
        { status: 400 }
      );
    }

    await connectDB();

    const suscripcion = await Suscripcion.findById(params.id).populate(
      "academiaId"
    );

    if (!suscripcion) {
      return NextResponse.json(
        { error: "Suscripción no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que la suscripción pertenece al usuario
    if (suscripcion.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Actualizar en Mercado Pago si tiene preapproval
    if (suscripcion.mercadoPago?.preapprovalId) {
      const academia = await Academia.findById(suscripcion.academiaId);
      try {
        if (action === "pause") {
          await mercadopagoService.pausarPreapproval(
            academia.dueño_id.toString(),
            suscripcion.mercadoPago.preapprovalId
          );
        } else if (action === "cancel") {
          await mercadopagoService.cancelarPreapproval(
            academia.dueño_id.toString(),
            suscripcion.mercadoPago.preapprovalId
          );
        }
      } catch (mpError: any) {
        console.error("Error actualizando en Mercado Pago:", mpError);
        // Continuar con la actualización local aunque falle Mercado Pago
      }
    }

    // Actualizar localmente
    let updatedSuscripcion;
    if (action === "pause") {
      updatedSuscripcion = await subscriptionService.pausarSuscripcion(
        params.id
      );
    } else if (action === "cancel") {
      updatedSuscripcion = await subscriptionService.cancelarSuscripcion(
        params.id
      );
    }

    return NextResponse.json({
      success: true,
      suscripcion: updatedSuscripcion,
      message:
        action === "pause"
          ? "Suscripción pausada correctamente"
          : "Suscripción cancelada correctamente",
    });
  } catch (error: any) {
    console.error("Error en PUT /api/subscriptions/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar suscripción" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Reutilizar la lógica de PUT con action "cancel"
  const modifiedRequest = new NextRequest(request.url, {
    method: "PUT",
    body: JSON.stringify({ action: "cancel" }),
    headers: request.headers,
  });

  return PUT(modifiedRequest, { params });
}
