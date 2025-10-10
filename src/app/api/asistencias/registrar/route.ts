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
import { notificationService } from "@/services/notificationService";
import Grupo from "@/models/grupo";
import Academia from "@/models/academia";
import User from "@/models/user";
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
    console.log(`[ASISTENCIAS] Registrando asistencia para usuario ${userId} en grupo ${grupoId}, fecha: ${fechaAsistencia.toISOString()}`);

    const resultado = await subscriptionService.registrarAsistencia({
      userId,
      academiaId: grupo.academia_id._id.toString(),
      grupoId,
      fecha: fechaAsistencia,
      registradoPor: session.user.id,
    });

    console.log(`[ASISTENCIAS] Asistencia registrada exitosamente:`, {
      asistenciaId: resultado.asistencia._id,
      userId: resultado.asistencia.userId,
      grupoId: resultado.asistencia.grupoId,
      fecha: resultado.asistencia.fecha,
      asistio: resultado.asistencia.asistio,
      esTrial: resultado.asistencia.esTrial,
      requiereActivacion: resultado.requiereActivacion,
    });

    // Enviar notificación al alumno
    try {
      console.log(`[ASISTENCIAS] Enviando notificación al alumno ${userId}...`);
      await notificationService.notificarAsistenciaRegistrada({
        alumnoId: userId,
        profesorId: session.user.id,
        profesorNombre: `${session.user.firstname} ${session.user.lastname}`,
        grupoNombre: grupo.nombre_grupo,
        academiaId: grupo.academia_id._id.toString(),
        academiaNombre: academia.nombre_academia,
        esTrial: resultado.asistencia.esTrial,
      });
      console.log(
        `[ASISTENCIAS] ✅ Notificación enviada al alumno ${userId} sobre asistencia`
      );
    } catch (notifError) {
      console.error(
        "[ASISTENCIAS] ❌ Error enviando notificación:",
        notifError
      );
      // No fallar el registro si falla la notificación
    }

    // Si se requiere activación (trial expirado), marcar suscripción y crear preapproval
    if (resultado.requiereActivacion) {
      // PRIMERO: Marcar suscripción como trial_expirado SIEMPRE
      resultado.suscripcion.estado = "trial_expirado";
      await resultado.suscripcion.save();
      console.log(`[ASISTENCIAS] Suscripción marcada como trial_expirado`);

      // SEGUNDO: Intentar crear preapproval de MercadoPago (puede fallar si no hay credenciales)
      let mercadoPagoLink = null;
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
        mercadoPagoLink = mpResult.initPoint;

        console.log(
          `[ASISTENCIAS] Preapproval de MercadoPago creado exitosamente`
        );
      } catch (mpError: any) {
        console.error(
          "[ASISTENCIAS] Error creando preapproval post-trial:",
          mpError.message
        );
        // Continuar sin MercadoPago - el dueño debe configurar credenciales
      }

      // Notificar al alumno que su trial expiró
      try {
        await notificationService.notificarTrialExpirado({
          alumnoId: userId,
          academiaId: grupo.academia_id._id.toString(),
          academiaNombre: academia.nombre_academia,
          mercadoPagoLink,
        });
        console.log(
          `[ASISTENCIAS] Notificación de trial expirado enviada al alumno ${userId}`
        );
      } catch (notifError) {
        console.error(
          "[ASISTENCIAS] Error enviando notificación de trial expirado:",
          notifError
        );
      }

      return NextResponse.json({
        success: true,
        asistencia: resultado.asistencia,
        trialExpirado: true,
        suscripcion: resultado.suscripcion,
        mercadoPago: mercadoPagoLink
          ? {
              initPoint: mercadoPagoLink,
            }
          : null,
        message: mercadoPagoLink
          ? "Asistencia registrada. Trial expirado, se requiere configurar pago."
          : "Asistencia registrada. Trial expirado. El dueño debe configurar MercadoPago para continuar.",
      });
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
