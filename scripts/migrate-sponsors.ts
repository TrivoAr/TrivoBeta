import { connectDB } from "../src/libs/mongodb";
import SalidaSocial from "../src/models/salidaSocial";

async function migrateSponsorsField() {
  try {
    console.log("🔄 Conectando a la base de datos...");
    await connectDB();

    console.log("🔄 Buscando salidas con sponsors en formato string...");

    // Buscar salidas donde sponsors no es un array
    const salidas = await SalidaSocial.find({
      sponsors: { $exists: true, $ne: null },
    });

    console.log(`📊 Encontradas ${salidas.length} salidas con campo sponsors`);

    let migrated = 0;

    for (const salida of salidas) {
      // Si sponsors no es un array, convertirlo
      if (!Array.isArray(salida.sponsors)) {
        const originalValue = salida.sponsors;

        // Si es un string no vacío, convertir a array
        if (typeof originalValue === "string" && originalValue.trim() !== "") {
          salida.sponsors = [originalValue];
          await salida.save();
          migrated++;
          console.log(
            `✅ Migrada salida ${salida._id}: "${originalValue}" -> ["${originalValue}"]`
          );
        }
        // Si es string vacío o null, convertir a array vacío
        else {
          salida.sponsors = [];
          await salida.save();
          migrated++;
          console.log(
            `✅ Migrada salida ${salida._id}: ${originalValue} -> []`
          );
        }
      } else {
        console.log(`⏭️  Salida ${salida._id} ya tiene sponsors como array`);
      }
    }

    console.log(`🎉 Migración completada. ${migrated} salidas migradas.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en la migración:", error);
    process.exit(1);
  }
}

// Ejecutar la migración
migrateSponsorsField();
