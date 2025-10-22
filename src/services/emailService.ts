import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export interface EmailAttachment {
  filename: string;
  content: string; // base64
  contentType: string;
  cid?: string;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
  from?: string;
}

export class EmailService {
  private fromDefault = process.env.RESEND_FROM ?? "Soporte Trivo <noreply@trivo.com.ar>";

  async sendEmail({ to, subject, html, attachments, from }: SendEmailParams) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("Falta RESEND_API_KEY en el entorno");
    }

    const { data, error } = await resend.emails.send({
      from: from ?? this.fromDefault,
      to,
      subject,
      html,
      attachments,
    });

    if (error) {
      throw new Error("Error al enviar el correo");
    }

    return data;
  }
}
