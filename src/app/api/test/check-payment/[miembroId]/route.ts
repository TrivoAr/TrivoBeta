import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";

export async function GET(
  req: NextRequest,
  { params }: { params: { miembroId: string } }
) {
  try {
    await connectDB();

    const MiembroSalida = (await import("@/models/MiembroSalida")).default;
    const Pago = (await import("@/models/pagos")).default;
    const SalidaSocial = (await import("@/models/salidaSocial")).default;
    const User = (await import("@/models/user")).default;

    // Buscar el miembro con populate
    const miembro = await MiembroSalida.findById(params.miembroId)
      .populate("usuario_id", "firstname lastname email")
      .populate("salida_id", "nombre precio")
      .lean();

    if (!miembro) {
      return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
    }

    // Buscar el pago asociado
    const pago = await Pago.findOne({ miembro_id: params.miembroId }).lean();

    const salida = (miembro as any).salida_id;
    const usuario = (miembro as any).usuario_id;

    return NextResponse.json({
      miembro: {
        id: params.miembroId,
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
        id: pago._id,
        estado: pago.estado,
        metodoPago: (pago as any).metodoPago,
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
