import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: "Soporte Trivo <noreply@trivo.com.ar>",
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Error al enviar correo con Resend:", error);
      throw new Error("Fallo al enviar el correo");
    }

    return data;
  } catch (err) {
    console.error("Error al usar Resend:", err);
    throw err;
  }
}
