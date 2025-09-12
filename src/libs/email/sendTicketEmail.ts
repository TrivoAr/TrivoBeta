import { Resend } from "resend";
import User from "@/models/user";
import SalidaSocial from "@/models/salidaSocial";
import { buildQrPdf } from "@/libs/pdf";

const resend = new Resend(process.env.RESEND_API_KEY!);
type LeanUser   = { email?: string } | null;
type LeanSalida = { nombre?: string } | null;

function dataUrlToBase64(dataUrl: string) {
  const i = dataUrl.indexOf(",");
  return i === -1 ? "" : dataUrl.slice(i + 1);
}

export async function sendTicketEmail({
  userId, salidaId, redeemUrl, qrDataUrl,
}: { userId: string; salidaId: string; redeemUrl: string; qrDataUrl: string }): Promise<string> {
  try {
    console.log("[SEND_TICKET_EMAIL] Starting email process for user:", userId, "salida:", salidaId);
    
    // Check environment variables
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    console.log("[SEND_TICKET_EMAIL] Resend API key is present:", !!process.env.RESEND_API_KEY);
    
    const user = (await User.findById(userId).lean()) as LeanUser & { firstname?: string; lastname?: string };
    const salida = (await SalidaSocial.findById(salidaId).lean()) as LeanSalida & { 
      ubicacion?: string; 
      fecha?: string; 
      hora?: string; 
      precio?: string; 
    };
    
    if (!user) {
      throw new Error(`User not found with ID: ${userId}`);
    }
    
    if (!user.email) {
      throw new Error(`User ${userId} has no email address`);
    }
    
    if (!salida) {
      throw new Error(`SalidaSocial not found with ID: ${salidaId}`);
    }

    console.log("[SEND_TICKET_EMAIL] User found:", user.email, "Event:", salida.nombre);

    const titulo = salida?.nombre ?? "la salida";
    const qrBase64 = dataUrlToBase64(qrDataUrl);
    
    // Prepare ticket info for enhanced PDF
    const ticketInfo = {
      eventName: titulo,
      location: salida?.ubicacion,
      date: salida?.fecha,
      time: salida?.hora,
      price: salida?.precio ? `$${salida.precio}` : undefined,
      userName: user.firstname && user.lastname ? `${user.firstname} ${user.lastname}` : undefined
    };
    
    console.log("[SEND_TICKET_EMAIL] Generating PDF with info:", ticketInfo);
    const pdfBase64 = await buildQrPdf(`QR de acceso — ${titulo}`, qrBase64, ticketInfo);

  const html = `
  <div style="font-family:system-ui,Arial,sans-serif; max-width:600px; margin:0 auto; background:#ffffff;">
    <!-- Header -->
    <div style="background:#C95100; padding:20px; text-align:center;">
      <h1 style="color:white; margin:0; font-size:28px; font-weight:bold;">TRIVO</h1>
    </div>
    
    <!-- Content -->
    <div style="padding:30px 20px;">
      <h2 style="color:#C95100; text-align:center; margin:0 0 10px 0;">✅ Pago Aprobado</h2>
      <h3 style="color:#333; text-align:center; margin:0 0 20px 0; font-size:18px;">${titulo}</h3>
      
      ${ticketInfo.location ? `<p style="text-align:center; color:#666; margin:5px 0;">📍 ${ticketInfo.location}</p>` : ''}
      ${ticketInfo.date || ticketInfo.time ? `<p style="text-align:center; color:#666; margin:5px 0;">📅 ${[ticketInfo.date, ticketInfo.time].filter(Boolean).join(' - ')}</p>` : ''}
      ${ticketInfo.price ? `<p style="text-align:center; color:#666; margin:5px 0 20px 0;">💰 ${ticketInfo.price}</p>` : ''}
      
      <div style="background:#f8f9fa; padding:20px; border-radius:10px; text-align:center; margin:20px 0;">
        <p style="color:#333; font-weight:bold; margin:0 0 15px 0;">Tu entrada digital está lista</p>
        <img src="cid:qr-image" width="200" height="200" alt="QR Code" style="border:2px solid #e5e5e5; border-radius:8px;"/>
        <p style="color:#666; font-size:12px; margin:15px 0 0 0;">Mostrá este QR al ingresar al evento</p>
      </div>
      
      <div style="background:#fff3cd; border:1px solid #ffeaa7; border-radius:8px; padding:15px; margin:20px 0;">
        <h4 style="color:#856404; margin:0 0 10px 0; font-size:14px;">📋 Instrucciones importantes:</h4>
        <ul style="color:#856404; font-size:12px; margin:0; padding-left:20px;">
          <li>Presentá este QR al ingresar al evento</li>
          <li>El código es válido una sola vez</li>
          <li>No transfierible ni reembolsable</li>
          <li>Conservá este email como comprobante</li>
        </ul>
      </div>
      
      <div style="text-align:center; margin:20px 0;">
        <a href="${redeemUrl}" style="background:#C95100; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; font-weight:bold; display:inline-block;">Verificar mi entrada</a>
      </div>
      
      <p style="color:#999; font-size:11px; text-align:center; margin:20px 0 0 0;">
        Si no podés ver las imágenes, descargá el archivo <strong>entrada.pdf</strong> adjunto.
        <br>¿Problemas? Contactanos en soporte@trivo.com
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background:#f8f9fa; padding:15px; text-align:center; border-top:1px solid #e5e5e5;">
      <p style="color:#666; font-size:11px; margin:0;">
        Generado por <strong>Trivo</strong> - La plataforma para eventos deportivos
        <br>www.trivo.com
      </p>
    </div>
  </div>`;

  console.log("[SEND_TICKET_EMAIL] Sending email to:", user.email);
  console.log("[SEND_TICKET_EMAIL] PDF size:", pdfBase64.length, "characters");
  console.log("[SEND_TICKET_EMAIL] From address:", process.env.RESEND_FROM);
  
  // Debug: verificar si hay restricciones por dominio
  console.log("[SEND_TICKET_EMAIL] User email domain:", user.email.split('@')[1]);

  const resp = await resend.emails.send({
    from: process.env.RESEND_FROM ?? "Trivo <onboarding@resend.dev>",
    to: user.email,
    subject: `Tu QR para ${titulo}`,
    html,
    attachments: [
      { filename: "entrada.pdf", content: pdfBase64, contentType: "application/pdf" },
      { filename: "qr-code.png", content: qrBase64, contentType: "image/png", cid: "qr-image" },
    ],
  });

  console.log("[SEND_TICKET_EMAIL] Resend response:", JSON.stringify(resp, null, 2));

  const id = (resp as any)?.data?.id;
  const error = (resp as any)?.error;
  if (error) {
    console.error("[RESEND][ERROR]", error);
    throw new Error(typeof error === "string" ? error : JSON.stringify(error));
  }
  console.log("[RESEND] Email sent successfully. ID:", id);
  return id || "";
  
  } catch (error) {
    console.error("[SEND_TICKET_EMAIL] Fatal error:", error);
    throw error;
  }
}
