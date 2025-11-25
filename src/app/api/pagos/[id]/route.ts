import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import Pago from "@/models/pagos";
import { sendPaymentStatusEmail } from "@/libs/mailer";
import SalidaSocial from "@/models/salidaSocial";
import Academia from "@/models/academia";
import UsuarioAcademia from "@/models/users_academia";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import User from "@/models/user";
import Ticket from "@/models/ticket";
import { qrPngDataUrl } from "@/libs/qr";
import { sendTicketEmail } from "@/libs/email/sendTicketEmail";
import { customAlphabet } from "nanoid";
import MiembroSalida from "@/models/MiembroSalida";
import {
  notifyPaymentApproved,
  notifyPaymentRejected,
} from "@/libs/notificationHelpers";
import { trackEventServer, trackChargeServer } from "@/libs/mixpanel.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 🔹 GET: Buscar un pago por ID
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const pago = await Pago.findById(id)
      .populate("salidaId")
      .populate("academiaId")
      .populate("userId");

    if (!pago) {
      return NextResponse.json(
        { error: "Pago no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(pago, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// 🔹 PATCH: Actualizar estado del pago y notificar
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { estado } = await req.json();
    if (!["pendiente", "aprobado", "rechazado"].includes(estado)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const { id } = await params;

    // Actualizamos el estado del pago
    const pago = await Pago.findByIdAndUpdate(
      id,
      { estado },
      { new: true }
    );
    if (!pago) {
      return NextResponse.json(
        { error: "Pago no encontrado" },
        { status: 404 }
      );
    }

    // Detectar si es una salida social o una academia
    const esSalidaSocial = !!pago.salidaId;
    const esAcademia = !!pago.academiaId;

    if (esSalidaSocial) {
      // Lógica para salidas sociales (código existente)
      await procesarSalidaSocial(pago, estado);
    } else if (esAcademia) {
      // Lógica para academias
      await procesarAcademia(pago, estado);
    }

    // TRACK MIXPANEL - Payment Events
    try {
      if (estado === "aprobado") {
        // Track Payment Completed event
        await trackEventServer({
          event: "Payment Completed",
          distinctId: pago.userId.toString(),
          properties: {
            amount: pago.amount || 0,
            event_id: pago.salidaId ? pago.salidaId.toString() : undefined,
            academia_id: pago.academiaId ? pago.academiaId.toString() : undefined,
            payment_method: "manual_transfer",
            currency: "ARS",
            timestamp: new Date().toISOString(),
            manual_approval: true
          }
        });

        // Track revenue charge
        await trackChargeServer({
          distinctId: pago.userId.toString(),
          amount: pago.amount || 0,
          properties: {
            payment_method: "manual_transfer",
            event_id: pago.salidaId ? pago.salidaId.toString() : undefined,
            manual_approval: true
          }
        });
      } else if (estado === "rechazado") {
        // Track Payment Rejected event
        await trackEventServer({
          event: "Payment Rejected",
          distinctId: pago.userId.toString(),
          properties: {
            amount: pago.amount || 0,
            event_id: pago.salidaId ? pago.salidaId.toString() : undefined,
            academia_id: pago.academiaId ? pago.academiaId.toString() : undefined,
            payment_method: "manual_transfer",
            currency: "ARS",
            timestamp: new Date().toISOString(),
            manual_rejection: true
          }
        });
      }
    } catch (mixpanelError) {
      console.error("Error tracking mixpanel event:", mixpanelError);
      // No lanzar error - el tracking no debe afectar el flujo de pago
    }

    return NextResponse.json({ success: true, pago }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// Función para procesar salidas sociales
async function procesarSalidaSocial(pago: any, estado: string) {
  try {
    const salida = await SalidaSocial.findById(pago.salidaId).populate(
      "creador_id"
    );
    if (!salida) {
      return;
    }

    const organizador = salida.creador_id;
    const miembro = await User.findById(pago.userId);
    if (!miembro) {
      return;
    }

    // Notificación para el miembro
    const mensajeMiembro =
      estado === "aprobado"
        ? `Tu pago para la salida "${salida.nombre}" fue aprobado ✅`
        : `Tu pago para la salida "${salida.nombre}" fue rechazado ❌`;

    const nanoid = customAlphabet(
      "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
      24
    );

    if (estado === "aprobado") {
      try {
        // 1) buscar o crear ticket (idempotente)
        let ticket = await Ticket.findOne({
          userId: pago.userId,
          salidaId: pago.salidaId,
        });
        if (!ticket) {
          ticket = await Ticket.create({
            userId: pago.userId,
            salidaId: pago.salidaId,
            paymentRef: String(pago._id),
            code: nanoid(),
            status: "issued",
            issuedAt: new Date(),
          });
        }

        // 2) enviar mail SOLO si aún no fue enviado
        if (!ticket.emailSentAt) {
          const redeemUrl = `${process.env.NEXT_PUBLIC_APP_URL}/r/${ticket.code}`;
          const dataUrl = await qrPngDataUrl(redeemUrl);

          const emailId = await sendTicketEmail({
            userId: String(pago.userId),
            salidaId: String(pago.salidaId),
            redeemUrl,
            qrDataUrl: dataUrl,
          });

          // ✅ marcar enviado en el doc y guardar
          ticket.emailSentAt = new Date();
          (ticket as any).emailId = emailId;
          await ticket.save();
        }
      } catch (qrErr) {
      }
    }

    // Notificar con sockets en tiempo real
    if (estado === "aprobado") {
      await notifyPaymentApproved(
        String(miembro._id),
        String(organizador._id),
        String(salida._id),
        salida.nombre
      );
    } else {
      await notifyPaymentRejected(
        String(miembro._id),
        String(organizador._id),
        String(salida._id),
        salida.nombre
      );
      await sendPaymentStatusEmail(miembro.email, estado);
    }
  } catch (notifError) {
  }
}

// Función para procesar academias
async function procesarAcademia(pago: any, estado: string) {
  try {
    const academia = await Academia.findById(pago.academiaId).populate(
      "dueño_id"
    );
    if (!academia) {
      return;
    }

    const dueño = academia.dueño_id;
    const miembro = await User.findById(pago.userId);
    if (!miembro) {
      return;
    }

    // Notificación para el miembro
    const mensajeMiembro =
      estado === "aprobado"
        ? `Tu pago para la academia "${academia.nombre_academia}" fue aprobado ✅`
        : `Tu pago para la academia "${academia.nombre_academia}" fue rechazado ❌`;

    if (estado === "aprobado") {
      try {
        // Actualizar estado del miembro a "aceptado" cuando se aprueba el pago
        await UsuarioAcademia.findOneAndUpdate(
          {
            academia_id: pago.academiaId,
            user_id: pago.userId,
          },
          { estado: "aceptado" },
          { new: true }
        );
      } catch (updateErr) {
      }
    }

    // TODO: Crear funciones notifyPaymentApprovedAcademia/Rejected cuando sea necesario
    // Por ahora, seguimos usando la estructura anterior
    if (estado === "aprobado") {
      const { createNotification } = await import("@/libs/notificationHelpers");
      await createNotification({
        userId: String(miembro._id),
        fromUserId: String(dueño._id),
        type: "pago_aprobado",
        message: mensajeMiembro,
        academiaId: String(academia._id),
        actionUrl: `/academias/${academia._id}`,
      });
    } else {
      const { createNotification } = await import("@/libs/notificationHelpers");
      await createNotification({
        userId: String(miembro._id),
        fromUserId: String(dueño._id),
        type: "pago_rechazado",
        message: mensajeMiembro,
        academiaId: String(academia._id),
        actionUrl: `/academias/${academia._id}`,
      });
      await sendPaymentStatusEmail(miembro.email, estado);
    }
  } catch (notifError) {
  }
}
