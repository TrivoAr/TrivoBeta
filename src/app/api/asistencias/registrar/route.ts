/**
 * POST /api/asistencias/registrar
 * Registra la asistencia de un alumno a una clase
 * Solo puede ser ejecutado por el profesor o dueño de la academia
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { subscriptionService } from "@/services/subscriptionService";
import { mercadopagoService } from "@/services/mercadopagoService";
import Grupo from "@/models/grupo";
import Academia from "@/models/academia";
import connectDB from "@/libs/mongodb";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { userId, grupoId, fecha } = await request.json();

    if (!userId || !grupoId) {
      return NextResponse.json(
        { error: "userId y grupoId son requeridos" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verificar que el grupo existe y obtener la academia
    const grupo = await Grupo.findById(grupoId).populate("academia_id");
    if (!grupo) {
      return NextResponse.json(
        { error: "Grupo no encontrado" },
        { status: 404 }
      );
    }

    const academia = await Academia.findById(grupo.academia_id);

    // Verificar que el usuario autenticado es profesor o dueño
    const esProfesor = grupo.profesor_id?.toString() === session.user.id;
    const esDuenio = academia.dueño_id.toString() === session.user.id;

    if (!esProfesor && !esDuenio) {
      return NextResponse.json(
        { error: "No tienes permiso para registrar asistencias en este grupo" },
        { status: 403 }
      );
    }

    // Registrar asistencia usando el servicio
    const fechaAsistencia = fecha ? new Date(fecha) : new Date();
    const resultado = await subscriptionService.registrarAsistencia({
      userId,
      academiaId: grupo.academia_id._id.toString(),
      grupoId,
      fecha: fechaAsistencia,
      registradoPor: session.user.id,
    });

    // Si se requiere activación (trial expirado), crear preapproval
    if (resultado.requiereActivacion) {
      try {
        const externalReference = mercadopagoService.generarExternalReference(
          userId,
          grupo.academia_id._id.toString()
        );

        const user = await resultado.suscripcion.populate("userId");

        const mpResult = await mercadopagoService.crearPreapproval(
          academia.dueño_id.toString(),
          {
            userId,
            academiaId: grupo.academia_id._id.toString(),
            grupoId,
            userEmail: user.userId.email,
            razon: `Suscripción a ${academia.nombre_academia}`,
            monto: Number(academia.precio),
            conTrial: false,
            externalReference,
          }
        );

        // Actualizar suscripción con info de Mercado Pago
        resultado.suscripcion.mercadoPago = {
          preapprovalId: mpResult.preapprovalId,
          initPoint: mpResult.initPoint,
          status: mpResult.status,
          payerEmail: user.userId.email,
        };
        await resultado.suscripcion.save();

        // Activar la suscripción
        await subscriptionService.activarSuscripcionPostTrial(
          resultado.suscripcion._id.toString()
        );

        return NextResponse.json({
          success: true,
          asistencia: resultado.asistencia,
          trialExpirado: true,
          suscripcion: resultado.suscripcion,
          mercadoPago: {
            initPoint: mpResult.initPoint,
            preapprovalId: mpResult.preapprovalId,
          },
          message:
            "Asistencia registrada. Trial expirado, se requiere configurar pago.",
        });
      } catch (mpError: any) {
        console.error("Error creando preapproval post-trial:", mpError);
        return NextResponse.json({
          success: true,
          asistencia: resultado.asistencia,
          trialExpirado: true,
          error: "Asistencia registrada pero error al configurar pago",
        });
      }
    }

    return NextResponse.json({
      success: true,
      asistencia: resultado.asistencia,
      suscripcion: resultado.suscripcion,
      message: "Asistencia registrada correctamente",
    });
  } catch (error: any) {
    console.error("Error en POST /api/asistencias/registrar:", error);
    return NextResponse.json(
      { error: error.message || "Error al registrar asistencia" },
      { status: 500 }
    );
  }
}
