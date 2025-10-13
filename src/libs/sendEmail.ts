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
