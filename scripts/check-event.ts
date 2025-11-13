import { connectDB } from "@/libs/mongodb";
import SalidaSocial from "@/models/salidaSocial";

async function checkEvent() {
  const eventId = process.argv[2] || "69163ef0c2a2b4ac913a7a8b";

  console.log("🔍 Verificando evento con ID:", eventId);
  console.log("📊 Longitud del ID:", eventId.length);
  console.log("✅ Es formato válido:", /^[0-9a-fA-F]{24}$/.test(eventId));

  try {
    await connectDB();
    console.log("✅ Conectado a la base de datos\n");

    // Buscar el evento
    const event = await SalidaSocial.findById(eventId).lean();

    if (event) {
      console.log("✅ EVENTO ENCONTRADO:");
      console.log("   Nombre:", event.nombre);
      console.log("   Deporte:", event.deporte);
      console.log("   Localidad:", event.localidad);
      console.log("   Fecha:", event.fecha);
      console.log("   Creado:", event.createdAt);
    } else {
      console.log("❌ EVENTO NO ENCONTRADO");
      console.log("\nBuscando eventos similares...");

      // Buscar los últimos 5 eventos creados
      const recentEvents = await SalidaSocial.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("_id nombre deporte localidad createdAt")
        .lean();

      console.log("\n📋 Últimos 5 eventos en la BD:");
      recentEvents.forEach((e: any) => {
        console.log(`   ${e._id} - ${e.nombre} (${e.localidad})`);
      });
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }

  process.exit(0);
}

checkEvent();
