/**
 * POST /api/subscriptions/create
 * Crea una nueva suscripción a una academia
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { subscriptionService } from "@/services/subscriptionService";
import { mercadopagoService } from "@/services/mercadopagoService";
import { notificationService } from "@/services/notificationService";
import Academia from "@/models/academia";
import Suscripcion from "@/models/Suscripcion";
import connectDB from "@/libs/mongodb";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { academiaId, grupoId } = await request.json();

    if (!academiaId) {
      return NextResponse.json(
        { error: "academiaId es requerido" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verificar que la academia existe
    const academia = await Academia.findById(academiaId).populate("dueño_id");
    if (!academia) {
      return NextResponse.json(
        { error: "Academia no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si ya tiene una suscripción activa
    const suscripcionExistente =
      await subscriptionService.obtenerSuscripcionActiva(
        session.user.id,
        academiaId
      );

    if (suscripcionExistente) {
      return NextResponse.json(
        {
          error: "Ya tienes una suscripción activa en esta academia",
          suscripcion: suscripcionExistente,
        },
        { status: 400 }
      );
    }

    // Verificar elegibilidad para trial
    const elegibilidad = await subscriptionService.verificarElegibilidadTrial(
      session.user.id,
      academiaId
    );

    // Crear suscripción
    const { suscripcion, requiereConfiguracionPago } =
      await subscriptionService.crearSuscripcion({
        userId: session.user.id,
        academiaId,
        grupoId,
        monto: Number(academia.precio) || 0,
      });

    // Si requiere configuración de pago, crear preapproval en Mercado Pago
    let mercadoPagoData = null;
    if (requiereConfiguracionPago) {
      try {
        const externalReference = mercadopagoService.generarExternalReference(
          session.user.id,
          academiaId
        );

        mercadoPagoData = await mercadopagoService.crearPreapproval(
          academia.dueño_id._id.toString(),
          {
            userId: session.user.id,
            academiaId,
            grupoId,
            userEmail: session.user.email,
            razon: `Suscripción a ${academia.nombre_academia}`,
            monto: Number(academia.precio),
            conTrial: false,
            externalReference,
          }
        );

        // Actualizar suscripción con datos de Mercado Pago
        suscripcion.mercadoPago = {
          preapprovalId: mercadoPagoData.preapprovalId,
          initPoint: mercadoPagoData.initPoint,
          status: mercadoPagoData.status,
          payerEmail: session.user.email,
        };
        await suscripcion.save();
      } catch (error: any) {
        console.error("Error creando preapproval:", error);
        // Si falla Mercado Pago, eliminar la suscripción creada
        await Suscripcion.findByIdAndDelete(suscripcion._id);
        return NextResponse.json(
          { error: "Error al configurar método de pago: " + error.message },
          { status: 500 }
        );
      }
    }

    // Si el usuario se unió con trial, notificar al dueño de la academia
    if (elegibilidad.puedeUsarTrial) {
      try {
        await notificationService.notificarNuevoSuscriptorTrial({
          dueñoId: academia.dueño_id._id.toString(),
          userId: session.user.id,
          userName: `${session.user.firstname} ${session.user.lastname}`,
          academiaId: academia._id.toString(),
          academiaNombre: academia.nombre_academia,
        });
        console.log(
          `[SUBSCRIPTIONS] Notificación enviada al dueño ${academia.dueño_id._id} sobre nuevo trial`
        );
      } catch (notifError) {
        console.error(
          "[SUBSCRIPTIONS] Error enviando notificación:",
          notifError
        );
        // No fallar la suscripción si falla la notificación
      }
    }

    return NextResponse.json({
      success: true,
      suscripcion,
      elegibilidad,
      mercadoPago: mercadoPagoData,
      message: elegibilidad.puedeUsarTrial
        ? "Suscripción creada con trial gratuito"
        : "Suscripción creada, completa el pago para activarla",
    });
  } catch (error: any) {
    console.error("Error en POST /api/subscriptions/create:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear suscripción" },
      { status: 500 }
    );
  }
}
