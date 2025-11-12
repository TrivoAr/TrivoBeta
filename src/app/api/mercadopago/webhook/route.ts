import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { connectDB } from "@/libs/mongodb";
import Pagos from "@/models/pagos";
import MiembroSalida from "@/models/MiembroSalida";
import SalidaSocial from "@/models/salidaSocial";
import User from "@/models/user";
import Notificacion from "@/models/notificacion";
import Ticket from "@/models/ticket";
import { qrPngDataUrl } from "@/libs/qr";
import { sendTicketEmail } from "@/libs/email/sendTicketEmail";
import { customAlphabet } from "nanoid";
import * as admin from "firebase-admin";
import mongoose from "mongoose";
import { trackEventServer, trackChargeServer } from "@/libs/mixpanel.server";

// Configurar cliente de MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

const payment = new Payment(client);

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    let credential;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      );
      credential = admin.credential.cert(serviceAccount);

    } else if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      });

    } else {

    }

    if (credential) {
      admin.initializeApp({ credential });
    }
  } catch (error) {

  }
}

// FCM Token Schema
const FCMTokenSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    token: { type: String, required: true, unique: true },
    device_info: { userAgent: String, platform: String },
  },
  { timestamps: true }
);

const FCMToken =
  mongoose.models.FCMToken || mongoose.model("FCMToken", FCMTokenSchema);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verificar que es una notificación de pago
    if (body.type !== "payment") {
      return NextResponse.json({
        message: "Tipo de notificación no procesada",
      });
    }

    const paymentId = body.data.id;

    if (!paymentId) {
      return NextResponse.json(
        { error: "ID de pago no encontrado" },
        { status: 400 }
      );
    }

    // Obtener información del pago desde MercadoPago
    const paymentData = await payment.get({ id: paymentId });

    if (!paymentData.external_reference) {

      return NextResponse.json({ message: "Sin external_reference" });
    }

    // Parsear external_reference (formato: salidaId-userId)
    const [salidaId, userId] = paymentData.external_reference.split("-");

    await connectDB();

    // Buscar o crear el registro de pago
    let pagoRecord = await Pagos.findOne({
      salidaId,
      userId,
      mercadoPagoPaymentId: paymentId,
    });

    if (!pagoRecord) {
      // Crear nuevo registro de pago
      pagoRecord = new Pagos({
        salidaId,
        userId,
        mercadoPagoPaymentId: paymentId,
        amount: paymentData.transaction_amount,
        currency: paymentData.currency_id,
        paymentMethod: paymentData.payment_method_id,
        status: paymentData.status,
        statusDetail: paymentData.status_detail,
        externalReference: paymentData.external_reference,
        mercadoPagoData: paymentData,
        estado: mapMercadoPagoStatus(paymentData.status),
      });
    } else {
      // Actualizar registro existente
      pagoRecord.status = paymentData.status;
      pagoRecord.statusDetail = paymentData.status_detail;
      pagoRecord.estado = mapMercadoPagoStatus(paymentData.status);
      pagoRecord.mercadoPagoData = paymentData;
    }

    await pagoRecord.save();

    // Si el pago fue aprobado, actualizar el estado del miembro
    if (paymentData.status === "approved") {
      await procesarPagoAprobado(
        salidaId,
        userId,
        pagoRecord._id,
        paymentData.transaction_amount || 0,
        paymentId
      );
    }

    return NextResponse.json({ message: "Webhook procesado correctamente" });
  } catch (error) {

    return NextResponse.json(
      {
        error: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}

// Mapear estado de MercadoPago a nuestro sistema
function mapMercadoPagoStatus(mpStatus: string): string {
  switch (mpStatus) {
    case "approved":
      return "aprobado";
    case "pending":
    case "in_process":
      return "pendiente";
    case "rejected":
    case "cancelled":
      return "rechazado";
    default:
      return "pendiente";
  }
}

// Procesar pago aprobado
async function procesarPagoAprobado(
  salidaId: string,
  userId: string,
  pagoId: string,
  amount: number,
  paymentId: string
) {
  try {
    // Obtener información de la salida para el tracking
    const salida = await SalidaSocial.findById(salidaId);

    if (!salida) {
      console.error(`❌ Salida ${salidaId} no encontrada para tracking`);
      return;
    }

    // Convertir precio de string a número
    let precioNumerico = 0;
    if (salida.precio) {
      const precioStr = String(salida.precio).replace(/[^\d.,]/g, "").replace(",", ".");
      precioNumerico = parseFloat(precioStr);
    }

    // Usar el monto del pago si no se pudo obtener el precio
    const montoFinal = precioNumerico > 0 ? precioNumerico : amount;

    // Buscar si ya existe un miembro para esta salida y usuario
    let miembro = await MiembroSalida.findOne({
      salida_id: salidaId,
      usuario_id: userId,
    });

    const esNuevoMiembro = !miembro;

    if (!miembro) {
      // Crear nuevo miembro con auto-aprobación para pagos de MercadoPago
      miembro = new MiembroSalida({
        salida_id: salidaId,
        usuario_id: userId,
        pago_id: pagoId,
        estado: "aprobado", // Auto-aprobación para MercadoPago
      });
    } else {
      // Actualizar miembro existente y auto-aprobar para MercadoPago
      miembro.pago_id = pagoId;
      miembro.estado = "aprobado"; // Auto-aprobación para MercadoPago
    }

    await miembro.save();

    // ========== TRACKING DE REVENUE EXACTO ==========
    // Verificar si ya se trackeó el revenue para este pago
    const pagoDoc = await Pagos.findById(pagoId);
    const yaTrackeado = pagoDoc?.revenueTracked || false;

    // Solo trackear si:
    // 1. Es un nuevo miembro O cambió de estado a aprobado
    // 2. Y NO se ha trackeado el revenue anteriormente
    if ((esNuevoMiembro || miembro.estado === "aprobado") && !yaTrackeado) {
      console.log(`💰 Tracking revenue: $${montoFinal} ARS para usuario ${userId}`);

      // Trackear el evento de pago aprobado con revenue
      const trackSuccess = await trackEventServer({
        event: "Payment Approved",
        distinctId: userId,
        properties: {
          distinct_id: userId,
          amount: montoFinal,
          revenue: montoFinal, // Propiedad especial de Mixpanel para revenue
          event_id: salidaId,
          event_type: "salida_social",
          event_name: salida.nombre,
          payment_id: paymentId,
          payment_method: "mercadopago",
          currency: "ARS",
          source: "webhook_mercadopago",
          timestamp: new Date().toISOString(),
        },
      });

      // Registrar el cargo en el perfil del usuario para lifetime value
      const chargeSuccess = await trackChargeServer({
        distinctId: userId,
        amount: montoFinal,
        properties: {
          event_id: salidaId,
          event_type: "salida_social",
          event_name: salida.nombre,
          payment_id: paymentId,
          payment_method: "mercadopago",
          currency: "ARS",
          timestamp: new Date().toISOString(),
        },
      });

      // Marcar el pago como trackeado si ambos fueron exitosos
      if (trackSuccess && chargeSuccess && pagoDoc) {
        pagoDoc.revenueTracked = true;
        pagoDoc.revenueTrackedAt = new Date();
        await pagoDoc.save();
        console.log(`✅ Revenue tracking completado y marcado para usuario ${userId}`);
      } else {
        console.warn(`⚠️ Revenue tracking puede haber fallado para usuario ${userId}`);
      }
    } else if (yaTrackeado) {
      console.log(`ℹ️ Revenue ya trackeado para pago ${pagoId}, evitando duplicado`);
    }
    // ========== FIN TRACKING ==========

    // Generar y enviar QR de acceso por email
    await enviarQRAcceso(salidaId, userId, pagoId);

    // Notificar al creador de la salida
    await notificarCreadorPagoAprobado(salidaId, userId, "mercadopago");
  } catch (error) {
    console.error("❌ Error al procesar pago aprobado:", error);
  }
}

// Función para generar y enviar QR de acceso por email
async function enviarQRAcceso(
  salidaId: string,
  userId: string,
  pagoId: string
) {
  try {

    // Buscar o crear ticket (idempotente)
    let ticket = await Ticket.findOne({
      userId: userId,
      salidaId: salidaId,
    });

    if (!ticket) {
      const nanoid = customAlphabet(
        "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
        24
      );
      ticket = await Ticket.create({
        userId: userId,
        salidaId: salidaId,
        paymentRef: String(pagoId),
        code: nanoid(),
        status: "issued",
        issuedAt: new Date(),
      });

    }

    // Enviar email SOLO si aún no fue enviado
    if (!ticket.emailSentAt) {
      const redeemUrl = `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL}/r/${ticket.code}`;
      const dataUrl = await qrPngDataUrl(redeemUrl);

      const emailId = await sendTicketEmail({
        userId: String(userId),
        salidaId: String(salidaId),
        redeemUrl,
        qrDataUrl: dataUrl,
      });

      // Marcar como enviado en el ticket
      ticket.emailSentAt = new Date();
      (ticket as any).emailId = emailId;
      await ticket.save();

    } else {

    }
  } catch (error) {

  }
}

// Función para notificar al creador sobre el pago aprobado
async function notificarCreadorPagoAprobado(
  salidaId: string,
  userId: string,
  metodoPago: string
) {
  try {
    // Obtener información de la salida y el usuario
    const salida = await SalidaSocial.findById(salidaId);
    const usuario = await User.findById(userId);

    if (!salida || !usuario) {

      return;
    }

    // No notificar si el creador es el mismo usuario (no debería pasar, pero por las dudas)
    if (String(salida.creador_id) === String(userId)) {
      return;
    }

    // Crear notificación para el creador
    const mensaje =
      metodoPago === "mercadopago"
        ? `${usuario.firstname} ha pagado y se unió automáticamente a tu salida "${salida.nombre}".`
        : `${usuario.firstname} ha enviado el comprobante de pago para tu salida "${salida.nombre}". Revisa y aprueba su participación.`;

    const notificacion = await Notificacion.create({
      userId: salida.creador_id,
      fromUserId: userId,
      salidaId: salida._id,
      type:
        metodoPago === "mercadopago" ? "payment_approved" : "payment_pending",
      message: mensaje,
    });


    // Enviar notificación en tiempo real via Socket.IO
    await enviarNotificacionSocketIO(salida.creador_id, notificacion);

    // Enviar push notification si Firebase está disponible
    await enviarPushNotificationCreador(
      salida.creador_id,
      usuario.firstname || "Un usuario",
      salida.nombre,
      metodoPago
    );
  } catch (error) {

  }
}

// Función legacy mantenida por compatibilidad
// Las notificaciones ahora se recuperan automáticamente por polling
async function enviarNotificacionSocketIO(userId: string, notificacion: any) {
  // No se requiere acción - el sistema de polling recuperará la notificación automáticamente
  return;
}

// Función para enviar push notification al creador
async function enviarPushNotificationCreador(
  creadorId: string,
  usuarioNombre: string,
  salidaNombre: string,
  metodoPago: string
) {
  try {
    // Verificar si Firebase Admin está disponible
    if (!admin.apps.length) {

      return;
    }

    // Buscar token FCM del creador
    const fcmToken = await FCMToken.findOne({ user_id: creadorId });

    if (!fcmToken) {

      return;
    }

    // Preparar mensaje de push notification
    const title =
      metodoPago === "mercadopago"
        ? "💰 Pago confirmado"
        : "📄 Comprobante recibido";

    const body =
      metodoPago === "mercadopago"
        ? `${usuarioNombre} se unió automáticamente a "${salidaNombre}"`
        : `${usuarioNombre} envió un comprobante para "${salidaNombre}"`;

    const message = {
      notification: { title, body },
      data: {
        type:
          metodoPago === "mercadopago" ? "payment_approved" : "payment_pending",
        salidaId: String(creadorId),
        timestamp: new Date().toISOString(),
      },
      token: fcmToken.token,
    };

    // Enviar push notification
    const response = await admin.messaging().send(message);

  } catch (fcmError: any) {

    // Si el token es inválido, eliminarlo de la DB
    if (
      fcmError.code === "messaging/invalid-registration-token" ||
      fcmError.code === "messaging/registration-token-not-registered"
    ) {
      try {
        await FCMToken.deleteOne({ user_id: creadorId });

      } catch (dbError) {

      }
    }
  }
}
