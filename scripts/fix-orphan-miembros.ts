import { connectDB } from "@/libs/mongodb";
import MiembroSalida from "@/models/MiembroSalida";
import SalidaSocial from "@/models/salidaSocial";
import mongoose from "mongoose";

async function fixOrphanMiembros() {
  console.log("🔧 Iniciando limpieza de miembros huérfanos\n");

  try {
    await connectDB();
    console.log("✅ Conectado a la base de datos\n");

    // 1. Obtener todos los miembros
    const allMiembros = await MiembroSalida.find().lean();
    console.log(`📊 Total de miembros: ${allMiembros.length}\n`);

    let orphanCount = 0;
    let validCount = 0;
    const orphanIds: string[] = [];

    // 2. Verificar cada miembro
    console.log("🔍 Verificando integridad de datos...\n");

    for (const miembro of allMiembros) {
      const salidaId = (miembro as any).salida_id;

      if (!salidaId) {
        console.log(`   ⚠️ Miembro ${miembro._id} sin salida_id`);
        orphanCount++;
        orphanIds.push(miembro._id.toString());
        continue;
      }

      // Verificar si la salida existe
      const salidaExists = await SalidaSocial.exists({ _id: salidaId });

      if (!salidaExists) {
        console.log(`   ❌ Miembro ${miembro._id} referencia salida inexistente: ${salidaId}`);
        orphanCount++;
        orphanIds.push(miembro._id.toString());
      } else {
        validCount++;
      }
    }

    console.log(`\n📋 RESUMEN:`);
    console.log(`   ✅ Miembros válidos: ${validCount}`);
    console.log(`   ❌ Miembros huérfanos: ${orphanCount}`);

    if (orphanCount > 0) {
      console.log(`\n⚠️ Se encontraron ${orphanCount} miembros huérfanos.`);
      console.log(`\nPara eliminarlos, ejecuta:`);
      console.log(`db.miembrosalidass.deleteMany({ _id: { $in: [${orphanIds.slice(0, 5).map(id => `ObjectId("${id}")`).join(", ")}...] } })`);
    } else {
      console.log(`\n✅ No se encontraron miembros huérfanos.`);
    }

  } catch (error) {
    console.error("❌ Error:", error);
  }

  process.exit(0);
}

fixOrphanMiembros();
