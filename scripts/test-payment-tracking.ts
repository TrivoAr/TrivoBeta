import { connectDB } from "@/libs/mongodb";
// Importar modelos en orden para asegurar registro en Mongoose
import User from "@/models/user";
import Sponsors from "@/models/sponsors";
import SalidaSocial from "@/models/salidaSocial";
import Pago from "@/models/pagos";
import MiembroSalida from "@/models/MiembroSalida";

async function testPaymentTracking() {
  console.log("🧪 Iniciando test de tracking de pagos\n");

  try {
    await connectDB();
    console.log("✅ Conectado a la base de datos\n");

    // 1. Verificar que las salidas tienen precio
    console.log("📊 1. Verificando salidas con precio...");
    const salidasConPrecio = await SalidaSocial.find({ precio: { $exists: true, $ne: null } })
      .limit(5)
      .select("_id nombre precio localidad")
      .lean();

    console.log(`   Encontradas ${salidasConPrecio.length} salidas con precio:`);
    salidasConPrecio.forEach((s: any) => {
      console.log(`   - ${s.nombre}: ${s.precio} (${s.localidad})`);
    });
    console.log("");

    // 2. Verificar populate de salida_id con precio
    console.log("🔗 2. Verificando populate de salida_id...");
    const miembroConSalida = await MiembroSalida.findOne()
      .populate("salida_id", "nombre precio cupo")
      .lean();

    if (miembroConSalida && (miembroConSalida as any).salida_id) {
      const salida = (miembroConSalida as any).salida_id;
      console.log(`   ✅ Populate funciona correctamente`);
      console.log(`   - Salida: ${salida.nombre}`);
      console.log(`   - Precio: ${salida.precio}`);
      console.log(`   - Cupo: ${salida.cupo}`);
    } else {
      console.log(`   ⚠️ No se encontraron miembros o el populate falló`);
    }
    console.log("");

    // 3. Verificar miembros pendientes de aprobación
    console.log("⏳ 3. Verificando miembros pendientes...");
    const miembrosPendientes = await MiembroSalida.find({ estado: "pendiente" })
      .populate("usuario_id", "firstname lastname email")
      .populate("salida_id", "nombre precio")
      .limit(5)
      .lean();

    console.log(`   Encontrados ${miembrosPendientes.length} miembros pendientes:`);
    miembrosPendientes.forEach((m: any) => {
      const usuario = m.usuario_id;
      const salida = m.salida_id;
      console.log(`   - ${usuario?.firstname} ${usuario?.lastname}`);
      console.log(`     Salida: ${salida?.nombre}`);
      console.log(`     Precio: ${salida?.precio}`);
      console.log(`     ID miembro: ${m._id}`);
    });
    console.log("");

    // 4. Verificar pagos sin trackear
    console.log("💰 4. Verificando pagos sin trackear...");
    const pagosSinTrackear = await Pago.find({
      estado: "aprobado",
      $or: [
        { revenueTracked: { $exists: false } },
        { revenueTracked: false }
      ]
    })
      .limit(5)
      .lean();

    console.log(`   Encontrados ${pagosSinTrackear.length} pagos aprobados sin trackear:`);
    pagosSinTrackear.forEach((p: any) => {
      console.log(`   - Pago ID: ${p._id}`);
      console.log(`     Miembro ID: ${p.miembro_id}`);
      console.log(`     Estado: ${p.estado}`);
      console.log(`     Método: ${p.metodoPago}`);
    });
    console.log("");

    // 5. Verificar modelos registrados
    console.log("📋 5. Verificando modelos de Mongoose...");
    const modelosRegistrados = Object.keys((await import("mongoose")).default.models);
    const modelosRequeridos = ["User", "SalidaSocial", "MiembroSalida", "Pago", "Sponsors"];

    console.log("   Modelos registrados:");
    modelosRequeridos.forEach(modelo => {
      const registrado = modelosRegistrados.includes(modelo);
      console.log(`   ${registrado ? "✅" : "❌"} ${modelo}`);
    });
    console.log("");

    // 6. Test de conversión de precio
    console.log("🔢 6. Test de conversión de precios...");
    const preciosTest = ["$15.000", "15000", "$15,000.50", "15.000,50", "15000.00"];

    preciosTest.forEach(precioStr => {
      const limpio = String(precioStr)
        .replace(/[^\d.,]/g, "")
        .replace(",", ".");
      const numero = parseFloat(limpio);
      console.log(`   "${precioStr}" → ${numero}`);
    });
    console.log("");

    // 7. Resumen final
    console.log("📝 RESUMEN:");
    console.log(`   ✅ Conexión a BD: OK`);
    console.log(`   ${salidasConPrecio.length > 0 ? "✅" : "❌"} Salidas con precio: ${salidasConPrecio.length}`);
    console.log(`   ${miembroConSalida ? "✅" : "❌"} Populate de salida_id: ${miembroConSalida ? "OK" : "FALLO"}`);
    console.log(`   ⏳ Miembros pendientes: ${miembrosPendientes.length}`);
    console.log(`   💰 Pagos sin trackear: ${pagosSinTrackear.length}`);
    console.log("");

    if (miembrosPendientes.length > 0) {
      console.log("💡 SIGUIENTE PASO:");
      console.log("   Aprueba uno de estos miembros pendientes y verifica los logs en Vercel");
      console.log(`   Ejemplo: PATCH /api/social/miembros/${miembrosPendientes[0]._id}`);
      console.log(`   Body: { "estado": "aprobado" }`);
    }

  } catch (error) {
    console.error("❌ Error en el test:", error);
  }

  process.exit(0);
}

testPaymentTracking();
