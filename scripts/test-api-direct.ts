import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env.local") });
dotenv.config({ path: path.join(__dirname, "../.env") });

import { connectDB } from "../src/libs/mongodb";
import SalidaSocial from "../src/models/salidaSocial";
import Sponsors from "../src/models/sponsors";
import User from "../src/models/user";

async function testAPIDirectly() {
  try {
    console.log("🔄 Connecting to DB...");
    await connectDB();
    console.log("✅ DB connected");

    // Ensure all models are loaded
    console.log("📝 Ensuring models are registered...");
    console.log("✅ User model:", User.modelName);
    console.log("✅ SalidaSocial model:", SalidaSocial.modelName);
    console.log("✅ Sponsors model:", Sponsors.modelName);

    const id = "68c87a6e2c42f87c9a38cb9c";
    console.log(`🔍 Testing API logic for ID: ${id}`);

    // Test step by step
    console.log("🔍 Step 1: Finding salida without populate...");
    const salida = await SalidaSocial.findById(id);

    if (!salida) {
      console.log("❌ Salida not found");
      return;
    }

    console.log("✅ Salida found:", salida.nombre);
    console.log("📊 Raw sponsors field:", salida.sponsors);

    console.log("🔍 Step 2: Testing populate sponsors only...");
    const salidaWithSponsors = await SalidaSocial.findById(id).populate("sponsors");

    if (!salidaWithSponsors) {
      console.log("❌ Salida with sponsors not found");
      return;
    }

    console.log("✅ Salida with sponsors found:", salidaWithSponsors.nombre);
    console.log("📊 Populated sponsors:", salidaWithSponsors.sponsors);

    const salidaObj = salidaWithSponsors.toObject();
    console.log("🎯 Final object sponsors:", salidaObj.sponsors);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testAPIDirectly();