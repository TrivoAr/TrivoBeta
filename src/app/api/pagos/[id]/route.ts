import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import Pago from "@/models/pagos";
import Notificacion from "@/models/notificacion";
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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 🔹 GET: Buscar un pago por ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const pago = await Pago.findById(params.id)
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
    console.error("Error obteniendo pago:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// 🔹 PATCH: Actualizar estado del pago y notificar
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
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

    // Actualizamos el estado del pago
    const pago = await Pago.findByIdAndUpdate(
      params.id,
      { estado },
      { new: true }
    );
    if (!pago) {
      return NextResponse.json(
        { error: "Pago no encontrado" },
        { status: 404 }
      );
    }

    // Depuración de IDs
    console.log("=== DEBUG PAGOS ===");
    console.log("pago.salidaId:", pago.salidaId);
    console.log("pago.academiaId:", pago.academiaId);
    console.log("pago.userId:", pago.userId);

    // Detectar si es una salida social o una academia
    const esSalidaSocial = !!pago.salidaId;
    const esAcademia = !!pago.academiaId;

    if (esSalidaSocial) {
      // Lógica para salidas sociales (código existente)
      await procesarSalidaSocial(pago, estado);
    } else if (esAcademia) {
      // Lógica para academias
      await procesarAcademia(pago, estado);
    } else {
      console.warn("⚠️ Pago sin salidaId ni academiaId válido");
    }

    return NextResponse.json({ success: true, pago }, { status: 200 });
  } catch (error) {
    console.error("Error actualizando pago:", error);
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
      console.warn("⚠️ Salida no encontrada");
      return;
    }

    const organizador = salida.creador_id;
    const miembro = await User.findById(pago.userId);
    if (!miembro) {
      console.warn("⚠️ Miembro no encontrado");
      return;
    }

    console.log("Salida:", salida._id, salida.nombre);
    console.log(
      "Organizador:",
      organizador._id,
      organizador.firstname,
      organizador.lastname
    );
    console.log("Miembro:", miembro._id, miembro.firstname, miembro.lastname);

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
        // Actualizar estado del miembro a aprobado cuando se aprueba el pago
        if (pago.miembro_id) {
          await MiembroSalida.findByIdAndUpdate(
            pago.miembro_id,
            { estado: "aprobado" },
            { new: true }
          );
          console.log(
            "✅ Estado del miembro actualizado a aprobado:",
            pago.miembro_id
          );
        }

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

        console.log("[PAGOS][APROBADO] ticket:", {
          id: String(ticket._id),
          code: ticket.code,
          emailSentAt: ticket.emailSentAt || null,
        });

        // 2) enviar mail SOLO si aún no fue enviado
        if (!ticket.emailSentAt) {
          const redeemUrl = `${process.env.NEXT_PUBLIC_APP_URL}/r/${ticket.code}`;
          const dataUrl = await qrPngDataUrl(redeemUrl);

          console.log("[PAGOS][APROBADO] Voy a enviar QR", {
            to: miembro.email,
            code: ticket.code,
          });

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

          console.log("[PAGOS][APROBADO] Email marcado como enviado", {
            ticketId: String(ticket._id),
            emailSentAt: ticket.emailSentAt,
            emailId,
          });
        } else {
          console.log(
            "[PAGOS][APROBADO] Ya había emailSentAt, no reenvío. code:",
            ticket.code
          );
        }
      } catch (qrErr) {
        console.error("[PAGOS][APROBADO] Error emitiendo/enviando QR:", qrErr);
      }
    }

    await Notificacion.create({
      userId: miembro._id,
      fromUserId: organizador._id,
      salidaId: salida._id,
      type: "pago_aprobado",
      message: mensajeMiembro,
      read: false,
    });

    if (estado !== "aprobado") {
      await sendPaymentStatusEmail(miembro.email, estado);
    }

    console.log("✅ Notificaciones de salida social creadas con éxito");
  } catch (notifError) {
    console.error("Error procesando salida social:", notifError);
  }
}

// Función para procesar academias
async function procesarAcademia(pago: any, estado: string) {
  try {
    const academia = await Academia.findById(pago.academiaId).populate(
      "dueño_id"
    );
    if (!academia) {
      console.warn("⚠️ Academia no encontrada");
      return;
    }

    const dueño = academia.dueño_id;
    const miembro = await User.findById(pago.userId);
    if (!miembro) {
      console.warn("⚠️ Miembro no encontrado");
      return;
    }

    console.log("Academia:", academia._id, academia.nombre_academia);
    console.log("Dueño:", dueño._id, dueño.firstname, dueño.lastname);
    console.log("Miembro:", miembro._id, miembro.firstname, miembro.lastname);

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
        console.log(
          "✅ Estado del miembro de academia actualizado a aceptado:",
          pago.userId,
          "en academia:",
          pago.academiaId
        );
      } catch (updateErr) {
        console.error(
          "Error actualizando estado del miembro de academia:",
          updateErr
        );
      }
    }

    await Notificacion.create({
      userId: miembro._id,
      fromUserId: dueño._id,
      academiaId: academia._id,
      type: "pago_aprobado",
      message: mensajeMiembro,
      read: false,
    });

    if (estado !== "aprobado") {
      await sendPaymentStatusEmail(miembro.email, estado);
    }

    console.log("✅ Notificaciones de academia creadas con éxito");
  } catch (notifError) {
    console.error("Error procesando academia:", notifError);
  }
}
