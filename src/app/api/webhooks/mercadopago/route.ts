import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/libs/mongodb";
import Pago from "@/models/pagos";
import MiembroSalida from "@/models/MiembroSalida";
import Ticket from "@/models/ticket";
import SalidaSocial from "@/models/salidaSocial";
import User from "@/models/user";
import { notifyPaymentApproved } from "@/libs/notificationHelpers";
import { sendTicketEmail } from "@/libs/sendEmail";
import crypto from "crypto";
import { nanoid } from "nanoid";

/**
 * Webhook de MercadoPago para recibir notificaciones automáticas de pagos
 *
 * Este endpoint recibe notificaciones cuando:
 * - Un pago es creado
 * - Un pago es aprobado
 * - Un pago es rechazado
 * - Un pago cambia de estado
 *
 * Documentación: https://www.mercadopago.com/developers/es/docs/your-integrations/notifications/webhooks
 */
export async function POST(req: NextRequest) {
  try {
    console.log("📥 Webhook MercadoPago recibido");

    // 1. VALIDAR FIRMA SECRETA (Seguridad crítica)
    const signature = req.headers.get("x-signature");
    const requestId = req.headers.get("x-request-id");

    const isValid = validarFirmaMP(signature, requestId);

    if (!isValid) {
      console.error("❌ Firma inválida en webhook MP");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 }
      );
    }

    // 2. OBTENER DATOS DEL WEBHOOK
    const body = await req.json();
    console.log("📦 Webhook body:", JSON.stringify(body, null, 2));

    // MercadoPago envía diferentes tipos de notificaciones
    // Tipo: "payment" - Notificación de pago
    const isPaymentNotification =
      body.type === "payment" ||
      body.action?.includes("payment");

    if (!isPaymentNotification) {
      console.log("ℹ️ Notificación no es de tipo payment, ignorando");
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const paymentId = body.data?.id;

    if (!paymentId) {
      console.error("❌ No se encontró payment ID en webhook");
      return NextResponse.json({ received: true }, { status: 200 });
    }

    console.log(`🔍 Procesando pago MP ID: ${paymentId}`);

    // 3. CONSULTAR DETALLES DEL PAGO EN MERCADOPAGO
    const paymentDetails = await consultarPagoMP(paymentId);

    if (!paymentDetails) {
      console.error(`❌ No se pudo consultar pago ${paymentId} en MP`);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    console.log(`📊 Estado del pago MP: ${paymentDetails.status}`);
    console.log(`💰 Monto: ${paymentDetails.transaction_amount}`);
    console.log(`📧 Email del pagador: ${paymentDetails.payer?.email}`);
    console.log(`🔗 External Reference: ${paymentDetails.external_reference}`);

    // 4. BUSCAR EL PAGO EN NUESTRA BD
    await connectDB();

    let pago = await Pago.findOne({
      mercadopagoId: paymentId.toString()
    }).populate("userId salidaId academiaId");

    // ESTRATEGIA 1: Buscar por EMAIL del pagador + MONTO (MÁS PRECISO)
    if (!pago && paymentDetails.payer?.email) {
      console.log(`🔎 Buscando por email del pagador: ${paymentDetails.payer.email}`);

      // Buscar el usuario por email
      const user = await User.findOne({ email: paymentDetails.payer.email });

      if (user) {
        console.log(`✅ Usuario encontrado: ${user._id} (${user.name})`);

        // Buscar pago pendiente de este usuario con el mismo monto
        pago = await Pago.findOne({
          userId: user._id,
          amount: paymentDetails.transaction_amount,
          estado: "pendiente",
          tipoPago: "mercadopago_automatico"
        }).populate("userId salidaId academiaId")
          .sort({ createdAt: -1 }); // Más reciente primero

        if (pago) {
          // Asociar el mercadopagoId
          pago.mercadopagoId = paymentId.toString();
          await pago.save();
          console.log(`✅ Match por EMAIL + MONTO. Pago: ${pago._id}`);
        } else {
          console.log(`⚠️ Usuario encontrado pero no tiene pagos pendientes con monto ${paymentDetails.transaction_amount}`);
        }
      } else {
        console.log(`⚠️ No se encontró usuario con email ${paymentDetails.payer.email}`);
      }
    }

    // ESTRATEGIA 2: Buscar por external_reference (si el usuario agregó referencia)
    if (!pago && paymentDetails.external_reference) {
      console.log(`🔎 Buscando por external_reference: ${paymentDetails.external_reference}`);

      pago = await Pago.findOne({
        externalReference: paymentDetails.external_reference,
        estado: "pendiente"
      }).populate("userId salidaId academiaId");

      if (pago && !pago.mercadopagoId) {
        pago.mercadopagoId = paymentId.toString();
        await pago.save();
        console.log(`✅ Match por EXTERNAL_REFERENCE. Pago: ${pago._id}`);
      }
    }

    // ESTRATEGIA 3: Buscar por monto + fecha (FALLBACK - menos preciso)
    if (!pago) {
      console.log(`🔎 Buscando por monto + fecha (fallback menos preciso)...`);

      const paymentDate = new Date(paymentDetails.date_created || new Date());
      const oneDayBefore = new Date(paymentDate);
      oneDayBefore.setDate(oneDayBefore.getDate() - 1);

      const oneDayAfter = new Date(paymentDate);
      oneDayAfter.setDate(oneDayAfter.getDate() + 1);

      const pagosCandidatos = await Pago.find({
        amount: paymentDetails.transaction_amount,
        estado: "pendiente",
        tipoPago: "mercadopago_automatico",
        createdAt: {
          $gte: oneDayBefore,
          $lte: oneDayAfter
        }
      }).populate("userId salidaId academiaId")
        .sort({ createdAt: -1 })
        .limit(5);

      if (pagosCandidatos.length > 0) {
        console.log(`📋 Encontrados ${pagosCandidatos.length} pagos candidatos`);

        pago = pagosCandidatos[0];
        pago.mercadopagoId = paymentId.toString();
        await pago.save();

        console.log(`✅ Match por MONTO+FECHA (fallback). Pago: ${pago._id}`);

        if (pagosCandidatos.length > 1) {
          console.warn(`⚠️ ALERTA: Hay ${pagosCandidatos.length} pagos con el mismo monto. Tomando el más reciente.`);
        }
      }
    }

    if (!pago) {
      console.warn(`⚠️ Pago ${paymentId} no encontrado en BD`);
      console.warn(`   Monto: ${paymentDetails.transaction_amount}`);
      console.warn(`   Fecha: ${paymentDetails.date_created}`);
      console.warn(`   External Ref: ${paymentDetails.external_reference || "ninguna"}`);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    console.log(`✅ Pago encontrado en BD: ${pago._id}`);

    // 5. PROCESAR SEGÚN EL ESTADO DEL PAGO
    const estadoAnterior = pago.estado;

    switch (paymentDetails.status) {
      case "approved":
        console.log("✅ Pago APROBADO - Procesando...");
        await procesarPagoAprobado(pago, paymentDetails);
        break;

      case "pending":
        console.log("⏳ Pago PENDIENTE");
        pago.estado = "pendiente";
        pago.statusDetail = paymentDetails.status_detail;
        await pago.save();
        break;

      case "rejected":
        console.log("❌ Pago RECHAZADO");
        pago.estado = "rechazado";
        pago.statusDetail = paymentDetails.status_detail;
        await pago.save();

        // Actualizar miembro si existe
        if (pago.salidaId) {
          const miembro = await MiembroSalida.findOne({ pago_id: pago._id });
          if (miembro) {
            miembro.estado = "rechazado";
            await miembro.save();
          }
        }
        break;

      default:
        console.log(`ℹ️ Estado no procesado: ${paymentDetails.status}`);
    }

    if (estadoAnterior !== pago.estado) {
      console.log(`🔄 Estado cambiado: ${estadoAnterior} → ${pago.estado}`);
    }

    // 6. RESPONDER SIEMPRE 200 OK
    console.log("✅ Webhook procesado exitosamente");
    return NextResponse.json({
      received: true,
      processed: true,
      paymentId,
      status: pago.estado
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Error procesando webhook MP:", error);

    // IMPORTANTE: Incluso si hay error, responder 200 OK
    // para que MercadoPago no reintente infinitamente
    return NextResponse.json({
      received: true,
      error: "Internal error"
    }, { status: 200 });
  }
}

/**
 * Procesa un pago aprobado automáticamente
 */
async function procesarPagoAprobado(pago: any, paymentDetails: any) {
  try {
    // Actualizar información del pago
    pago.estado = "aprobado";
    pago.amount = paymentDetails.transaction_amount;
    pago.paymentMethod = paymentDetails.payment_method_id;
    pago.statusDetail = paymentDetails.status_detail;
    pago.tipoPago = "mercadopago_automatico";
    await pago.save();

    console.log(`💾 Pago ${pago._id} actualizado a estado: aprobado`);

    // PROCESAR SEGÚN TIPO (Salida Social vs Academia)
    if (pago.salidaId) {
      await procesarSalidaSocial(pago);
    } else if (pago.academiaId) {
      await procesarAcademia(pago);
    }

  } catch (error) {
    console.error("❌ Error procesando pago aprobado:", error);
    throw error;
  }
}

/**
 * Procesa aprobación de pago para Salida Social
 */
async function procesarSalidaSocial(pago: any) {
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
            salida.titulo,
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
async function procesarAcademia(pago: any) {
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
    await createNotification(
      pago.userId._id,
      "pago_aprobado",
      `Tu pago para la academia fue aprobado ✅`,
      `/academias/${pago.academiaId._id}`
    );

  } catch (error) {
    console.error("❌ Error procesando academia:", error);
    throw error;
  }
}

/**
 * Valida la firma secreta del webhook (SEGURIDAD)
 *
 * Documentación: https://www.mercadopago.com/developers/es/docs/your-integrations/notifications/webhooks#editor_6
 */
function validarFirmaMP(
  signature: string | null,
  requestId: string | null
): boolean {
  if (!signature) {
    console.warn("⚠️ Webhook sin firma");
    return false;
  }

  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  if (!secret) {
    console.warn("⚠️ MERCADOPAGO_WEBHOOK_SECRET no configurado");
    // En desarrollo, permitir sin validación
    return process.env.NODE_ENV === "development";
  }

  try {
    // Extraer timestamp y hash de la firma
    // Formato esperado: "ts=1234567890,v1=abc123..."
    const parts = signature.split(",");
    const ts = parts.find((p) => p.startsWith("ts="))?.split("=")[1];
    const v1 = parts.find((p) => p.startsWith("v1="))?.split("=")[1];

    if (!ts || !v1) {
      console.error("❌ Formato de firma inválido");
      return false;
    }

    // Generar hash esperado según documentación MP
    const template = `id:${requestId};request-id:${requestId};ts:${ts};`;
    const hash = crypto
      .createHmac("sha256", secret)
      .update(template)
      .digest("hex");

    const isValid = hash === v1;

    if (!isValid) {
      console.error("❌ Hash de firma no coincide");
      console.error(`Esperado: ${hash}`);
      console.error(`Recibido: ${v1}`);
    }

    return isValid;
  } catch (error) {
    console.error("❌ Error validando firma:", error);
    return false;
  }
}

/**
 * Consulta los detalles de un pago en la API de MercadoPago
 */
async function consultarPagoMP(paymentId: string | number) {
  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken) {
      console.error("❌ MERCADOPAGO_ACCESS_TOKEN no configurado");
      return null;
    }

    const url = `https://api.mercadopago.com/v1/payments/${paymentId}`;
    console.log(`🔗 Consultando: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        `❌ Error ${response.status} consultando pago en MP:`,
        response.statusText
      );
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error consultando pago en MP:", error);
    return null;
  }
}

// Método GET para verificar que el endpoint está activo
export async function GET() {
  return NextResponse.json({
    service: "MercadoPago Webhook Handler",
    status: "active",
    timestamp: new Date().toISOString(),
  });
}
