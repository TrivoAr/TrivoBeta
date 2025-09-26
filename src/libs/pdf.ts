import PDFDocument from "pdfkit";
import { Buffer } from "node:buffer";

interface TicketInfo {
  eventName: string;
  location?: string;
  date?: string;
  time?: string;
  price?: string;
  userName?: string;
}

export async function buildQrPdf(
  title: string,
  pngBase64: string,
  ticketInfo?: TicketInfo
): Promise<string> {
  const doc = new PDFDocument({ size: "A5", margin: 40 });

  const chunks: Uint8Array[] = [];

  return await new Promise<string>((resolve) => {
    doc.on("data", (c: Buffer) => {
      chunks.push(c);
    });

    doc.on("end", () => {
      const buf = Buffer.concat(chunks as readonly Uint8Array[]);
      resolve(buf.toString("base64"));
    });

    const pageWidth = doc.page.width;
    const margin = 40;
    const centerX = pageWidth / 2;

    doc.rect(0, 0, pageWidth, 60).fill("#C95100");

    doc
      .fillColor("white")
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("TRIVO", centerX - 40, 20);

    // Reset position and color
    doc.fillColor("#333333");
    let currentY = 100;

    // Event title
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("ENTRADA DIGITAL", margin, currentY, {
        width: pageWidth - 2 * margin,
        align: "center",
      });

    currentY += 40;

    // Event name
    const eventName =
      ticketInfo?.eventName || title.replace("QR de acceso — ", "");
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .fillColor("#C95100")
      .text(eventName, margin, currentY, {
        width: pageWidth - 2 * margin,
        align: "center",
      });

    currentY += 35;

    // Event details if available
    if (ticketInfo) {
      doc.fontSize(12).fillColor("#666666").font("Helvetica");

      if (ticketInfo.location) {
        doc.text(`📍 ${ticketInfo.location}`, margin, currentY, {
          width: pageWidth - 2 * margin,
          align: "center",
        });
        currentY += 20;
      }

      if (ticketInfo.date || ticketInfo.time) {
        const dateTime = [ticketInfo.date, ticketInfo.time]
          .filter(Boolean)
          .join(" - ");
        doc.text(`📅 ${dateTime}`, margin, currentY, {
          width: pageWidth - 2 * margin,
          align: "center",
        });
        currentY += 20;
      }

      if (ticketInfo.price) {
        doc.text(`💰 ${ticketInfo.price}`, margin, currentY, {
          width: pageWidth - 2 * margin,
          align: "center",
        });
        currentY += 25;
      }
    }

    // QR Code with border
    const img = Buffer.from(pngBase64, "base64");
    const imgW = 200;
    const qrX = (pageWidth - imgW) / 2;

    // QR background
    doc
      .rect(qrX - 15, currentY - 15, imgW + 30, imgW + 30)
      .fillAndStroke("#ffffff", "#E5E5E5");

    // QR Code
    doc.image(img, qrX, currentY, { width: imgW });

    currentY += imgW + 50;

    // Instructions
    doc
      .fontSize(12)
      .fillColor("#333333")
      .font("Helvetica-Bold")
      .text("INSTRUCCIONES DE USO", margin, currentY, {
        width: pageWidth - 2 * margin,
        align: "center",
      });

    currentY += 25;

    doc
      .fontSize(10)
      .fillColor("#666666")
      .font("Helvetica")
      .text("1. Presentá este QR al ingresar al evento", margin, currentY, {
        width: pageWidth - 2 * margin,
        align: "left",
      });

    currentY += 15;

    doc.text("2. El código es válido una sola vez", margin, currentY, {
      width: pageWidth - 2 * margin,
      align: "left",
    });

    currentY += 15;

    doc.text("3. No transfierible ni reembolsable", margin, currentY, {
      width: pageWidth - 2 * margin,
      align: "left",
    });

    // Footer
    const footerY = doc.page.height - 40;
    doc
      .fontSize(8)
      .fillColor("#999999")
      .text("Generado por Trivo - www.trivo.com", margin, footerY, {
        width: pageWidth - 2 * margin,
        align: "center",
      });

    // User info if available
    if (ticketInfo?.userName) {
      doc
        .fontSize(9)
        .fillColor("#333333")
        .text(`Titular: ${ticketInfo.userName}`, margin, footerY - 15, {
          width: pageWidth - 2 * margin,
          align: "center",
        });
    }

    doc.end();
  });
}
