// libs/mailer.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPaymentStatusEmail(to: string, estado: string) {
  let subject = "Estado de tu pago";
  let body = "";

  if (estado === "aprobado") {
    subject = "✅ Tu pago fue aprobado";
    body = "¡Felicitaciones! Tu pago fue aprobado. Ya tienes tu lugar asegurado.";
  } else if (estado === "rechazado") {
    subject = "❌ Tu pago fue rechazado";
    body = "Lo sentimos, tu pago fue rechazado. Intenta nuevamente con otro medio.";
  } else {
    subject = "ℹ️ Estado de tu pago actualizado";
    body = `El estado de tu pago ahora es: ${estado}.`;
  }

  try {
    await resend.emails.send({
      from: "Equipo Trivo <nombre@resend.dev>",
      to,
      subject,
      html: `<p>${body}</p>`,
    });
    console.log(`📧 Email enviado a ${to}`);
  } catch (error) {
    console.error("❌ Error enviando email:", error);
  }
}
