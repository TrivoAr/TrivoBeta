import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";

export async function GET() {
  try {
    await connectDB();

    // Importar modelos dinámicamente
    const User = (await import("@/models/user")).default;
    const Sponsors = (await import("@/models/sponsors")).default;
    const SalidaSocial = (await import("@/models/salidaSocial")).default;
    const MiembroSalida = (await import("@/models/MiembroSalida")).default;
    const Pago = (await import("@/models/pagos")).default;

    const results: any = {
      environment: process.env.NODE_ENV,
      mongodbConnected: true,
      modelsRegistered: {
        User: !!User,
        Sponsors: !!Sponsors,
        SalidaSocial: !!SalidaSocial,
        MiembroSalida: !!MiembroSalida,
        Pago: !!Pago,
      },
    };

    // 1. Test de salidas con precio
    const salidasConPrecio = await SalidaSocial.find({ precio: { $exists: true, $ne: null } })
      .limit(3)
      .select("_id nombre precio")
      .lean();

    results.salidasConPrecio = salidasConPrecio.length;
    results.ejemploSalida = salidasConPrecio[0] || null;

    // 2. Test de populate con precio
    try {
      const miembroTest = await MiembroSalida.findOne()
        .populate("salida_id", "nombre precio cupo")
        .populate("usuario_id", "firstname lastname")
        .lean();

      if (miembroTest) {
        const salida = (miembroTest as any).salida_id;
        const usuario = (miembroTest as any).usuario_id;
        results.populateTest = {
          success: true,
          tieneSalida: !!salida,
          tieneUsuario: !!usuario,
          tienePrecio: !!salida?.precio,
          salida: salida ? {
            nombre: salida.nombre,
            precio: salida.precio,
          } : null,
        };
      } else {
        results.populateTest = { success: false, reason: "No hay miembros" };
      }
    } catch (populateError: any) {
      results.populateTest = {
        success: false,
        error: populateError.message,
      };
    }

    // 3. Miembros pendientes
    const miembrosPendientes = await MiembroSalida.countDocuments({ estado: "pendiente" });
    results.miembrosPendientes = miembrosPendientes;

    // 4. Pagos sin trackear
    const pagosSinTrackear = await Pago.countDocuments({
      estado: "aprobado",
      $or: [
        { revenueTracked: { $exists: false } },
        { revenueTracked: false }
      ]
    });
    results.pagosSinTrackear = pagosSinTrackear;

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
