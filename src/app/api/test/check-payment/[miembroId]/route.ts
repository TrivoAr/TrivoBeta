import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ miembroId: string }> }
) {
  try {
    await connectDB();

    const { miembroId } = await params;

    const MiembroSalida = (await import("@/models/MiembroSalida")).default;
    const Pago = (await import("@/models/pagos")).default;

    // Buscar el miembro con populate (incluyendo pago_id)
    const miembro = await MiembroSalida.findById(miembroId)
      .populate("usuario_id", "firstname lastname email")
      .populate("salida_id", "nombre precio")
      .populate("pago_id", "estado comprobanteUrl tipoPago revenueTracked revenueTrackedAt")
      .lean();

    if (!miembro) {
      return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
    }

    const pago = (miembro as any).pago_id;

    const salida = (miembro as any).salida_id;
    const usuario = (miembro as any).usuario_id;

    return NextResponse.json({
      miembro: {
        id: miembroId,
        estado: (miembro as any).estado,
        createdAt: (miembro as any).createdAt,
      },
      usuario: usuario ? {
        nombre: `${usuario.firstname} ${usuario.lastname}`,
        email: usuario.email,
      } : null,
      salida: salida ? {
        nombre: salida.nombre,
        precio: salida.precio,
        precioConvertido: salida.precio ? parseFloat(String(salida.precio).replace(/[^\d.,]/g, "").replace(",", ".")) : null,
      } : "Salida no encontrada o eliminada",
      pago: pago ? {
        id: (pago as any)._id,
        estado: (pago as any).estado,
        tipoPago: (pago as any).tipoPago,
        comprobanteUrl: (pago as any).comprobanteUrl,
        revenueTracked: (pago as any).revenueTracked || false,
        revenueTrackedAt: (pago as any).revenueTrackedAt || null,
      } : "Pago no encontrado",
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
