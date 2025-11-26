import { EmailService } from "@/services/emailService";

const emailService = new EmailService();

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  return await emailService.sendEmail({ to, subject, html });
}

export async function sendTicketEmail(
  to: string,
  userName: string,
  eventName: string,
  ticketCode: string,
  redeemUrl: string
) {
  const subject = `Tu ticket para ${eventName}`;
  const html = `
    <h1>Hola ${userName},</h1>
    <p>Aquí tienes tu ticket para <strong>${eventName}</strong>.</p>
    <p>Código: <strong>${ticketCode}</strong></p>
    <p>Puedes ver tu ticket aquí: <a href="${redeemUrl}">${redeemUrl}</a></p>
    <p>¡Disfruta el evento!</p>
  `;
  return await emailService.sendEmail({ to, subject, html });
}
