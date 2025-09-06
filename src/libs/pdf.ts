// src/libs/pdf.ts
import PDFDocument from "pdfkit";
import { Buffer } from "node:buffer"; // 👈 asegura tipos de Node

export async function buildQrPdf(title: string, pngBase64: string): Promise<string> {
  const doc = new PDFDocument({ size: "A6", margin: 24 });

  // Guardamos chunks como Uint8Array (Buffer es Uint8Array)
  const chunks: Uint8Array[] = [];

  return await new Promise<string>((resolve) => {
    doc.on("data", (c: Buffer) => {
      // Buffer extiende Uint8Array, así que entra sin problema
      chunks.push(c);
    });

    doc.on("end", () => {
      // 👇 Cast explícito para contentar a TS en cualquier config
      const buf = Buffer.concat(chunks as readonly Uint8Array[]);
      resolve(buf.toString("base64"));
    });

    // Contenido del PDF
    doc.fontSize(14).text(title, { align: "center" });
    doc.moveDown();

    const img = Buffer.from(pngBase64, "base64");
    const imgW = 220;
    doc.image(img, (doc.page.width - imgW) / 2, 80, { width: imgW });

    doc.moveDown(2);
    doc
      .fontSize(10)
      .fillColor("#666")
      .text("Mostrá este QR al ingreso. Intransferible.", { align: "center" });

    doc.end();
  });
}
