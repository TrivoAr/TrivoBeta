/**
 * Helpers compartidos entre webhook real y webhook de testing
 */

import MiembroSalida from "@/models/MiembroSalida";
import Ticket from "@/models/ticket";
import SalidaSocial from "@/models/salidaSocial";
import User from "@/models/user";
import { notifyPaymentApproved } from "@/libs/notificationHelpers";
import { sendTicketEmail } from "@/libs/sendEmail";
import { nanoid } from "nanoid";

/**
 * Procesa un pago aprobado (usado tanto por webhook real como por testing)
 */
export async function procesarPagoAprobadoTest(pago: any, paymentDetails: any) {
  try {
    // Actualizar información del pago
    pago.estado = "aprobado";
    pago.amount = paymentDetails.transaction_amount;
    pago.paymentMethod = paymentDetails.payment_method_id;
    pago.statusDetail = paymentDetails.status_detail;
    pago.tipoPago = "mercadopago_automatico";
    pago.mercadopagoId = paymentDetails.id;
    pago.webhookProcessedAt = new Date();
    await pago.save();

    console.log(`💾 Pago ${pago._id} actualizado a estado: aprobado`);

    // PROCESAR SEGÚN TIPO (Salida Social vs Academia)
    if (pago.salidaId) {
      await procesarSalidaSocialTest(pago);
    } else if (pago.academiaId) {
      await procesarAcademiaTest(pago);
    }

  } catch (error) {
    console.error("❌ Error procesando pago aprobado:", error);
    throw error;
  }
}

/**
 * Procesa aprobación de pago para Salida Social
 */
async function procesarSalidaSocialTest(pago: any) {
  try {
    // 1. Actualizar estado del miembro
    const miembro = await MiembroSalida.findOne({ pago_id: pago._id });

    if (!miembro) {
      console.warn(`⚠️ No se encontró MiembroSalida para pago ${pago._id}`);
      return;
    }

    miembro.estado = "aprobado";
    await miembro.save();
    console.log(`✅ MiembroSalida ${miembro._id} aprobado`);

    // 2. Crear o actualizar Ticket con QR
    let ticket = await Ticket.findOne({
      userId: pago.userId._id,
      salidaId: pago.salidaId._id,
    });

    if (!ticket) {
      const code = nanoid(24);
      ticket = await Ticket.create({
        userId: pago.userId._id,
        salidaId: pago.salidaId._id,
        paymentRef: pago._id,
        code,
        status: "issued",
      });
      console.log(`🎫 Ticket creado: ${ticket._id} con código ${code}`);
    } else {
      ticket.status = "issued";
      await ticket.save();
      console.log(`🎫 Ticket actualizado: ${ticket._id}`);
    }

    // 3. Enviar email con ticket (solo si no se ha enviado antes)
    if (!ticket.emailSentAt) {
      try {
        const salida = await SalidaSocial.findById(pago.salidaId._id);
        const user = await User.findById(pago.userId._id);

        if (salida && user) {
          const redeemUrl = `${process.env.NEXTAUTH_URL}/r/${ticket.code}`;
          await sendTicketEmail(
            user.email,
            user.name,
            salida.nombre,
            ticket.code,
            redeemUrl
          );

          ticket.emailSentAt = new Date();
          await ticket.save();

          console.log(`📧 Email enviado a ${user.email}`);
        }
      } catch (emailError) {
        console.error("❌ Error enviando email:", emailError);
        // No lanzar error, continuar con notificación
      }
    }

    // 4. Enviar notificación push
    try {
      await notifyPaymentApproved(
        pago.userId._id,
        pago.salidaId._id,
        pago._id
      );
      console.log(`🔔 Notificación push enviada`);
    } catch (notifError) {
      console.error("❌ Error enviando notificación:", notifError);
    }

  } catch (error) {
    console.error("❌ Error procesando salida social:", error);
    throw error;
  }
}

/**
 * Procesa aprobación de pago para Academia
 */
async function procesarAcademiaTest(pago: any) {
  try {
    // Importar modelo dinámicamente para evitar circular dependencies
    const UsuarioAcademia = (await import("@/models/users_academia")).default;

    const usuarioAcademia = await UsuarioAcademia.findOne({
      usuario_id: pago.userId._id,
      academia_id: pago.academiaId._id,
    });

    if (usuarioAcademia) {
      usuarioAcademia.estado = "aceptado";
      await usuarioAcademia.save();
      console.log(`✅ UsuarioAcademia aprobado`);
    }

    // Notificar
    const { createNotification } = await import("@/libs/notificationHelpers");
    await createNotification({
      userId: pago.userId._id,
      fromUserId: pago.userId._id,
      type: "pago_aprobado",
      message: `Tu pago para la academia fue aprobado ✅`,
      actionUrl: `/academias/${pago.academiaId._id}`
    });

  } catch (error) {
    console.error("❌ Error procesando academia:", error);
    throw error;
  }
}
