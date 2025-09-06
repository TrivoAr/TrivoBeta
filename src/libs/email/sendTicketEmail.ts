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
  const user   = (await User.findById(userId).lean()) as LeanUser;
  const salida = (await SalidaSocial.findById(salidaId).lean()) as LeanSalida;
  if (!user?.email) throw new Error("User without email");

  const titulo    = salida?.nombre ?? "la salida";
  const qrBase64  = dataUrlToBase64(qrDataUrl);
  const pdfBase64 = await buildQrPdf(`QR de acceso — ${titulo}`, qrBase64);

  const html = `
  <div style="font-family:system-ui,Arial,sans-serif">
    <h2>✅ Pago aprobado — Tu acceso a ${titulo}</h2>
    <p>Mostrá este QR al inicio. Se canjea una sola vez.</p>
    <p><a href="${redeemUrl}">Verificar mi entrada</a></p>
    <p style="margin:12px 0"><img src="${qrDataUrl}" width="256" height="256" alt="QR"/></p>
    <p style="color:#6b7280;font-size:12px">Si no ves la imagen, abrí los adjuntos <b>qr.png</b> o <b>entrada.pdf</b>.</p>
  </div>`;

  const resp = await resend.emails.send({
    from: process.env.RESEND_FROM ?? "Trivo <onboarding@resend.dev>",
    to: user.email,
    subject: `Tu QR para ${titulo}`,
    html,
    attachments: [
      { filename: "qr.png", content: qrBase64,  contentType: "image/png" },
      { filename: "entrada.pdf", content: pdfBase64, contentType: "application/pdf" },
    ],
  });

  const id = (resp as any)?.data?.id;
  const error = (resp as any)?.error;
  if (error) {
    console.error("[RESEND][ERROR]", error);
    throw new Error(typeof error === "string" ? error : JSON.stringify(error));
  }
  console.log("[RESEND] Enviado OK. id:", id);
  return id || "";
}
