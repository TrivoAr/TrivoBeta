import QRCode from "qrcode";

export async function qrPngDataUrl(url: string) {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 512,
  });
}
