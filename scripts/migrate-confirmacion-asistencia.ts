import * as fs from "fs";
import * as path from "path";

// Cargar .env.local ANTES de hacer cualquier otra cosa
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (value) {
        process.env[key] = value;
      }
    }
  });
  console.log("✅ Variables de entorno cargadas\n");
}

// Ahora sí importar los módulos
import("../src/libs/mongodb").then((mongodbModule) => {
  return import("../src/models/ClubTrekkingMembership");
}).then(() => {
  // Ya tenemos todos los imports, ejecutar migración
  return migrate();
});

async function migrate() {
  const connectDB = (await import("../src/libs/mongodb")).default;
  const ClubTrekkingMembership = (await import("../src/models/ClubTrekkingMembership")).default;

  try {
    console.log("🚀 Iniciando migración de sistema de confirmación de asistencia...\n");

    // Conectar a MongoDB
    await connectDB();
    console.log("✅ Conectado a MongoDB\n");

    // Obtener todas las membresías
    const memberships = await ClubTrekkingMembership.find({});
    console.log(`📊 Total de membresías encontradas: ${memberships.length}\n`);

    let updated = 0;

    for (const membership of memberships) {
      let needsUpdate = false;

      // Actualizar historialSalidas con nuevos campos
      if (membership.historialSalidas && membership.historialSalidas.length > 0) {
        membership.historialSalidas.forEach((salida: any) => {
          if (salida.asistenciaConfirmada === undefined) {
            salida.asistenciaConfirmada = null; // Pendiente por defecto
            needsUpdate = true;
          }
        });
      }

      // Agregar campo penalizacion si no existe
      if (!membership.penalizacion) {
        membership.penalizacion = {
          activa: false,
          inasistenciasConsecutivas: 0,
          diasRestantes: 0,
          historialPenalizaciones: [],
        };
        needsUpdate = true;
      }

      if (needsUpdate) {
        await membership.save();
        updated++;
        console.log(`✅ Actualizada membresía: ${membership._id}`);
      }
    }

    console.log(`\n✅ Migración completada exitosamente!`);
    console.log(`📊 Total de membresías actualizadas: ${updated} de ${memberships.length}`);

    // Verificar índices
    try {
      await ClubTrekkingMembership.createIndexes();
      console.log("✅ Índices creados/verificados");
    } catch (error: any) {
      if (error.code === 86) {
        console.log("⚠️  Índices ya existen, continuando...");
      } else {
        throw error;
      }
    }

    console.log("\n🎉 Migración finalizada sin errores!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante la migración:", error);
    process.exit(1);
  }
}
