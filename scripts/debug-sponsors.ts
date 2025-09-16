import { connectDB } from "../src/libs/mongodb";
import SalidaSocial from "../src/models/salidaSocial";
import Sponsors from "../src/models/sponsors";

async function debugSponsors() {
  try {
    await connectDB();
    
    console.log("🔍 Debugging sponsor details...");
    
    // Get the salidas with sponsors
    const salidasWithSponsors = await SalidaSocial.find({
      sponsors: { $exists: true, $ne: [] }
    }).populate('sponsors');
    
    console.log(`📊 Found ${salidasWithSponsors.length} salidas with sponsors`);
    
    for (const salida of salidasWithSponsors) {
      console.log(`\n📄 Salida: ${salida.nombre}`);
      console.log(`   ID: ${salida._id}`);
      console.log(`   Sponsors populated:`, salida.sponsors);
    }
    
    // Also get all sponsors in the DB
    const allSponsors = await Sponsors.find({});
    console.log(`\n🏷️  All sponsors in DB:`, allSponsors);
    
    process.exit(0);
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

debugSponsors();