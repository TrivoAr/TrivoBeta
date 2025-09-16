import { connectDB } from "../src/libs/mongodb";
import Bares from "../src/models/bares";

async function checkBares() {
  try {
    console.log("🔗 Conectando a MongoDB...");
    await connectDB();
    console.log("✅ Conectado a MongoDB");

    console.log("📊 Obteniendo estadísticas de bares...");

    // Obtener todos los bares
    const allBares = await Bares.find({});
    const activeBares = await Bares.find({ activo: true });
    const inactiveBares = await Bares.find({ activo: false });

    console.log("\n📈 ESTADÍSTICAS:");
    console.log(`📊 Total de bares: ${allBares.length}`);
    console.log(`✅ Bares activos: ${activeBares.length}`);
    console.log(`❌ Bares inactivos: ${inactiveBares.length}`);

    if (allBares.length === 0) {
      console.log("\n⚠️ No hay bares en la base de datos");
      console.log("💡 Ejecuta 'npm run add-bares' para agregar bares de ejemplo");
      return;
    }

    console.log("\n📋 LISTA DE BARES:");
    console.log("=".repeat(60));

    activeBares.forEach((bar, index) => {
      console.log(`${index + 1}. ${bar.name}`);
      console.log(`   🆔 ID: ${bar._id}`);
      console.log(`   📍 Ubicación: ${bar.direccion || 'Sin dirección'}`);
      console.log(`   🌍 Coordenadas: ${bar.locationCoords.lat}, ${bar.locationCoords.lng}`);
      console.log(`   🖼️ Logo: ${bar.logo ? '✅' : '❌'}`);
      console.log(`   🎠 Carrusel: ${bar.imagenesCarrusel.length} imágenes`);
      console.log(`   📅 Creado: ${bar.createdAt.toLocaleDateString()}`);
      console.log(`   📝 Actualizado: ${bar.updatedAt.toLocaleDateString()}`);
      console.log("");
    });

    if (inactiveBares.length > 0) {
      console.log("🚫 BARES INACTIVOS:");
      console.log("-".repeat(40));
      inactiveBares.forEach((bar, index) => {
        console.log(`${index + 1}. ${bar.name} (ID: ${bar._id})`);
      });
      console.log("");
    }

    // Verificar integridad de datos
    console.log("🔍 VERIFICACIÓN DE INTEGRIDAD:");
    console.log("-".repeat(40));

    let hasIssues = false;

    for (const bar of allBares) {
      const issues = [];

      if (!bar.logo) issues.push("Sin logo");
      if (!bar.imagenesCarrusel || bar.imagenesCarrusel.length === 0) {
        issues.push("Sin imágenes de carrusel");
      }
      if (!bar.locationCoords || !bar.locationCoords.lat || !bar.locationCoords.lng) {
        issues.push("Coordenadas inválidas");
      }

      if (issues.length > 0) {
        hasIssues = true;
        console.log(`⚠️ ${bar.name}: ${issues.join(", ")}`);
      }
    }

    if (!hasIssues) {
      console.log("✅ Todos los bares tienen datos válidos");
    }

    console.log("\n🎉 Verificación completada!");

  } catch (error) {
    console.error("❌ Error al verificar bares:", error);
    throw error;
  }
}

// Ejecutar script
if (require.main === module) {
  checkBares()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Error:", error);
      process.exit(1);
    });
}

export { checkBares };