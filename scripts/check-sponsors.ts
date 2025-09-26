import { connectDB } from "../src/libs/mongodb";
import SalidaSocial from "../src/models/salidaSocial";
import Sponsors from "../src/models/sponsors";

async function checkSponsors() {
  try {
    await connectDB();

    console.log("🔍 Verificando sponsors en salidas...");

    const salidas = await SalidaSocial.find({}).select("_id nombre sponsors");

    console.log(`📊 Total de salidas: ${salidas.length}`);

    for (const salida of salidas) {
      console.log(`\n📄 Salida: ${salida.nombre} (${salida._id})`);
      console.log(`   Sponsors:`, salida.sponsors);
      console.log(`   Type:`, typeof salida.sponsors);
      console.log(`   IsArray:`, Array.isArray(salida.sponsors));
      console.log(`   Length:`, salida.sponsors?.length || "N/A");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkSponsors();
